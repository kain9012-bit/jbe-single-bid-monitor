import React, { useState } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import type { Contract } from '../types';
import { korDate, kindLabel, num, viewUrl, won } from '../lib/util';
import { contractsCsv, downloadCsv, safeName } from '../lib/csv';
import { GhostBtn } from './Ui';

interface Props {
  rows: Contract[];
  /** 처음에 보여줄 줄 수. 나머지는 '더 보기'로 늘린다. */
  initial?: number;
  step?: number;
  /** 기관 열을 숨긴다(이미 기관별로 묶인 자리) */
  hideInst?: boolean;
  /** 상대자 열을 숨긴다 */
  hidePartner?: boolean;
  /** 내려받기 파일 이름. 주면 목록 위에 내려받기 단추가 생긴다. */
  downloadName?: string;
}

export const ContractTable: React.FC<Props> = ({
  rows,
  initial = 20,
  step = 50,
  hideInst,
  hidePartner,
  downloadName,
}) => {
  const [n, setN] = useState(initial);
  const shown = rows.slice(0, n);

  // 화면에 몇 줄만 펼쳐져 있어도 내려받기는 **목록 전체**를 담는다
  const download = () =>
    downloadCsv(
      safeName(downloadName ?? '1인수의계약'),
      contractsCsv(
        rows.map((r) => ({
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
    <div className="space-y-3">
      {downloadName && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={download}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-300
                       text-sm font-bold text-slate-700 hover:border-blue-600 hover:text-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" aria-hidden="true" />
            엑셀로 내려받기
            <span className="text-xs font-medium text-slate-400 tabular-nums">{num(rows.length)}건</span>
          </button>
        </div>
      )}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <caption className="sr-only">계약 목록</caption>
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-xs">
              <th scope="col" className="text-left font-bold px-3 py-2 whitespace-nowrap">계약일자</th>
              {!hideInst && <th scope="col" className="text-left font-bold px-3 py-2">계약기관</th>}
              <th scope="col" className="text-left font-bold px-3 py-2">계약명</th>
              {!hidePartner && <th scope="col" className="text-left font-bold px-3 py-2">상대자</th>}
              <th scope="col" className="text-right font-bold px-3 py-2 whitespace-nowrap">계약금액</th>
              <th scope="col" className="px-3 py-2"><span className="sr-only">원문</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.seq} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-3 py-2 whitespace-nowrap tabular-nums text-slate-600">{korDate(r.date)}</td>
                {!hideInst && <td className="px-3 py-2 text-slate-700">{r.inst}</td>}
                <td className="px-3 py-2 text-slate-900">{r.name}</td>
                {!hidePartner && <td className="px-3 py-2 text-slate-700">{r.partner}</td>}
                <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums font-bold text-slate-900">
                  {won(r.amount)}
                </td>
                <td className="px-3 py-2">
                  <a
                    href={viewUrl(r.seq, r.year)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-blue-700"
                    title="교육청 원문 상세로 이동"
                  >
                    원문
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {n < rows.length && (
        <div className="text-center">
          <GhostBtn onClick={() => setN(n + step)}>
            {num(Math.min(step, rows.length - n))}건 더 보기 · 남은 {num(rows.length - n)}건
          </GhostBtn>
        </div>
      )}
    </div>
  );
};
