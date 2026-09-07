import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TopButton } from './components/TopButton';
import { LoadError, Loading } from './components/Ui';
import { Gate, gateEnabled, isUnlocked } from './components/Gate';
import { Overview } from './views/Overview';
import { Repeat } from './views/Repeat';
import { Split } from './views/Split';
import { Lookup } from './views/Lookup';
import { Recent } from './views/Recent';
import { loadIndex, loadYear, metaOf, outliersOf, type YearInfo } from './lib/data';
import { OutlierNotice } from './components/OutlierNotice';
import type { Contract, Tab } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [years, setYears] = useState<YearInfo[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [byYear, setByYear] = useState<Map<number, Contract[]>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 판정 탭은 암호로 가린다. 자물쇠가 아니라 가림막이다 — Gate.tsx 주석 참고.
  const [unlocked, setUnlocked] = useState(() => isUnlocked());

  /** 연도 파일은 무거우므로 보는 연도만 받는다. 이미 받은 건 다시 받지 않는다. */
  const need = useCallback(
    async (y: number) => {
      if (byYear.has(y)) return;
      setBusy(true);
      setErr(null);
      try {
        const rows = await loadYear(y);
        setByYear((m) => new Map(m).set(y, rows));
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setBusy(false);
      }
    },
    [byYear],
  );

  // 어떤 연도가 있는지부터 물어보고, 가장 최근 연도를 연다
  useEffect(() => {
    loadIndex()
      .then((ys) => {
        setYears(ys);
        setYear((y) => y ?? ys[0]?.year ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, []);

  useEffect(() => {
    if (year != null) void need(year);
  }, [year, need]);

  const rows = year != null ? byYear.get(year) ?? [] : [];
  const latestDate = useMemo(
    () => rows.reduce<string | null>((a, r) => (a && a > r.date ? a : r.date), null),
    [rows],
  );

  const body = () => {
    if (err) return <LoadError message={err} onRetry={() => (year != null ? void need(year) : window.location.reload())} />;
    if (year == null) return <Loading label="연도 목록을 불러오는 중" />;
    if (rows.length === 0) return <Loading />;
    if (gateEnabled && !unlocked && (tab === 'repeat' || tab === 'split')) {
      return <Gate onUnlock={() => setUnlocked(true)} />;
    }
    switch (tab) {
      case 'home':
        return <Overview rows={rows} year={year} byYear={byYear} />;
      case 'repeat':
        return <Repeat rows={rows} year={year} />;
      case 'split':
        return <Split rows={rows} year={year} />;
      case 'lookup':
        return <Lookup rows={rows} year={year} />;
      case 'recent':
        return <Recent rows={rows} />;
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen overflow-x-clip bg-white text-slate-800 font-sans antialiased
                 flex flex-col selection:bg-blue-600 selection:text-white"
    >
      <a className="krds-skip" href="#container">본문 바로가기</a>
      <Header tab={tab} setTab={setTab} latestDate={latestDate} locked={gateEnabled && !unlocked} />

      <main id="container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 연도 고르개 — 모든 탭이 같은 연도를 본다 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">회계연도</span>
          {years.map(({ year: y }) => (
            <button
              key={y}
              type="button"
              onClick={() => setYear(y)}
              aria-pressed={y === year}
              className={`px-3 py-1.5 rounded-md border text-sm font-bold tabular-nums transition-colors ${
                y === year
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-700'
              }`}
            >
              {y}
            </button>
          ))}
          {busy && <span className="text-xs text-slate-500">불러오는 중…</span>}
          {byYear.size > 1 && (
            <span className="text-xs text-slate-400">받아 둔 연도끼리는 &lsquo;연도 비교&rsquo;에 함께 그립니다</span>
          )}
        </div>

        {year != null && rows.length > 0 && <OutlierNotice rows={outliersOf(year)} />}
        {body()}
      </main>

      <Footer collectedAt={(year != null ? metaOf(year)?.collected_at : null) ?? years.find((y) => y.year === year)?.collected_at ?? null} />
      <TopButton />
    </div>
  );
}
