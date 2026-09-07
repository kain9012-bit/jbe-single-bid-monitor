import React, { useState } from 'react';
import { TriangleAlert, ExternalLink } from 'lucide-react';
import type { Contract } from '../types';
import { korDate, viewUrl, won } from '../lib/util';

/**
 * 금액이 자릿수 오류로 보이는 건을 알린다.
 *
 * 집계에서 빼기만 하고 말없이 없애면, 화면 숫자가 교육청 사이트와 달라졌을 때
 * 왜 다른지 아무도 모른다. 몇 건을 왜 뺐는지 밝히고 원문으로 갈 길을 준다.
 */
export const OutlierNotice: React.FC<{ rows: Contract[] }> = ({ rows }) => {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;

  return (
    <div role="note" className="rounded-lg border border-amber-300 bg-amber-50 p-4 space-y-2">
      <p className="flex items-start gap-2 text-sm text-slate-800">
        <TriangleAlert className="w-4 h-4 mt-0.5 shrink-0 text-amber-700" aria-hidden="true" />
        <span>
          <strong className="font-bold">원자료에 금액을 잘못 넣은 것으로 보이는 계약이 {rows.length}건 있어
          집계에서 뺐습니다.</strong>{' '}
          교육청 화면에도 같은 값이 그대로 올라와 있습니다. 이 건들을 넣으면 그해 총액이
          수백 배로 부풀어 통계가 뜻을 잃습니다.
        </span>
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-xs font-bold text-slate-600 hover:text-blue-700 underline"
        aria-expanded={open}
      >
        {open ? '접기' : '어떤 건인지 보기'}
      </button>
      {open && (
        <ul className="space-y-1.5 pt-1">
          {rows.map((r) => (
            <li key={r.seq} className="text-sm text-slate-700">
              <span className="tabular-nums text-slate-500">{korDate(r.date)}</span>{' '}
              <strong className="font-bold text-slate-900">{r.inst}</strong> · {r.name}{' '}
              <span className="tabular-nums font-bold text-red-700">{won(r.amount)}</span>{' '}
              <a
                href={viewUrl(r.seq, r.year)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 text-xs font-bold text-slate-500 hover:text-blue-700"
              >
                원문
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
