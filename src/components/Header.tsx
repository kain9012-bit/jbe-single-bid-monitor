import React from 'react';
import { FileSearch, Lock } from 'lucide-react';
import type { Tab } from '../types';
import { korDate } from '../lib/util';

const TABS: { id: Tab; label: string; gated?: boolean }[] = [
  { id: 'home', label: '현황' },
  { id: 'repeat', label: '반복 수의계약', gated: true },
  { id: 'lookup', label: '기관·업체 조회' },
  { id: 'recent', label: '최근 계약' },
  { id: 'settings', label: '설정' },
];

interface Props {
  tab: Tab;
  setTab: (t: Tab) => void;
  /** 자료가 어느 계약일까지 와 있는지 */
  latestDate?: string | null;
  /** 아직 잠겨 있는지 */
  locked?: boolean;
  /** 잠금 화면에서는 탭을 감춘다 */
  hideTabs?: boolean;
}

export const Header: React.FC<Props> = ({ tab, setTab, latestDate, locked, hideTabs }) => (
  <header className="bg-white sticky top-0 z-30 border-b border-slate-200">
    {/* 안내 띠 — 공식 통계가 아니라는 것을 먼저 밝힌다 */}
    <div className="bg-slate-50 text-slate-600 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs">
        <span>
          공개된 계약 목록을 기계가 모아 만든 <strong className="font-bold text-slate-900">비공식</strong> 자료입니다 ·
          판정 결과는 <strong className="font-bold text-slate-900">확인이 필요한 후보</strong>이지 위반 결론이 아닙니다
        </span>
        <span className="shrink-0">
          {latestDate ? `가장 최근 계약 ${korDate(latestDate)}` : ''}
        </span>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6">
        <button
          type="button"
          onClick={() => setTab('home')}
          className="flex items-center gap-2.5 py-3.5 text-left group shrink-0"
        >
          <span className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 group-hover:bg-blue-700 transition-colors">
            <FileSearch className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900 whitespace-nowrap">1인 수의계약 모니터</span>
            <span className="hidden sm:inline text-xs font-medium text-slate-400 whitespace-nowrap">
              전북특별자치도교육청
            </span>
          </span>
        </button>

        {!hideTabs && (
        <nav aria-label="주 메뉴" className="-mb-px w-full sm:w-auto">
          <ul className="flex overflow-x-auto overflow-y-hidden no-scrollbar" role="tablist">
            {TABS.map(({ id, label, gated }) => {
              const on = tab === id;
              return (
                <li key={id} role="presentation" className="shrink-0">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setTab(id)}
                    className={`px-3.5 sm:px-4 py-4 text-base font-bold whitespace-nowrap
                                border-b-[3px] transition-colors ${
                                  on
                                    ? 'text-blue-700 border-blue-600'
                                    : 'text-slate-600 border-transparent hover:text-slate-900'
                                }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {gated && locked && (
                        <Lock className="w-3.5 h-3.5 text-slate-400" aria-label="암호 필요" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        )}
      </div>
    </div>
  </header>
);
