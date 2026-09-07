import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import type { Contract } from '../types';
import { splitGroups } from '../lib/rules';
import { korDate, num, wonShort } from '../lib/util';
import { Badge, EmptyState, LimitNote, SectionTitle, Stat } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

const WINDOWS = [
  { label: '같은 날', v: 0 },
  { label: '7일', v: 7 },
  { label: '30일', v: 30 },
  { label: '90일', v: 90 },
];
const TOTALS = [
  { label: '1천만원', v: 10_000_000 },
  { label: '2천만원', v: 20_000_000 },
  { label: '5천만원', v: 50_000_000 },
];

export const Split: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  const [windowDays, setWindowDays] = useState(30);
  const [minTotal, setMinTotal] = useState(20_000_000);
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(
    () => splitGroups(rows, { windowDays, minCount: 2, minTotal }),
    [rows, windowDays, minTotal],
  );

  const sum = useMemo(
    () => ({
      items: groups.reduce((s, g) => s + g.count, 0),
      total: groups.reduce((s, g) => s + g.total, 0),
      insts: new Set(groups.map((g) => g.inst)).size,
    }),
    [groups],
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-700">
          같은 기관이 같은 업체와 맺은 계약을 날짜순으로 이어 붙여, 짧은 기간에 몰려 있고 합계가 큰 묶음을 찾습니다.
          한 건으로 했어야 할 계약을 나눠 맺었는지 살펴보는 자리입니다.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">묶는 간격</span>
            <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
              {WINDOWS.map((w) => (
                <button
                  key={w.label}
                  type="button"
                  onClick={() => setWindowDays(w.v)}
                  aria-pressed={windowDays === w.v}
                  className={`px-3 py-1.5 transition-colors ${
                    windowDays === w.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">이내</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">묶음 합계</span>
            <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
              {TOTALS.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => setMinTotal(t.v)}
                  aria-pressed={minTotal === t.v}
                  className={`px-3 py-1.5 transition-colors ${
                    minTotal === t.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">초과</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="걸린 묶음" value={num(groups.length)} />
        <Stat label="해당 계약" value={num(sum.items)} sub={`${year}년`} />
        <Stat label="합계 금액" value={wonShort(sum.total)} />
        <Stat label="관련 기관" value={num(sum.insts)} />
      </div>

      <LimitNote>
        한 사업을 나눈 것인지, 성격이 다른 별개 계약이 우연히 몰린 것인지는 목록만으로 가릴 수 없습니다.
        묶음을 펼쳐 <strong className="font-bold">계약명</strong>을 보고 판단하세요. 급식 재료·소모품처럼 반복 구매가
        당연한 항목도 그대로 걸립니다.
      </LimitNote>

      <SectionTitle count={groups.length} desc="합계 금액이 큰 순서">걸린 묶음</SectionTitle>

      {groups.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title="기준에 걸리는 묶음이 없습니다"
          desc="간격을 넓히거나 합계 기준을 낮춰서 다시 보세요."
        />
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => {
            const key = `${g.inst}|${g.partner}|${g.from}`;
            const on = open === key;
            return (
              <li key={key} className="bg-white rounded-lg border border-slate-200 hover:border-blue-600 transition-colors">
                <button
                  type="button"
                  onClick={() => setOpen(on ? null : key)}
                  aria-expanded={on}
                  className="w-full flex items-start gap-3 p-4 text-left"
                >
                  <span className="mt-0.5 text-slate-400 shrink-0">
                    {on ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <span className="flex-1 min-w-0 space-y-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{g.inst}</span>
                      <span className="text-slate-400">×</span>
                      <span className="font-bold text-slate-900">{g.partner}</span>
                      <Badge tone={g.spanDays <= 7 ? 'red' : 'amber'}>
                        {g.count}건 / {g.spanDays === 0 ? '같은 날' : `${g.spanDays}일`}
                      </Badge>
                    </span>
                    <span className="block text-sm text-slate-500 tabular-nums">
                      합계 {wonShort(g.total)} · {korDate(g.from)} ~ {korDate(g.to)}
                    </span>
                  </span>
                </button>
                {on && (
                  <div className="px-4 pb-4">
                    <ContractTable rows={g.items} hideInst hidePartner initial={g.count} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
