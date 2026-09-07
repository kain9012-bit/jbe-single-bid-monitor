import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { GhostBtn } from './Ui';

/**
 * 판정 탭(반복·분할)을 암호로 가린다.
 *
 * **이건 자물쇠가 아니라 가림막이다.** 정적 페이지라 암호 확인이 브라우저 안에서 일어나고,
 * 원자료(public/data/*.json)는 주소만 알면 누구나 받을 수 있다. 막으려는 것은
 * '누가 봐도 위반처럼 보이는 목록'이 검색이나 링크로 흘러다니는 일이지, 자료 유출이 아니다.
 * 진짜 접근통제가 필요하면 Cloudflare Access 같은 걸 앞에 세워야 한다 — README에 적어 두었다.
 *
 * 암호는 저장소에 넣지 않는다. 빌드할 때 VITE_GATE_HASH(암호의 SHA-256 16진값)만 박히고,
 * 그 값은 깃허브 Actions 비밀값에서 온다. 값이 없으면(로컬 개발) 잠그지 않는다.
 */
const HASH = (import.meta.env.VITE_GATE_HASH as string | undefined)?.trim().toLowerCase() ?? '';

export const gateEnabled = HASH.length === 64;

const KEY = 'jbe-single-bid-gate';
export const isUnlocked = () => !gateEnabled || sessionStorage.getItem(KEY) === '1';

async function sha256(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const Gate: React.FC<{ onUnlock: () => void }> = ({ onUnlock }) => {
  const [pw, setPw] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if ((await sha256(pw)) === HASH) {
        sessionStorage.setItem(KEY, '1');
        onUnlock();
      } else {
        setErr('암호가 맞지 않습니다.');
      }
    } catch {
      setErr('이 브라우저에서는 암호 확인이 되지 않습니다. 주소가 https 인지 확인해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-10 max-w-lg mx-auto space-y-4 text-center">
      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
        <Lock className="w-6 h-6" aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-800">담당자용 화면입니다</h3>
        <p className="text-sm text-slate-500">
          기계가 추린 <strong className="font-bold">확인 대상 후보</strong>라 오해를 부르기 쉬워 가려 두었습니다.
          암호는 담당 부서에 문의하세요.
        </p>
      </div>
      <form onSubmit={submit} className="flex gap-2">
        <label className="flex-1">
          <span className="sr-only">암호</span>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            autoComplete="current-password"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 outline-none"
            placeholder="암호"
          />
        </label>
        <GhostBtn type="submit" disabled={busy || !pw}>
          {busy ? '확인 중' : '열기'}
        </GhostBtn>
      </form>
      {err && <p className="text-sm font-bold text-red-600" role="alert">{err}</p>}
      <p className="text-xs text-slate-400">
        현황·기관·업체 조회 탭은 암호 없이 볼 수 있습니다.
      </p>
    </div>
  );
};
