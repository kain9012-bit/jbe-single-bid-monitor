/** 금액을 한국식 단위로. 표에서는 원 단위 그대로가 필요하므로 두 벌을 둔다. */
export const won = (n: number) => n.toLocaleString('ko-KR') + '원';

/** 억/만 단위 요약. 지표 카드처럼 자리가 좁은 곳에서만 쓴다. */
export const wonShort = (n: number) => {
  if (n >= 100_000_000) {
    const eok = n / 100_000_000;
    return `${eok >= 100 ? Math.round(eok).toLocaleString('ko-KR') : eok.toFixed(1)}억원`;
  }
  if (n >= 10_000) return `${Math.round(n / 10_000).toLocaleString('ko-KR')}만원`;
  return n.toLocaleString('ko-KR') + '원';
};

export const num = (n: number) => n.toLocaleString('ko-KR');

/** 2026-09-07 -> 2026. 9. 7. */
export const korDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${y}. ${Number(m)}. ${Number(d)}.` : iso;
};

export const monthOf = (iso: string) => Number(iso.slice(5, 7)) || 0;

export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

/**
 * 상대자 이름에서 법인 형태를 떼어낸다.
 * "주식회사 하우이엔지"와 "(주)하우이엔지"를 한 업체로 묶기 위한 것이고,
 * 화면에는 원래 이름을 그대로 보여준다. 완벽한 동일인 판정은 아니다 —
 * 사업자등록번호가 공개되지 않아 이름으로만 맞출 수밖에 없다.
 */
const FORMS =
  /주식회사|유한책임회사|유한회사|합자회사|합명회사|재단법인|사단법인|의료법인|학교법인|\(주\)|\(유\)|\(재\)|\(사\)|\(합\)|㈜|㈔|㈐/g;
export const partnerKey = (s: string) =>
  s.replace(FORMS, '').replace(/[\s.·\-_'"()]/g, '').trim() || s.trim();

/** 상세 화면 주소. 원문을 바로 확인할 수 있어야 자동 판정을 믿을 수 있다. */
export const viewUrl = (seq: string, year: number) =>
  'https://www.jbe.go.kr/open/edufine/eduCntrView1.jbe?' +
  new URLSearchParams({
    cntr_mthd_div_nm: '1인수의',
    cntr_mthd_div: '1',
    cm_seq_no: seq,
    fscl_y: String(year),
    menuCd: 'DOM_000001003001009000',
  }).toString();

/** 기관 이름에서 종류를 추린다. 통계에서 학교와 행정기관을 갈라 보려는 용도. */
export type InstKind = '학교' | '유치원' | '교육지원청' | '본청' | '직속기관';
export const instKind = (name: string): InstKind => {
  if (/유치원$/.test(name)) return '유치원';
  if (/(초등학교|중학교|고등학교|중고등학교|학교)$/.test(name)) return '학교';
  if (/교육지원청$/.test(name)) return '교육지원청';
  if (/^전북특별자치도교육청$/.test(name)) return '본청';
  return '직속기관';
};

/**
 * 입력 오류로 보이는 금액의 문턱.
 *
 * 원자료에 실제로 이런 게 있다 — 이일여자고등학교의 2025년 해외 현장체험학습 위탁 용역이
 * **530,633,458,247,000원**(530조)으로 등록돼 있다. 같은 화면의 예정금액은 5,824만원이고
 * 계약률이 911,005,645%로 찍혀 있으니 자릿수를 잘못 넣은 것이다.
 * 이 한 건이 그 해 통계를 통째로 망가뜨리므로 집계·판정에서 빼되, 숨기지 않고 따로 알린다.
 *
 * 1인 수의계약에도 학교 부지 매입(14억)이나 리모델링 공사(29억) 같은 큰 건이 정상적으로 있다.
 * 그래서 문턱은 넉넉히 1000억으로 둔다 — 여기 걸리는 건 자릿수 오류뿐이다.
 */
export const OUTLIER_MIN = 100_000_000_000;

/** 금액대 구간. 수의계약 한도 언저리가 보이도록 끊었다. */
export const BANDS: { label: string; min: number; max: number }[] = [
  { label: '100만원 이하', min: 0, max: 1_000_000 },
  { label: '100만~500만원', min: 1_000_000, max: 5_000_000 },
  { label: '500만~1천만원', min: 5_000_000, max: 10_000_000 },
  { label: '1천만~2천만원', min: 10_000_000, max: 20_000_000 },
  { label: '2천만~5천만원', min: 20_000_000, max: 50_000_000 },
  { label: '5천만~1억원', min: 50_000_000, max: 100_000_000 },
  { label: '1억원 초과', min: 100_000_000, max: Infinity },
];
export const bandOf = (amount: number) =>
  BANDS.findIndex((b) => amount > b.min && amount <= b.max) === -1
    ? 0
    : BANDS.findIndex((b) => amount > b.min && amount <= b.max);
