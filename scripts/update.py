#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""1인 수의계약 현황 갱신기 (새로 올라온 것만).

전수 수집(collect.py)은 연도당 50~100번 요청이라 매일 돌릴 일이 아니다.
목록은 최신순이므로, 앞쪽부터 훑다가 이미 갖고 있는 건이 연달아 나오면 멈춘다.
보통 한두 번 요청으로 끝난다 — 이미 받은 건은 다시 받지 않는다.

스스로 고친다:
  · 가진 자료가 아예 없으면 그 해를 전수로 받는다.
  · 다 받은 뒤 사이트 표기 건수와 DRIFT_TOLERANCE 넘게 어긋나면(오래 안 돌렸거나,
    목록 뒤쪽에 뒤늦게 끼어든 건이 있거나, 원문이 삭제됐을 때) 그 해를 전수로 다시 받는다.
그래서 매일 돌리든 한 달 만에 돌리든 결과가 사이트와 맞는다.

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
# 사이트 표기 건수와 이만큼 넘게 어긋나면 그 해를 전수로 다시 받는다.
# 수집 도중에도 새 건이 올라오므로 한두 건 차이는 정상이다.
DRIFT_TOLERANCE = 3


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
        print(f"[{year}] 가진 자료가 없다. 전수 수집으로 시작한다.", flush=True)
        collect.collect_year(year)
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
    gap = len(rows) - total
    if gap == 0:
        return

    # 앞쪽만 훑는 방식이라 놓치는 경우가 있다 — 오래 안 돌렸거나, 목록 뒤쪽에 뒤늦게
    # 끼어든 건이 있거나, 원문이 삭제됐을 때다. 어긋남이 크면 말없이 두지 말고 그 해를 다시 받는다.
    # 수집하는 동안에도 새 건이 올라오므로 한두 건 차이는 정상으로 본다.
    if abs(gap) > DRIFT_TOLERANCE:
        print(f"    ※ 사이트 표기 {total:,}건과 {gap:+,}건 차이. 앞쪽만 봐서는 못 맞춘다 — 전수 수집으로 다시 맞춘다.", flush=True)
        collect.collect_year(year)
    else:
        print(f"    ※ 사이트 표기 {total:,}건과 {gap:+,}건 차이(허용 범위).", flush=True)


def main():
    years = [int(a) for a in sys.argv[1:]] or [datetime.now().year]
    for y in years:
        update_year(y)
    collect.write_index()


if __name__ == "__main__":
    main()
