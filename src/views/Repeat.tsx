import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, ShieldCheck } from 'lucide-react';
import type { Contract } from '../types';
import { repeatGroups } from '../lib/rules';
import { korDate, num, wonShort } from '../lib/util';
import { Badge, EmptyState, LimitNote, SectionTitle, Stat } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

const AMOUNTS = [
  { label: '1천만원', v: 10_000_000 },
  { label: '2천만원', v: 20_000_000 },
  { label: '5천만원', v: 50_000_000 },
  { label: '제한 없음', v: 0 },
];
const COUNTS = [2, 3, 5];

export const Repeat: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  const [minAmount, setMinAmount] = useState(10_000_000);
  const [minCount, setMinCount] = useState(2);
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(
    () => repeatGroups(rows, { minAmount, minCount }),
    [rows, minAmount, minCount],
  );

  const sum = useMemo(
    () => ({
      insts: new Set(groups.map((g) => g.inst)).size,
      partners: new Set(groups.map((g) => g.partner)).size,
      items: groups.reduce((s, g) => s + g.count, 0),
      total: groups.reduce((s, g) => s + g.total, 0),
    }),
    [groups],
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-700">
          <strong className="font-bold text-slate-900">한 기관이 같은 업체와</strong>{' '}
          기준 금액 이상 계약을 한 해에 기준 횟수 이상 맺은 경우를 모읍니다.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">금액 기준</span>
            <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
              {AMOUNTS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => setMinAmount(a.v)}
                  aria-pressed={minAmount === a.v}
                  className={`px-3 py-1.5 transition-colors ${
                    minAmount === a.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">이상</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">횟수 기준</span>
            <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
              {COUNTS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setMinCount(c)}
                  aria-pressed={minCount === c}
                  className={`px-3 py-1.5 transition-colors ${
                    minCount === c ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  {c}회
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500">이상</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="걸린 조합" value={num(groups.length)} sub="기관 × 업체" />
        <Stat label="해당 계약" value={num(sum.items)} sub={`${year}년`} />
        <Stat label="합계 금액" value={wonShort(sum.total)} />
        <Stat label="관련 기관" value={num(sum.insts)} sub={`업체 ${num(sum.partners)}곳`} />
      </div>

      <LimitNote>
        <strong className="font-bold">이 목록은 확인이 필요한 후보이지 위반 판정이 아닙니다.</strong> 공개 목록에 있는
        기관명·상대자명·금액·일자만으로 셌습니다. 상대자는 &lsquo;주식회사·(주)·유한회사&rsquo; 같은 법인 형태 표기를 떼고
        이름이 같으면 한 곳으로 묶었으므로, 이름이 비슷한 다른 업체가 함께 묶이거나 상호를 바꾼 같은 업체가 갈릴 수 있습니다.
        계약 근거 조항과 예정금액은 목록에 없어서 판정에 넣지 않았습니다 — 각 건의 &lsquo;원문&rsquo; 링크로 확인하세요.
      </LimitNote>

      <SectionTitle count={groups.length} desc="건수가 많은 순서">걸린 조합</SectionTitle>

      {groups.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title="기준에 걸리는 조합이 없습니다"
          desc="금액이나 횟수 기준을 낮춰서 다시 보세요."
        />
      ) : (
        <ul className="space-y-2">
          {groups.map((g) => {
            const key = `${g.inst}|${g.partner}`;
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
                      <Badge tone={g.count >= 5 ? 'red' : g.count >= 3 ? 'amber' : 'blue'}>{g.count}회</Badge>
                    </span>
                    <span className="block text-sm text-slate-500 tabular-nums">
                      합계 {wonShort(g.total)} · {korDate(g.items[0].date)} ~ {korDate(g.items[g.count - 1].date)}
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
