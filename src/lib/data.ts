import type { Contract, InstKind, InstKindsFile, YearFile } from '../types';
import { OUTLIER_MIN, partnerKey } from './util';

/**
 * 연도 파일은 하나에 수만 건이라 무겁다. 그래서 필요한 연도만, 한 번만 받는다.
 * 자료가 오기 전에 그럴듯한 표본을 채워 두지 않는다 — 못 받았으면 못 받았다고 알린다.
 */
const cache = new Map<number, Contract[]>();
/** 금액이 자릿수 오류로 보이는 건. 집계에서 빼고 따로 보여준다. */
const outliers = new Map<number, Contract[]>();
const meta = new Map<number, { collected_at: string; site_total: number }>();
const inflight = new Map<number, Promise<Contract[]>>();

/** 수집기가 써 놓은 목록(public/data/index.json)이 있으면 그걸 쓴다. 연도를 코드에 박지 않는다. */
export interface YearInfo {
  year: number;
  collected: number;
  site_total: number;
  collected_at: string;
}

export async function loadIndex(): Promise<YearInfo[]> {
  const res = await fetch(`${import.meta.env.BASE_URL}data/index.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`연도 목록을 못 받았습니다 (HTTP ${res.status})`);
  const j = (await res.json()) as { years: YearInfo[] };
  return [...j.years].sort((a, b) => b.year - a.year);
}

const url = (year: number) => `${import.meta.env.BASE_URL}data/contracts_${year}.json`;

/**
 * 계약기관 → 기관분류구분. 목록 화면에는 없는 값이라 수집기가 상세 화면에서 따로 채워 둔다.
 * 1,000곳 남짓이라 한 번 받아 두고 모든 연도가 같이 쓴다.
 */
let kindMap: Record<string, string> | null = null;
let kindPromise: Promise<Record<string, string>> | null = null;

async function loadKinds(): Promise<Record<string, string>> {
  if (kindMap) return kindMap;
  if (kindPromise) return kindPromise;
  kindPromise = (async () => {
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}data/inst_kinds.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(String(res.status));
      kindMap = ((await res.json()) as InstKindsFile).kinds ?? {};
    } catch {
      // 분류를 못 받아도 나머지는 다 보여준다. 그때는 전부 '미상' 이 된다.
      kindMap = {};
    }
    return kindMap;
  })();
  return kindPromise;
}

const KINDS = new Set(['시도교육청', '교육지원청', '직속기관', '학교']);

export const metaOf = (year: number) => meta.get(year);
export const outliersOf = (year: number) => outliers.get(year) ?? [];

export async function loadYear(year: number): Promise<Contract[]> {
  const hit = cache.get(year);
  if (hit) return hit;
  const running = inflight.get(year);
  if (running) return running;

  const p = (async () => {
    const [res, kinds] = await Promise.all([fetch(url(year), { cache: 'no-cache' }), loadKinds()]);
    if (!res.ok) throw new Error(`${year}년 자료를 못 받았습니다 (HTTP ${res.status})`);
    const f = (await res.json()) as YearFile;
    const rows: Contract[] = f.rows.map(([seq, inst, name, date, amount, partner]) => {
      const pname = f.partners[partner] ?? '';
      const iname = f.insts[inst] ?? '';
      const k = kinds[iname] ?? '';
      return {
        seq,
        year: f.year,
        inst: iname,
        kind: (KINDS.has(k) ? k : '미상') as InstKind,
        name,
        date,
        amount,
        partner: pname,
        pkey: partnerKey(pname),
      };
    });
    const clean = rows.filter((r) => r.amount < OUTLIER_MIN);
    outliers.set(year, rows.filter((r) => r.amount >= OUTLIER_MIN));
    cache.set(year, clean);
    meta.set(year, { collected_at: f.collected_at, site_total: f.site_total });
    return clean;
  })();

  inflight.set(year, p);
  try {
    return await p;
  } finally {
    inflight.delete(year);
  }
}

export async function loadYears(years: number[]): Promise<Contract[]> {
  const parts = await Promise.all(years.map(loadYear));
  return parts.flat();
}
