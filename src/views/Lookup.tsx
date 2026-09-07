import React, { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { Contract } from '../types';
import { rollup } from '../lib/rules';
import { num, wonShort } from '../lib/util';
import { EmptyState, SectionTitle } from '../components/Ui';
import { ContractTable } from '../components/ContractTable';

export const Lookup: React.FC<{ rows: Contract[]; year: number }> = ({ rows, year }) => {
  const [by, setBy] = useState<'partner' | 'inst'>('partner');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<string | null>(null);

  const list = useMemo(() => rollup(rows, by), [rows, by]);

  const filtered = useMemo(() => {
    const t = q.trim();
    if (!t) return list.slice(0, 50);
    const low = t.toLowerCase();
    return list.filter((r) => r.key.toLowerCase().includes(low)).slice(0, 200);
  }, [list, q]);

  const detail = picked ? list.find((r) => r.key === picked) : null;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-md border border-slate-300 bg-white overflow-hidden text-sm font-bold">
            {(['partner', 'inst'] as const).map((k) => (
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
              }}
              placeholder={by === 'partner' ? '업체 이름 일부' : '학교·기관 이름 일부'}
              className="w-full rounded-md border border-slate-300 bg-white pl-9 pr-3 py-2 text-sm
                         focus:border-blue-600 outline-none"
            />
          </label>
        </div>
        <p className="text-xs text-slate-500">
          {q.trim()
            ? `${num(filtered.length)}곳 (최대 200곳 표시)`
            : `${year}년 계약 금액 상위 50곳을 보여줍니다. 이름을 입력해 찾으세요.`}
        </p>
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
          <SectionTitle count={detail.count} desc={`합계 ${wonShort(detail.total)}`}>
            {detail.key}
          </SectionTitle>
          <ContractTable
            rows={[...detail.items].sort((a, b) => b.date.localeCompare(a.date))}
            hideInst={by === 'inst'}
            hidePartner={by === 'partner'}
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
                    <button type="button" className="font-bold text-slate-900 hover:text-blue-700 text-left">
                      {r.key}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{num(r.count)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-bold text-slate-900">{wonShort(r.total)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">{num(r.partners)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
