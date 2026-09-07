#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""1인 수의계약 현황 갱신기 (새로 올라온 것만).

전수 수집(collect.py)은 연도당 50~100번 요청이라 매일 돌릴 일이 아니다.
목록은 최신순이므로, 앞쪽부터 훑다가 이미 갖고 있는 건이 연달아 나오면 멈춘다.
보통 한두 번 요청으로 끝난다.

사용법:
    python3 update.py            # 올해
    python3 update.py 2026 2025  # 특정 연도
"""
import json
import os
import sys
import time
from datetime import datetime

import collect  # 같은 폴더의 수집기에서 파서·요청을 그대로 쓴다

# 이미 가진 건이 이만큼 연달아 나오면 앞쪽은 다 봤다고 본다.
# 목록 뒤늦게 등록되는 건이 있어서 첫 건만 보고 끊지 않는다.
STOP_AFTER_KNOWN = 300
# 갱신은 목록 앞쪽만 보므로 한 번에 200건씩이면 충분하다.
UNIT = 200
MAX_PAGES = 25


def load(year):
    path = os.path.join(collect.DATA_DIR, f"contracts_{year}.json")
    if not os.path.exists(path):
        return None, path
    with open(path, encoding="utf-8") as f:
        return json.load(f), path


def unpack(d):
    """저장 형식(사전 + 번호)을 다시 평평한 행으로."""
    return [
        {
            "seq": seq,
            "no": 0,
            "inst": d["insts"][i],
            "name": name,
            "date": date,
            "amount": amt,
            "partner": d["partners"][p],
        }
        for seq, i, name, date, amt, p in d["rows"]
    ]


def update_year(year):
    data, path = load(year)
    if data is None:
        print(f"[{year}] 아직 전수 수집을 안 했다. 먼저 collect.py {year} 를 돌려라.", flush=True)
        return
    have = {r["seq"]: r for r in unpack(data)}
    before = len(have)

    known_streak = 0
    added = []
    total = data["site_total"]
    for page in range(1, MAX_PAGES + 1):
        html = collect.get(collect.list_url(year, page, unit=UNIT))
        tm = collect.TOTAL_RE.search(html)
        if tm:
            total = int(tm.group(1).replace(",", ""))
        rows = collect.parse(html)
        if not rows:
            break
        for r in rows:
            if r["seq"] in have:
                known_streak += 1
            else:
                known_streak = 0
                added.append(r)
                have[r["seq"]] = r
        if known_streak >= STOP_AFTER_KNOWN:
            break
        time.sleep(0.4)

    rows = sorted(have.values(), key=lambda r: (r["date"], r["seq"]))
    out = collect.pack(year, total, rows)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    print(f"[{year}] {before:,} -> {len(rows):,}건 (새 계약 {len(added):,}건)", flush=True)
    for r in sorted(added, key=lambda r: r["date"], reverse=True)[:20]:
        print(f"    {r['date']}  {r['amount']:>12,}원  {r['inst']}  {r['name'][:40]}  [{r['partner']}]", flush=True)
    if len(added) > 20:
        print(f"    … 외 {len(added) - 20:,}건", flush=True)
    if len(rows) != total:
        print(f"    ※ 사이트 표기 {total:,}건과 {len(rows) - total:+,}건 차이. 어긋남이 커지면 collect.py 로 전수 수집을 다시 해라.", flush=True)


def main():
    years = [int(a) for a in sys.argv[1:]] or [datetime.now().year]
    for y in years:
        update_year(y)
    collect.write_index()


if __name__ == "__main__":
    main()
