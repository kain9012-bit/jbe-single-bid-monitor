import { useCallback, useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { TopButton } from './components/TopButton';
import { LoadError, Loading } from './components/Ui';
import { Gate, gateEnabled, isUnlocked } from './components/Gate';
import { Repeat } from './views/Repeat';
import { Recent } from './views/Recent';
import { Settings } from './views/Settings';
import { loadIndex, loadYear, metaOf, outliersOf, type YearInfo } from './lib/data';
import { OutlierNotice } from './components/OutlierNotice';
import { KIND_ORDER, kindLabel, num } from './lib/util';
import { loadMine, makeMatcher } from './lib/exclude';
import type { Contract, InstKind, Tab } from './types';

export default function App() {
  const [tab, setTab] = useState<Tab>('repeat');
  const [years, setYears] = useState<YearInfo[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [byYear, setByYear] = useState<Map<number, Contract[]>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 판정 탭은 암호로 가린다. 자물쇠가 아니라 가림막이다 — Gate.tsx 주석 참고.
  const [unlocked, setUnlocked] = useState(() => isUnlocked());
  // 기관분류 거르개. 비어 있으면 전부 본다. 모든 탭이 같은 값을 쓴다.
  const [kinds, setKinds] = useState<Set<InstKind>>(new Set());
  // 제외 키워드 — 이 브라우저에만 남는다. lib/exclude.ts 참고.
  const [mine, setMine] = useState<string[]>(() => loadMine());

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

  // 어떤 연도가 있는지부터 물어보고, 가장 최근 연도를 연다.
  // 잠겨 있으면 아예 받지 않는다 — 열기 전에 5MB를 미리 끌어올 이유가 없다.
  useEffect(() => {
    if (gateEnabled && !unlocked) return;
    loadIndex()
      .then((ys) => {
        setYears(ys);
        setYear((y) => y ?? ys[0]?.year ?? null);
      })
      .catch((e) => setErr(e instanceof Error ? e.message : String(e)));
  }, [unlocked]);

  useEffect(() => {
    if (year != null) void need(year);
  }, [year, need]);

  const all = year != null ? byYear.get(year) ?? [] : [];
  // 거르는 순서: 기관분류 → 제외 키워드. 뺀 건수는 아래에 늘 보여준다.
  const byKind = useMemo(
    () => (kinds.size === 0 ? all : all.filter((r) => kinds.has(r.kind))),
    [all, kinds],
  );
  const matcher = useMemo(() => makeMatcher(mine), [mine]);
  const rows = useMemo(
    () => (matcher ? byKind.filter((r) => !matcher(r)) : byKind),
    [byKind, matcher],
  );
  const excludedCount = byKind.length - rows.length;
  /** 거르개 단추에 붙일 분류별 건수 */
  const kindCounts = useMemo(() => {
    const m = new Map<InstKind, number>();
    for (const r of all) m.set(r.kind, (m.get(r.kind) ?? 0) + 1);
    return m;
  }, [all]);
  const toggleKind = (k: InstKind) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const latestDate = useMemo(
    () => rows.reduce<string | null>((a, r) => (a && a > r.date ? a : r.date), null),
    [rows],
  );

  const body = () => {
    if (err) return <LoadError message={err} onRetry={() => (year != null ? void need(year) : window.location.reload())} />;
    if (year == null) return <Loading label="연도 목록을 불러오는 중" />;
    if (tab === 'settings') {
      return (
        <Settings
          mine={mine}
          setMine={setMine}
          excludedCount={excludedCount}
          totalCount={byKind.length}
        />
      );
    }
    if (all.length === 0) return <Loading />;
    switch (tab) {
      case 'repeat':
        return <Repeat rows={rows} year={year} />;
      case 'recent':
        return <Recent rows={rows} year={year} />;
      default:
        return null;
    }
  };

  // 잠겨 있으면 암호 화면만 보여준다. 탭도 자료도 그 뒤에 있다.
  if (gateEnabled && !unlocked) {
    return (
      <div className="min-h-screen bg-white text-slate-800 font-sans antialiased flex flex-col">
        <Header tab={tab} setTab={setTab} locked hideTabs />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Gate onUnlock={() => setUnlocked(true)} />
        </main>
        <Footer collectedAt={null} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen overflow-x-clip bg-white text-slate-800 font-sans antialiased
                 flex flex-col selection:bg-blue-600 selection:text-white"
    >
      <a className="krds-skip" href="#container">본문 바로가기</a>
      <Header tab={tab} setTab={setTab} latestDate={latestDate} />

      <main id="container" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* 거르개 한 줄 — 회계연도와 기관분류를 나란히 둔다. 모든 탭이 같은 값을 본다. */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">회계연도</span>
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
          </div>

          {all.length > 0 && (
            <>
              <span className="hidden sm:block w-px h-6 bg-slate-200" aria-hidden="true" />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-500">기관분류</span>
                <button
                  type="button"
                  onClick={() => setKinds(new Set())}
                  aria-pressed={kinds.size === 0}
                  className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                    kinds.size === 0
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-700'
                  }`}
                >
                  전체
                </button>
                {KIND_ORDER.filter((k) => (kindCounts.get(k) ?? 0) > 0).map((k) => {
                  const on = kinds.has(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => toggleKind(k)}
                      aria-pressed={on}
                      className={`px-3 py-1.5 rounded-md border text-sm font-bold transition-colors ${
                        on
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-blue-600 hover:text-blue-700'
                      }`}
                    >
                      {kindLabel(k)}
                      <span className={`ml-1.5 text-xs tabular-nums ${on ? 'text-slate-300' : 'text-slate-400'}`}>
                        {num(kindCounts.get(k) ?? 0)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {busy && <span className="text-xs text-slate-500">불러오는 중…</span>}
          {(kinds.size > 0 || excludedCount > 0) && (
            <span className="text-xs text-slate-500 tabular-nums">
              {num(rows.length)}건만 보는 중
              {excludedCount > 0 && (
                <>
                  {' · '}
                  <button
                    type="button"
                    onClick={() => setTab('settings')}
                    className="font-bold text-slate-600 underline hover:text-blue-700"
                  >
                    제외 키워드로 {num(excludedCount)}건 뺌
                  </button>
                </>
              )}
            </span>
          )}
        </div>

        {year != null && all.length > 0 && <OutlierNotice rows={outliersOf(year)} />}
        {body()}
      </main>

      <Footer collectedAt={(year != null ? metaOf(year)?.collected_at : null) ?? years.find((y) => y.year === year)?.collected_at ?? null} />
      <TopButton />
    </div>
  );
}
