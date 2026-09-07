/**
 * 화면에 보이는 목록을 그대로 파일로 내린다.
 *
 * 엑셀이 바로 여는 CSV 로 만든다. 맨 앞에 **BOM 을 붙이는 게 핵심**이다 —
 * 없으면 한글이 통째로 깨져서 열린다(엑셀이 CSV 를 시스템 인코딩으로 읽어서 그렇다).
 */

const BOM = '﻿';

const cell = (v: string | number) => {
  const s = String(v ?? '');
  // 따옴표·쉼표·줄바꿈이 있으면 감싸고, 안의 따옴표는 두 번 적는다(CSV 규칙)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(headers: string[], rows: (string | number)[][]): string {
  return BOM + [headers, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
}

/** 파일로 내려받게 한다. 정적 페이지라 서버 없이 브라우저 안에서 만든다. */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // 곧바로 지우면 사파리에서 내려받기가 끊긴다
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** 파일 이름에 쓸 수 없는 글자를 걷어낸다 */
export const safeName = (s: string) => s.replace(/[\\/:*?"<>|]/g, '_').slice(0, 60);
