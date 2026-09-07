import React, { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import type { Contract } from '../types';
import { rollup } from '../lib/rules';
import { kindLabel, num, wonShort } from '../lib/util';
import { downloadCsv, safeName, toCsv } from '../lib/csv';
import { Badge, EmptyState, SectionTitle } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

export const Lookup: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  // 기본은 기관으로 찾기 — 대부분 '우리 학교/우리 청은 어떤가'로 시작한다
  const [by, setBy] = useState<'inst' | 'partner'>('inst');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(null);

  const list = useMemo(() => rollup(rows, by), [rows, by]);

  /** 검색에 걸린 것 전부. 내려받기는 이걸 담는다. */
  const matched = useMemo(() => {
    const t = q.trim();
    if (!t) return list;
    const low = t.toLowerCase();
    return list.filter((r) => r.key.toLowerCase().includes(low));
  }, [list, q]);
  /** 화면에 그리는 몫만 잘라 쓴다(수천 줄을 한 번에 그리면 느려진다) */
  const [shown, setShown] = useState(50);
  const filtered = useMemo(() => matched.slice(0, shown), [matched, shown]);

  const detail = picked ? list.find((r) => r.key === picked) : null;

  /** 지금 화면에 뜬 집계 목록을 그대로 내린다(검색어를 걸었으면 걸린 것만). */
  const downloadList = () => {
    const what = by === 'inst' ? '기관' : '업체';
    downloadCsv(
      safeName(`${year}년_1인수의계약_${what}별집계${q.trim() ? `_${q.trim()}` : ''}`),
      toCsv(
        by === 'inst'
          ? ['기관분류', '기관', '건수', '합계금액(원)', '거래업체수']
          : ['업체', '건수', '합계금액(원)', '거래기관수'],
        // 화면에 50곳만 보여도 파일에는 **걸린 것 전부**를 담는다
        matched.map((r) =>
          by === 'inst'
            ? [kindLabel(r.items[0].kind), r.key, r.count, r.total, r.partners]
            : [r.key, r.count, r.total, r.partners],
        ),
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
            {(['inst', 'partner'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => {
                  setBy(k);
                  setPicked(null);
                }}
                aria-pressed={by === k}
                className={`px-3 py-2 transition-colors ${
                  by === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                {k === 'partner' ? '업체로 찾기' : '기관으로 찾기'}
              </button>
            ))}
          </div>
          <label className="flex-1 min-w-[16rem] relative">
            <span className="sr-only">{by === 'partner' ? '업체 이름' : '기관 이름'}</span>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="text"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPicked(null);
                setShown(50);
              }}
              placeholder={by === 'partner' ? '업체 이름 일부' : '학교·기관 이름 일부'}
              className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm
                         focus:border-blue-600 outline-none"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            {q.trim()
              ? `${num(matched.length)}곳 걸림 · ${num(filtered.length)}곳 표시`
              : `${year}년 계약 금액 순으로 ${num(filtered.length)}곳 표시 (전체 ${num(matched.length)}곳)`}
          </p>
          {!picked && matched.length > 0 && (
            <button
              type="button"
              onClick={downloadList}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300 bg-white
                         text-sm font-bold text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              이 목록 엑셀로 내려받기
              <span className="text-xs font-medium text-slate-400 tabular-nums">{num(matched.length)}곳</span>
            </button>
          )}
        </div>
      </div>

      {detail ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setPicked(null)}
            className="text-sm font-bold text-slate-600 hover:text-blue-700"
          >
            ← 목록으로
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {by === 'inst' && <Badge tone="slate">{kindLabel(detail.items[0].kind)}</Badge>}
            <SectionTitle count={detail.count} desc={`합계 ${wonShort(detail.total)}`}>
              {detail.key}
            </SectionTitle>
          </div>
          <ContractTable
            rows={[...detail.items].sort((a, b) => b.date.localeCompare(a.date))}
            hideInst={by === 'inst'}
            hidePartner={by === 'partner'}
            downloadName={`${year}년_1인수의계약_${detail.key}`}
          />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={<Search className="w-6 h-6" />} title="찾는 이름이 없습니다" desc="이름 일부만 넣어 보세요." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs">
                <th scope="col" className="text-left font-bold px-4 py-2">{by === 'partner' ? '업체' : '기관'}</th>
                <th scope="col" className="text-right font-bold px-4 py-2">건수</th>
                <th scope="col" className="text-right font-bold px-4 py-2">합계 금액</th>
                <th scope="col" className="text-right font-bold px-4 py-2 whitespace-nowrap">
                  {by === 'partner' ? '거래 기관 수' : '거래 업체 수'}
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.key}
                  className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                  onClick={() => setPicked(r.key)}
                >
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-2">
                      {by === 'inst' && <Badge tone="slate">{kindLabel(r.items[0].kind)}</Badge>}
                      <button type="button" className="font-bold text-slate-900 hover:text-blue-700 text-left">
                        {r.key}
                      </button>
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{num(r.count)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">{wonShort(r.total)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{num(r.partners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length < matched.length && (
            <div className="p-3 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShown(shown + 200)}
                className="px-3 py-2 rounded-md border border-slate-300 text-sm font-bold text-slate-700
                           hover:border-blue-600 hover:text-blue-700 transition-colors"
              >
                {num(Math.min(200, matched.length - filtered.length))}곳 더 보기 · 남은{' '}
                {num(matched.length - filtered.length)}곳
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
