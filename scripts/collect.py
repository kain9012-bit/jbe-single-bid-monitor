#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""전북특별자치도교육청 1인 수의계약 현황 수집기 (전수 수집).

출처: https://www.jbe.go.kr/open/edufine/eduCntrlist1.jbe (계약정보공개 > 1인 수의계약현황)

이 화면은 오픈 API가 없다. 대신 검색조건이 전부 GET 파라미터고, 화면에 노출되지 않는
pageUnit 파라미터가 먹혀서 한 번에 1000건씩 받을 수 있다. 그래서 연간 5만~10만 건을
50~100번 요청으로 끝낸다.

산출물은 data/contracts_<연도>.json 한 개다. 기관명·상대자명이 심하게 반복되므로
사전(insts/partners)으로 빼고 행은 번호로만 참조한다. 그냥 객체 배열로 두면 파일이
서너 배로 불어난다.

사용법:
    python3 collect.py                # YEARS 전체
    python3 collect.py 2026           # 특정 연도
"""
import json
import os
import random
import re
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone, timedelta

BASE = "https://www.jbe.go.kr/open/edufine/eduCntrlist1.jbe"
VIEW = "https://www.jbe.go.kr/open/edufine/eduCntrView1.jbe"
MENU_CD = "DOM_000001003001009000"
PAGE_UNIT = 1000
YEARS = [2023, 2024, 2025, 2026]
KST = timezone(timedelta(hours=9))
UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/128.0 Safari/537.36"
)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
# 화면(Vite)이 그대로 읽어가는 자리. 여기 두면 dev/build 어느 쪽에서도 같은 경로다.
DATA_DIR = os.path.join(ROOT, "public", "data")

ROW_RE = re.compile(r"<tr>\s*<td>(\d+)</td>(.*?)</tr>", re.S)
SEQ_RE = re.compile(r"cm_seq_no=(\d+)")
CELL_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.S)
COMMENT_RE = re.compile(r"<!--.*?-->", re.S)
TOTAL_RE = re.compile(r"총 <strong>([\d,]+)</strong>건 \(<strong>\d+</strong>/(\d+)")
TAG_RE = re.compile(r"<[^>]+>")


def clean(s):
    """셀 하나를 사람이 읽는 문자열 목록으로. <br>은 칸 구분자로 살려 둔다."""
    s = re.sub(r"<br\s*/?>", "\x00", s, flags=re.I)
    s = TAG_RE.sub("", s)
    for a, b in (("&amp;", "&"), ("&lt;", "<"), ("&gt;", ">"),
                 ("&nbsp;", " "), ("&quot;", '"'), ("&#39;", "'")):
        s = s.replace(a, b)
    return [re.sub(r"\s+", " ", p).strip() for p in s.split("\x00")]


def get(url, tries=4):
    last = None
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=180) as r:
                return r.read().decode("utf-8", "replace")
        except Exception as e:  # noqa: BLE001
            last = e
            time.sleep(3 * (i + 1))
    raise RuntimeError(f"요청 실패: {url}\n  {last}")


def list_url(year, page, school=True, amt=0, unit=PAGE_UNIT):
    q = {
        "menuCd": MENU_CD,
        "cntr_mthd_div_nm": "1인수의",
        "fscl_y": str(year),
        "pageIndex": str(page),
        "pageUnit": str(unit),
        "cntr_amt": str(amt),
        "inst_clss_div": "2,3,4,5" if school else "2,3,4",
    }
    if school:
        q["schoolIn"] = "Y"
    return BASE + "?" + urllib.parse.urlencode(q, encoding="utf-8")


def parse(html):
    """목록 표에서 행을 뽑는다. 열 개수가 검색조건마다 달라서 상세 링크 칸을 기준으로 센다."""
    out = []
    for m in ROW_RE.finditer(html):
        no = m.group(1)
        body = COMMENT_RE.sub("", m.group(2))  # 화면에 숨겨둔 <td>가 주석으로 남아 있다
        seq = SEQ_RE.search(body)
        if not seq:
            continue
        cells = CELL_RE.findall(body)
        idx = next((i for i, c in enumerate(cells) if "eduCntrView1.jbe" in c), None)
        if idx is None or len(cells) < idx + 4:
            continue
        subject = clean(cells[idx])
        inst = subject[0] if subject else ""
        name = subject[1] if len(subject) > 1 else ""
        if not name and idx >= 1:  # 기관/계약명이 다른 칸으로 나뉜 화면
            inst, name = clean(cells[idx - 1])[0], (subject[0] if subject else "")
        out.append(
            {
                "seq": seq.group(1),
                "no": int(no),
                "inst": inst,
                "name": name,
                "date": clean(cells[idx + 1])[0],
                "amount": int(re.sub(r"[^\d]", "", clean(cells[idx + 2])[0]) or 0),
                "partner": clean(cells[idx + 3])[0],
            }
        )
    return out


def pack(year, total, rows):
    """사전 + 번호 참조로 압축한다. 그냥 객체 배열이면 파일이 3~4배가 된다."""
    insts, partners = {}, {}

    def idx(d, v):
        if v not in d:
            d[v] = len(d)
        return d[v]

    packed = [
        [r["seq"], idx(insts, r["inst"]), r["name"], r["date"], r["amount"],
         idx(partners, r["partner"])]
        for r in rows
    ]
    return {
        "year": year,
        "collected_at": datetime.now(KST).isoformat(timespec="seconds"),
        "source": BASE,
        "site_total": total,
        "collected": len(rows),
        "cols": ["seq", "inst", "name", "date", "amount", "partner"],
        "insts": list(insts),
        "partners": list(partners),
        "rows": packed,
    }


def collect_year(year):
    html = get(list_url(year, 1))
    tm = TOTAL_RE.search(html)
    if not tm:
        raise RuntimeError(f"{year}년 총 건수를 못 읽었다. 목록 화면 구조가 바뀌었을 수 있다.")
    total, pages = int(tm.group(1).replace(",", "")), int(tm.group(2))
    print(f"[{year}] 총 {total:,}건 / {pages}쪽", flush=True)

    seen = {r["seq"]: r for r in parse(html)}
    for p in range(2, pages + 1):
        for r in parse(get(list_url(year, p))):
            seen[r["seq"]] = r
        if p % 10 == 0 or p == pages:
            print(f"  {p}/{pages}쪽 누적 {len(seen):,}", flush=True)
        time.sleep(0.4 + random.random() * 0.4)

    rows = sorted(seen.values(), key=lambda r: (r["date"], r["no"]))
    out = pack(year, total, rows)
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, f"contracts_{year}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    gap = total - len(rows)
    note = "" if gap == 0 else f"  ※ 사이트 표기와 {gap:+,}건 차이(수집 중 새 건이 올라오면 생긴다)"
    mb = os.path.getsize(path) / 1024 / 1024
    print(f"[{year}] 저장 {len(rows):,}건 · {mb:.1f}MB -> {path}{note}", flush=True)
    return out


def write_index():
    """화면이 어떤 연도를 고를 수 있는지 알려주는 목록. 연도를 코드에 박아 두지 않으려는 것."""
    years = []
    for fn in os.listdir(DATA_DIR):
        m = re.fullmatch(r"contracts_(\d{4})\.json", fn)
        if not m:
            continue
        with open(os.path.join(DATA_DIR, fn), encoding="utf-8") as f:
            d = json.load(f)
        if d.get("collected"):
            years.append(
                {"year": int(m.group(1)), "collected": d["collected"],
                 "site_total": d.get("site_total", 0), "collected_at": d.get("collected_at", "")}
            )
    years.sort(key=lambda y: -y["year"])
    with open(os.path.join(DATA_DIR, "index.json"), "w", encoding="utf-8") as f:
        json.dump({"years": years}, f, ensure_ascii=False, indent=1)
    print("[index] " + ", ".join(f"{y['year']}({y['collected']:,})" for y in years), flush=True)


def main():
    years = [int(a) for a in sys.argv[1:]] or YEARS
    t0 = time.time()
    for y in years:
        collect_year(y)
    write_index()
    print(f"완료 ({time.time() - t0:.0f}초)", flush=True)


if __name__ == "__main__":
    main()
