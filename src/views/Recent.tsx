import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Contract } from '../types';
import { num, wonShort } from '../lib/util';
import { SectionTitle, Stat } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

const MINS = [
  { label: '전체', v: 0 },
  { label: '1천만원 이상', v: 10_000_000 },
  { label: '5천만원 이상', v: 50_000_000 },
];

export const Recent: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  const [min, setMin] = useState(0);
  const [q, setQ] = useState('');

  const sorted = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows
      .filter((r) => r.amount >= min)
      // 기관·계약명·상대자 세 칸을 한꺼번에 훑는다. 어느 칸에 있는지 몰라도 찾게.
      .filter((r) => !t || `${r.inst} ${r.name} ${r.partner}`.toLowerCase().includes(t))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [rows, min, q]);

  /** 가장 최근 계약일 기준 최근 30일 */
  const recent30 = useMemo(() => {
    if (sorted.length === 0) return [];
    const last = Date.parse(sorted[0].date);
    return sorted.filter((r) => last - Date.parse(r.date) <= 30 * 86_400_000);
  }, [sorted]);

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <label className="block relative">
          <span className="sr-only">기관·계약명·업체 검색</span>
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="기관 이름, 계약명, 업체 이름 — 아무 거나 일부만"
            className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm
                       focus:border-blue-600 outline-none"
          />
        </label>
        {q.trim() && (
          <p className="text-xs text-slate-500 tabular-nums">{num(sorted.length)}건 걸림</p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle count={sorted.length} desc="계약일자 최신순">계약 목록</SectionTitle>
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

      <ContractTable rows={sorted} initial={30} step={70} downloadName={`${year}년_1인수의계약${q.trim() ? `_${q.trim()}` : '_전체'}`} />
    </div>
  );
};
