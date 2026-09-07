import React, { useState } from 'react';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { saveMine, tidy } from '../lib/exclude';
import { GhostBtn, LimitNote, SectionTitle } from '../components/Ui';
import { num } from '../lib/util';

interface Props {
  shared: string[];
  mine: string[];
  setMine: (list: string[]) => void;
  /** 지금 이 설정으로 몇 건이 빠지고 있는지 */
  excludedCount: number;
  totalCount: number;
}

export const Settings: React.FC<Props> = ({ shared, mine, setMine, excludedCount, totalCount }) => {
  const [input, setInput] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const add = () => {
    // 쉼표·줄바꿈으로 여러 개를 한 번에 넣을 수 있게 한다
    const added = tidy([...mine, ...input.split(/[,\n]/)]);
    if (!saveMine(added)) {
      setMsg('이 브라우저는 설정을 저장하지 못합니다(시크릿 모드이거나 사이트 데이터가 막혀 있습니다).');
      return;
    }
    setMine(added);
    setInput('');
    setMsg(null);
  };

  const remove = (k: string) => {
    const left = mine.filter((x) => x !== k);
    saveMine(left);
    setMine(left);
  };

  const copyForShared = async () => {
    const text = JSON.stringify({ keywords: tidy([...shared, ...mine]) }, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      setMsg('복사했습니다. 담당자에게 전달하면 공용 목록에 넣어 줍니다.');
    } catch {
      setMsg('복사가 막혀 있습니다. 아래 목록을 손으로 옮겨 적어 주세요.');
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <SectionTitle desc="계약명과 계약상대자 두 칸을 봅니다">제외 키워드</SectionTitle>
        <p className="mt-2 text-sm text-slate-600">
          여기 적은 말이 <strong className="font-bold text-slate-900">계약명</strong>이나{' '}
          <strong className="font-bold text-slate-900">계약상대자</strong>에 들어가면 모든 탭에서 뺍니다.
          대소문자는 가리지 않고, 일부만 맞아도 걸립니다.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-sm text-slate-700 tabular-nums">
          지금 설정으로 <strong className="font-bold text-slate-900">{num(excludedCount)}건</strong>이 빠지고 있습니다
          <span className="text-slate-500"> (전체 {num(totalCount)}건 중)</span>.
        </p>
      </div>

      <section className="space-y-3">
        <SectionTitle count={mine.length} desc="이 브라우저에만 저장됩니다">내 목록</SectionTitle>
        <div className="flex gap-2">
          <label className="flex-1">
            <span className="sr-only">제외할 키워드</span>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
              }}
              placeholder="예: 급식, 전기요금, 한국전력공사 (쉼표로 여러 개)"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 outline-none"
            />
          </label>
          <GhostBtn onClick={add} disabled={!input.trim()}>
            <span className="inline-flex items-center gap-1">
              <Plus className="w-4 h-4" aria-hidden="true" />
              넣기
            </span>
          </GhostBtn>
        </div>

        {mine.length === 0 ? (
          <p className="text-sm text-slate-500">아직 넣은 키워드가 없습니다.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {mine.map((k) => (
              <li key={k}>
                <span className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-md border border-slate-300 bg-white text-sm font-bold text-slate-700">
                  {k}
                  <button
                    type="button"
                    onClick={() => remove(k)}
                    className="p-1 rounded text-slate-400 hover:text-red-600"
                    aria-label={`${k} 빼기`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-500">
          이 목록은 이 브라우저에만 남습니다 — 컴퓨터를 껐다 켜도 그대로지만, 다른 PC나 다른 브라우저,
          시크릿 모드에는 넘어가지 않습니다. 인터넷 사용기록에서 사이트 데이터를 지우면 함께 지워집니다.
        </p>
      </section>

      <section className="space-y-3">
        <SectionTitle count={shared.length} desc="모두에게 같이 적용됩니다">공용 목록</SectionTitle>
        {shared.length === 0 ? (
          <p className="text-sm text-slate-500">공용으로 빼는 키워드가 아직 없습니다.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {shared.map((k) => (
              <li
                key={k}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-slate-50 text-sm font-bold text-slate-600"
              >
                {k}
              </li>
            ))}
          </ul>
        )}
        <LimitNote>
          공용 목록은 <strong className="font-bold">화면에서 고칠 수 없습니다.</strong> 이 사이트는 서버 없이
          파일만 올려둔 구조라, 한 사람이 저장한 값이 다른 사람에게 넘어갈 자리가 없습니다.
          공용으로 빼고 싶은 키워드가 있으면 담당자에게 말씀하시면 저장소의{' '}
          <code className="bg-white border border-amber-200 rounded px-1 py-0.5 text-xs">
            public/data/exclude_keywords.json
          </code>{' '}
          에 넣고 다시 배포합니다.
        </LimitNote>
        <GhostBtn onClick={copyForShared}>
          <span className="inline-flex items-center gap-1.5">
            <Copy className="w-4 h-4" aria-hidden="true" />
            공용으로 보낼 목록 복사
          </span>
        </GhostBtn>
        {msg && <p className="text-sm font-bold text-slate-700" role="status">{msg}</p>}
      </section>
    </div>
  );
};
