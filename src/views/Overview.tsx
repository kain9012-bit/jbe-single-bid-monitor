import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Building2, Coins, FileText, Handshake, TriangleAlert } from 'lucide-react';
import type { Contract } from '../types';
import { BANDS, KIND_ORDER, bandOf, kindLabel, monthOf, num, won, wonShort } from '../lib/util';
import { SectionTitle, Stat } from '../components/Ui';

const BLUE = '#256ef4';
const GRID = '#e6e8ea';
const AXIS = '#6d7882';
/** 연도 비교선: 올해만 파랑, 예년은 회색으로 물러앉힌다(순서 있는 값이라 색을 돌려 쓰지 않는다) */
const PAST = ['#58616a', '#8a949e', '#b1b8be'];

const axis = { stroke: AXIS, fontSize: 12 };

/** 막대·선 위에 뜨는 설명. 값은 본문 색으로 두고 색은 표식이 진다. */
const Box: React.FC<{ title: string; lines: [string, string][] }> = ({ title, lines }) => (
  <div className="rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm text-xs">
    <p className="font-bold text-slate-900">{title}</p>
    {lines.map(([k, v]) => (
      <p key={k} className="text-slate-600 tabular-nums">
        {k} <span className="font-bold text-slate-900">{v}</span>
      </p>
    ))}
  </div>
);

interface Props {
  rows: Contract[];
  year: number;
  /** 연도별 월 누계 비교용. 이미 받아 둔 연도만 들어온다. */
  byYear: Map<number, Contract[]>;
}

export const Overview: React.FC<Props> = ({ rows, year, byYear }) => {
  const [metric, setMetric] = useState<'count' | 'amount'>('count');

  const stats = useMemo(() => {
    const total = rows.reduce((s, r) => s + r.amount, 0);
    return {
      count: rows.length,
      total,
      avg: rows.length ? Math.round(total / rows.length) : 0,
      insts: new Set(rows.map((r) => r.inst)).size,
      partners: new Set(rows.map((r) => r.pkey)).size,
      big: rows.filter((r) => r.amount >= 10_000_000).length,
    };
  }, [rows]);

  /**
   * 회계연도와 계약연도는 다르다 — 2026 회계연도 파일에도 2025년 12월 계약이 들어 있다.
   * 그래서 달(1~12)로 뭉치면 전년도 12월이 그해 12월 자리에 붙어 버린다. 실제 연-월로 센다.
   */
  const monthly = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    for (const r of rows) {
      const ym = r.date.slice(0, 7);
      if (ym.length !== 7) continue;
      const v = m.get(ym) ?? { count: 0, amount: 0 };
      v.count += 1;
      v.amount += r.amount;
      m.set(ym, v);
    }
    const keys = [...m.keys()].sort();
    // 아주 오래된 소수의 건이 축을 늘어뜨리지 않도록 최근 15개월만 그린다
    const use = keys.slice(-15);
    const dropped = keys.length - use.length;
    return {
      // 축에 두 해가 섞이므로 라벨에 연도 뒤 두 자리를 붙인다 (25.12 → 26.1)
      data: use.map((ym) => ({
        ym,
        label: `${ym.slice(2, 4)}.${Number(ym.slice(5))}`,
        year: ym.slice(0, 4),
        ...m.get(ym)!,
      })),
      dropped,
      droppedCount: keys
        .slice(0, dropped)
        .reduce((s, k) => s + m.get(k)!.count, 0),
    };
  }, [rows]);

  /** 회계연도와 계약연도가 어긋난 건수 — 차트를 읽기 전에 알아야 한다 */
  const offYear = useMemo(
    () => rows.filter((r) => r.date.slice(0, 4) !== String(year)).length,
    [rows, year],
  );

  const bands = useMemo(() => {
    const c = BANDS.map((b) => ({ label: b.label, count: 0, amount: 0 }));
    for (const r of rows) {
      const i = bandOf(r.amount);
      c[i].count += 1;
      c[i].amount += r.amount;
    }
    return c;
  }, [rows]);

  // 기관분류구분은 사이트 상세 화면이 주는 값이다(이름으로 추측하지 않는다)
  const kinds = useMemo(() => {
    const m = new Map<string, { count: number; amount: number }>();
    for (const r of rows) {
      const v = m.get(r.kind) ?? { count: 0, amount: 0 };
      v.count += 1;
      v.amount += r.amount;
      m.set(r.kind, v);
    }
    return KIND_ORDER.filter((k) => m.has(k)).map((k) => [k, m.get(k)!] as const);
  }, [rows]);

  /** 연도 비교 — 월 누계. 해가 진행 중인 연도는 지난 달까지만 그린다. */
  const compare = useMemo(() => {
    const years = [...byYear.keys()].sort((a, b) => b - a);
    const out = Array.from({ length: 12 }, (_, i) => {
      const o: Record<string, number | null> = { m: i + 1 };
      for (const y of years) o[`y${y}`] = null;
      return o;
    });
    for (const y of years) {
      // 회계연도와 계약연도가 어긋난 건은 빼야 달끼리 견줄 수 있다
      const list = byYear.get(y)!.filter((r) => r.date.slice(0, 4) === String(y));
      const acc = Array(12).fill(0);
      for (const r of list) {
        const i = monthOf(r.date) - 1;
        if (i >= 0 && i < 12) acc[i] += metric === 'count' ? 1 : r.amount;
      }
      const last = Math.max(...list.map((r) => monthOf(r.date)), 0);
      let run = 0;
      for (let i = 0; i < 12; i += 1) {
        run += acc[i];
        out[i][`y${y}`] = i < last ? run : null;
      }
    }
    return { years, data: out };
  }, [byYear, metric]);

  const fmt = (v: number) => (metric === 'count' ? num(v) : wonShort(v));

  return (
    <div className="space-y-8">
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat icon={<FileText className="w-3.5 h-3.5" />} label="계약 건수" value={num(stats.count)} sub={`${year}년 1인수의`} />
        <Stat icon={<Coins className="w-3.5 h-3.5" />} label="계약 금액" value={wonShort(stats.total)} sub={won(stats.total)} />
        <Stat icon={<Coins className="w-3.5 h-3.5" />} label="건당 평균" value={wonShort(stats.avg)} />
        <Stat icon={<Building2 className="w-3.5 h-3.5" />} label="계약기관" value={num(stats.insts)} sub="학교 포함" />
        <Stat icon={<Handshake className="w-3.5 h-3.5" />} label="계약상대자" value={num(stats.partners)} sub="법인형태 표기 통합" />
        <Stat
          icon={<TriangleAlert className="w-3.5 h-3.5" />}
          label="1천만원 이상"
          value={num(stats.big)}
          sub={`전체의 ${stats.count ? ((stats.big / stats.count) * 100).toFixed(1) : '0'}%`}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <SectionTitle desc={`${year}년 · 계약일자 기준`}>월별 추이</SectionTitle>
          <div className="flex rounded-md border border-slate-300 overflow-hidden text-sm font-bold">
            {(['count', 'amount'] as const).map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setMetric(k)}
                aria-pressed={metric === k}
                className={`px-3 py-1.5 transition-colors ${
                  metric === k ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-blue-700'
                }`}
              >
                {k === 'count' ? '건수' : '금액'}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly.data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tickLine={false} {...axis} />
              <YAxis tickFormatter={fmt} tickLine={false} axisLine={false} width={64} {...axis} />
              <Tooltip
                cursor={{ fill: '#f4f5f6' }}
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <Box
                      title={String(payload[0].payload.ym).replace('-', '년 ') + '월'}
                      lines={[
                        ['건수', num(payload[0].payload.count)],
                        ['금액', won(payload[0].payload.amount)],
                      ]}
                    />
                  ) : null
                }
              />
              <Bar dataKey={metric} radius={[4, 4, 0, 0]} maxBarSize={38} isAnimationActive={false}>
                {monthly.data.map((d) => (
                  // 회계연도와 계약연도가 다른 달은 옅게 — 전년도 12월이 섞여 있다
                  <Cell key={d.ym} fill={d.year === String(year) ? BLUE : '#86aff9'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-2 text-xs text-slate-500">
            가로축은 <strong className="font-bold text-slate-700">계약일자</strong>의 연·월입니다. 회계연도는{' '}
            {year}년이지만 계약일이 다른 해인 건이 {num(offYear)}건 있어(주로 전년도 12월), 그 달은 옅게 칠했습니다.
            {monthly.dropped > 0 && ` 15개월보다 더 오래된 ${num(monthly.droppedCount)}건은 축에서 뺐습니다.`}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <SectionTitle desc="계약 한 건의 금액대">금액대 분포</SectionTitle>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bands} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={GRID} horizontal={false} />
                <XAxis type="number" tickFormatter={num} tickLine={false} {...axis} />
                <YAxis type="category" dataKey="label" width={112} tickLine={false} axisLine={false} {...axis} />
                <Tooltip
                  cursor={{ fill: '#f4f5f6' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <Box
                        title={String(label)}
                        lines={[
                          ['건수', num(payload[0].payload.count)],
                          ['금액', won(payload[0].payload.amount)],
                        ]}
                      />
                    ) : null
                  }
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false}>
                  {bands.map((b, i) => (
                    // 1천만원을 넘는 구간은 반복 수의계약 판정 대상이라 눈에 띄게 둔다
                    <Cell key={b.label} fill={i >= 3 ? BLUE : '#86aff9'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="mt-2 text-xs text-slate-500">
              진한 막대가 1천만원을 넘는 구간입니다.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <SectionTitle desc="사이트의 기관분류구분 그대로">기관분류별</SectionTitle>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs">
                  <th scope="col" className="text-left font-bold px-4 py-2">분류</th>
                  <th scope="col" className="text-right font-bold px-4 py-2">건수</th>
                  <th scope="col" className="text-right font-bold px-4 py-2">금액</th>
                  <th scope="col" className="text-right font-bold px-4 py-2">비중</th>
                </tr>
              </thead>
              <tbody>
                {kinds.map(([k, v]) => (
                  <tr key={k} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-bold text-slate-900">{kindLabel(k)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{num(v.count)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{wonShort(v.amount)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-500">
                      {stats.total ? ((v.amount / stats.total) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {compare.years.length > 1 && (
        <section className="space-y-3">
          <SectionTitle desc={`${metric === "count" ? "건수" : "금액"} 누계 · 회계연도와 계약연도가 같은 건만`}>
            연도 비교
          </SectionTitle>
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={compare.data} margin={{ top: 8, right: 56, bottom: 0, left: 8 }}>
                <CartesianGrid stroke={GRID} vertical={false} />
                <XAxis dataKey="m" tickFormatter={(m) => `${m}월`} tickLine={false} {...axis} />
                <YAxis tickFormatter={fmt} tickLine={false} axisLine={false} width={64} {...axis} />
                <Tooltip
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <Box
                        title={`${label}월까지 누계`}
                        lines={payload
                          .filter((p) => p.value != null)
                          .map((p) => [
                            `${String(p.dataKey).slice(1)}년`,
                            fmt(p.value as number),
                          ])}
                      />
                    ) : null
                  }
                />
                {compare.years.map((y, i) => (
                  <Line
                    key={y}
                    type="monotone"
                    dataKey={`y${y}`}
                    stroke={i === 0 ? BLUE : PAST[(i - 1) % PAST.length]}
                    strokeWidth={i === 0 ? 2.5 : 2}
                    dot={false}
                    activeDot={{ r: 4 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {/* 색만으로 연도를 구분하지 않도록 이름표를 같이 둔다 */}
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {compare.years.map((y, i) => (
                <li key={y} className="flex items-center gap-1.5 text-slate-600">
                  <span
                    className="inline-block w-3 h-0.5 rounded"
                    style={{ background: i === 0 ? BLUE : PAST[(i - 1) % PAST.length] }}
                    aria-hidden="true"
                  />
                  <span className={i === 0 ? 'font-bold text-slate-900' : ''}>{y}년</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};
