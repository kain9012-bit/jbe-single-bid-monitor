import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Download, ShieldCheck } from 'lucide-react';
import type { Contract } from '../types';
import { repeatGroups } from '../lib/rules';
import { kindLabel, korDate, num, viewUrl, wonShort } from '../lib/util';
import { contractsCsv, downloadCsv, safeName, toCsv } from '../lib/csv';
import { Badge, EmptyState, LimitNote, SectionTitle, Stat } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

/** 건당 계약금액 기준 */
const AMOUNTS = [
  { label: '1천만원', v: 10_000_000 },
  { label: '2천만원', v: 20_000_000 },
  { label: '5천만원', v: 50_000_000 },
  { label: '제한 없음', v: 0 },
];
const COUNTS = [2, 3, 5];
/** 좁혀 보는 기간. 제한이 연 단위로 걸리므로 회계연도 전체가 기본이다. */
const WINDOWS: { label: string; v: number | null }[] = [
  { label: '회계연도 전체', v: null },
  { label: '90일', v: 90 },
  { label: '30일', v: 30 },
  { label: '7일', v: 7 },
  { label: '같은 날', v: 0 },
];

const Chips = <T,>({
  label,
  options,
  value,
  onChange,
  suffix,
}: {
  label: string;
  options: { label: string; v: T }[];
  value: T;
  onChange: (v: T) => void;
  suffix?: string;
}) => (
  <div className="flex items-center gap-2">
    <span className="text-xs font-bold text-slate-500">{label}</span>
    <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={`px-3 py-1.5 transition-colors ${
            value === o.v ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
    {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
  </div>
);

export const Repeat: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  const [minAmount, setMinAmount] = useState(10_000_000);
  const [minCount, setMinCount] = useState(2);
  const [windowDays, setWindowDays] = useState<number | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const groups = useMemo(
    () => repeatGroups(rows, { minAmount, minCount, windowDays }),
    [rows, minAmount, minCount, windowDays],
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

  const amountLabel = AMOUNTS.find((a) => a.v === minAmount)?.label ?? '';
  const tag = `${year}년_반복수의계약_건당${amountLabel}_${minCount}회이상${
    windowDays === null ? '' : `_${windowDays === 0 ? '같은날' : `${windowDays}일`}`
  }`;

  /** 걸린 조합을 한 줄씩. 어느 기관이 어느 업체와 몇 번인지만 훑을 때 쓴다. */
  const downloadGroups = () =>
    downloadCsv(
      safeName(`${tag}_조합요약`),
      toCsv(
        ['기관분류', '계약기관', '계약상대자', '건수', '합계금액(원)', '첫 계약일', '마지막 계약일', '기간(일)'],
        groups.map((g) => [
          kindLabel(g.items[0].kind),
          g.inst,
          g.partner,
          g.count,
          g.total,
          g.from,
          g.to,
          g.spanDays,
        ]),
      ),
    );

  /** 걸린 조합에 들어 있는 계약을 전부. 카드를 하나씩 열지 않아도 되게. */
  const downloadItems = () =>
    downloadCsv(
      safeName(`${tag}_계약전체`),
      contractsCsv(
        groups
          .flatMap((g) => g.items)
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((r) => ({
            date: r.date,
            kindLabel: kindLabel(r.kind),
            inst: r.inst,
            name: r.name,
            partner: r.partner,
            amount: r.amount,
            url: viewUrl(r.seq, r.year),
          })),
      ),
    );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <p className="text-sm text-slate-700">
          <strong className="font-bold text-slate-900">한 기관이 같은 업체와</strong>{' '}
          <strong className="font-bold text-slate-900">건당 {amountLabel}</strong>
          {minAmount > 0 ? ' 이상인 계약을' : ' 계약을'} 한 회계연도에 {minCount}회 이상 맺은 경우를 모읍니다.
          제한이 연 단위로 걸리므로 <strong className="font-bold text-slate-900">회계연도 전체</strong>가 기본입니다.
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Chips label="건당 금액" options={AMOUNTS} value={minAmount} onChange={setMinAmount} suffix="이상" />
          <Chips
            label="횟수"
            options={COUNTS.map((c) => ({ label: `${c}회`, v: c }))}
            value={minCount}
            onChange={setMinCount}
            suffix="이상"
          />
          <Chips label="기간 좁히기" options={WINDOWS} value={windowDays} onChange={setWindowDays} />
        </div>
        {windowDays !== null && (
          <p className="text-xs text-slate-600">
            지금은 <strong className="font-bold">그 기간 안에 붙어 있는 계약끼리만</strong> 세고 있습니다.
            한 사업을 나눠 맺은 것처럼 보이는 건을 좁혀 보는 용도이지, 연 단위 제한 판정이 아닙니다.
          </p>
        )}
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="걸린 조합" value={num(groups.length)} sub="기관 × 업체" />
        <Stat label="해당 계약" value={num(sum.items)} sub={`${year}년`} />
        <Stat label="합계 금액" value={wonShort(sum.total)} sub="참고용 — 기준은 건당 금액" />
        <Stat label="관련 기관" value={num(sum.insts)} sub={`업체 ${num(sum.partners)}곳`} />
      </div>

      <LimitNote>
        <strong className="font-bold">이 목록은 확인이 필요한 후보이지 위반 판정이 아닙니다.</strong> 공개 목록에 있는
        기관명·상대자명·금액·일자만으로 셌습니다. 상대자는 &lsquo;주식회사·(주)·재단법인&rsquo; 같은 법인 형태 표기를 떼고
        이름이 같으면 한 곳으로 묶었으므로, 이름이 비슷한 다른 업체가 함께 묶이거나 상호를 바꾼 같은 업체가 갈릴 수 있습니다.
        계약 근거 조항과 예정금액은 목록에 없어서 판정에 넣지 않았습니다 — 각 건의 &lsquo;원문&rsquo; 링크로 확인하세요.
      </LimitNote>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle count={groups.length} desc="건수가 많은 순서">걸린 조합</SectionTitle>
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadGroups}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300
                         text-sm font-bold text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              조합 요약
              <span className="text-xs font-medium text-slate-400 tabular-nums">{num(groups.length)}줄</span>
            </button>
            <button
              type="button"
              onClick={downloadItems}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300
                         text-sm font-bold text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              해당 계약 전체
              <span className="text-xs font-medium text-slate-400 tabular-nums">{num(sum.items)}건</span>
            </button>
          </div>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title="기준에 걸리는 조합이 없습니다"
          desc="금액이나 횟수 기준을 낮추거나, 기간 좁히기를 풀어서 다시 보세요."
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
                      <Badge tone={g.count >= 5 ? 'red' : g.count >= 3 ? 'amber' : 'blue'}>{g.count}회</Badge>
                      {windowDays !== null && (
                        <Badge tone={g.spanDays <= 7 ? 'red' : 'slate'}>
                          {g.spanDays === 0 ? '같은 날' : `${g.spanDays}일 안`}
                        </Badge>
                      )}
                    </span>
                    <span className="block text-sm text-slate-500 tabular-nums">
                      합계 {wonShort(g.total)} · {korDate(g.from)} ~ {korDate(g.to)}
                    </span>
                  </span>
                </button>
                {on && (
                  <div className="px-4 pb-4">
                    <ContractTable
                      rows={g.items}
                      hideInst
                      hidePartner
                      initial={g.count}
                      downloadName={`${year}년_반복수의계약_${g.inst}_${g.partner}`}
                    />
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
