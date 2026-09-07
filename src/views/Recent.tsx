import React, { useMemo, useState } from 'react';
import type { Contract } from '../types';
import { num, wonShort } from '../lib/util';
import { SectionTitle, Stat } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

const MINS = [
  { label: '전체', v: 0 },
  { label: '1천만원 이상', v: 10_000_000 },
  { label: '5천만원 이상', v: 50_000_000 },
];

export const Recent: React.FC<{ rows: Contract[] }> = ({ rows }) => {
  const [min, setMin] = useState(0);

  const sorted = useMemo(
    () => rows.filter((r) => r.amount >= min).sort((a, b) => b.date.localeCompare(a.date)),
    [rows, min],
  );

  /** 가장 최근 계약일 기준 최근 30일 */
  const recent30 = useMemo(() => {
    if (sorted.length === 0) return [];
    const last = Date.parse(sorted[0].date);
    return sorted.filter((r) => last - Date.parse(r.date) <= 30 * 86_400_000);
  }, [sorted]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle count={sorted.length} desc="계약일자 최신순">최근 계약</SectionTitle>
        <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm font-bold">
          {MINS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => setMin(m.v)}
              aria-pressed={min === m.v}
              className={`px-3 py-1.5 transition-colors ${
                min === m.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3">
        <Stat label="최근 30일 건수" value={num(recent30.length)} sub="가장 최근 계약일 기준" />
        <Stat label="최근 30일 금액" value={wonShort(recent30.reduce((s, r) => s + r.amount, 0))} />
        <Stat label="최근 30일 업체" value={num(new Set(recent30.map((r) => r.pkey)).size)} />
      </div>

      <ContractTable rows={sorted} initial={30} step={70} />
    </div>
  );
};
