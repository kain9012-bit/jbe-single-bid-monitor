import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { GhostBtn } from './Ui';

/**
 * 화면 전체를 암호로 가린다.
 *
 * **이건 자물쇠가 아니라 가림막이다.** 정적 페이지라 암호 확인이 브라우저 안에서 일어나고,
 * 확인에 쓰는 해시는 어차피 배포된 자바스크립트 안에 들어간다. 게다가 원자료
 * (public/data/*.json)는 주소만 알면 암호 없이도 받을 수 있다.
 * 막으려는 것은 '주소를 우연히 연 사람이 바로 들여다보는 일'이지 자료 유출이 아니다.
 * 진짜 접근통제가 필요하면 Cloudflare Access 같은 걸 앞에 세워야 한다 — README에 적어 두었다.
 *
 * 기본값은 소스에 박아 둔 해시를 쓴다(설정 없이 바로 동작하라고).
 * 깃허브 Actions 비밀값 VITE_GATE_HASH(암호의 SHA-256 16진값)를 넣으면 그게 이긴다.
 * 둘 다 없으면 잠그지 않는다.
 */
const DEFAULT_HASH = '32b20db069de4f124728e96745f985fc068aa47434cb6cc6f554c88b478a4ede';
const ENV_HASH = (import.meta.env.VITE_GATE_HASH as string | undefined)?.trim().toLowerCase() ?? '';
const HASH = ENV_HASH.length === 64 ? ENV_HASH : DEFAULT_HASH;

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
          기계가 추린 <strong className="font-bold">확인 대상 후보</strong>가 들어 있어 가려 두었습니다.
          암호는 담당자에게 문의하세요.
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
        1인 수의계약 모니터 · 전북특별자치도교육청
      </p>
    </div>
  );
};
