import React from 'react';

export const Footer: React.FC<{ collectedAt?: string | null }> = ({ collectedAt }) => (
  <footer className="bg-slate-900 mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6 sm:grid-cols-2 text-sm">
      <div className="space-y-1">
        <p className="font-bold text-white">1인 수의계약 모니터</p>
        <p className="text-slate-400">
          전북특별자치도교육청이 공개하는 계약체결현황 가운데 계약방법이 &lsquo;1인수의&rsquo;인 건을 모아
          현황과 확인이 필요한 건을 보여주는 비공식 도구입니다.
        </p>
      </div>
      <div className="space-y-1 sm:text-right">
        <p className="font-bold text-white">자료 출처</p>
        <p className="text-slate-400">
          <a
            className="underline hover:text-white"
            href="https://www.jbe.go.kr/open/edufine/eduCntrlist1.jbe?menuCd=DOM_000001003001009000&cntr_mthd_div_nm=1%EC%9D%B8%EC%88%98%EC%9D%98"
            target="_blank"
            rel="noopener noreferrer"
          >
            전북특별자치도교육청 계약정보공개 &gt; 1인 수의계약현황
          </a>
        </p>
        {collectedAt && (
          <p className="text-slate-500 text-xs tabular-nums">마지막 수집 {collectedAt.slice(0, 16).replace('T', ' ')}</p>
        )}
      </div>
    </div>
  </footer>
);
