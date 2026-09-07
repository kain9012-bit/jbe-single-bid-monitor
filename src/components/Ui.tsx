import React from 'react';

/** 상태 배지 — KRDS 색 토큰 위에서 쓰는 공통 조각 */
export const Badge: React.FC<{
  tone?: 'blue' | 'slate' | 'amber' | 'green' | 'red';
  children: React.ReactNode;
}> = ({ tone = 'slate', children }) => {
  const cls = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    green: 'bg-green-50 text-green-700 border-green-100',
    red: 'bg-red-50 text-red-700 border-red-200',
  }[tone];
  return (
    <span className={`px-2 py-0.5 rounded border text-xs font-bold whitespace-nowrap ${cls}`}>
      {children}
    </span>
  );
};

export const SectionTitle: React.FC<{
  children: React.ReactNode;
  count?: number;
  desc?: string;
}> = ({ children, count, desc }) => (
  <div className="flex items-baseline gap-2 flex-wrap">
    <h3 className="text-lg font-bold text-slate-900">{children}</h3>
    {count !== undefined && (
      <span className="text-sm font-bold text-blue-700 tabular-nums">{count.toLocaleString('ko-KR')}건</span>
    )}
    {desc && <span className="text-xs text-slate-500">{desc}</span>}
  </div>
);

export const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc?: string;
  children?: React.ReactNode;
}> = ({ icon, title, desc, children }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-12 text-center space-y-3">
    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
      {icon}
    </div>
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    {desc && <p className="text-sm text-slate-500 max-w-md mx-auto">{desc}</p>}
    {children}
  </div>
);

/** 지표 카드 */
export const Stat: React.FC<{
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}> = ({ icon, label, value, sub }) => (
  <div className="bg-white rounded-lg border border-slate-200 p-4">
    <p className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
      {icon}
      {label}
    </p>
    <p className="mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
    {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
  </div>
);

export const PrimaryBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...p
}) => (
  <button
    type="button"
    {...p}
    className={`px-4 py-2 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-colors ${className}`}
  />
);

export const GhostBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...p
}) => (
  <button
    type="button"
    {...p}
    className={`px-3 py-2 rounded-md border border-slate-300 text-sm font-bold text-slate-700
                hover:border-blue-600 hover:text-blue-700 transition-colors ${className}`}
  />
);

/** 자동 판정의 한계를 같이 적는 띠. 없는 근거로 점수를 지어내지 않기 위한 장치다. */
export const LimitNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="note" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-slate-700">
    {children}
  </div>
);

/** 자료를 못 받았을 때. 숨기지 말고 알리고, 다시 시도할 길을 준다. */
export const LoadError: React.FC<{ message: string; onRetry: () => void }> = ({
  message,
  onRetry,
}) => (
  <div className="bg-white rounded-lg border border-red-200 p-6 space-y-3">
    <p className="font-bold text-slate-900">자료를 불러오지 못했습니다</p>
    <p className="text-sm text-slate-600">{message}</p>
    <GhostBtn onClick={onRetry}>다시 시도</GhostBtn>
  </div>
);

export const Loading: React.FC<{ label?: string }> = ({ label = '자료를 불러오는 중' }) => (
  <div className="py-16 text-center text-sm text-slate-500">{label}…</div>
);
