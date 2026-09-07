/** 수집기가 저장한 연도 파일의 모양. 기관·상대자는 사전으로 빼고 행은 번호로 참조한다. */
export interface YearFile {
  year: number;
  /** 수집기가 마지막으로 돈 시각 (KST, ISO) */
  collected_at: string;
  source: string;
  /** 수집 당시 사이트가 표기한 총 건수 */
  site_total: number;
  collected: number;
  cols: string[];
  insts: string[];
  partners: string[];
  /** [계약일련번호, 기관번호, 계약명, 계약일자, 계약금액, 상대자번호] */
  rows: [string, number, string, string, number, number][];
}

/**
 * 기관분류구분 — 사이트 상세 화면이 주는 값 그대로.
 * '시도교육청' 은 화면에 '본청' 으로 적는다(util.ts 의 kindLabel).
 */
export type InstKind = '시도교육청' | '교육지원청' | '직속기관' | '학교' | '미상';

/** 계약기관 이름 → 기관분류구분 (scripts/collect.py 가 상세 화면에서 채운다) */
export interface InstKindsFile {
  kinds: Record<string, string>;
}

/** 화면에서 다루는 계약 한 건 */
export interface Contract {
  seq: string;
  year: number;
  inst: string;
  /** 계약기관의 기관분류구분 */
  kind: InstKind;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  amount: number;
  partner: string;
  /** 법인 형태(주식회사·(주)·재단법인 등)를 떼어낸 상대자 이름. 묶을 때만 쓴다. */
  pkey: string;
}

/** 같은 기관이 같은 업체와 반복해서 맺은 계약 묶음 */
export interface RepeatGroup {
  inst: string;
  partner: string;
  count: number;
  /** 묶인 계약금액의 합. 판정 기준이 아니라 참고용이다 — 기준은 건당 금액이다. */
  total: number;
  from: string;
  to: string;
  spanDays: number;
  items: Contract[];
}

export type Tab = 'home' | 'repeat' | 'lookup' | 'recent';
