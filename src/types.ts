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

/** 화면에서 다루는 계약 한 건 */
export interface Contract {
  seq: string;
  year: number;
  inst: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  amount: number;
  partner: string;
  /** 법인 형태(주식회사·(주)·유한회사 등)를 떼어낸 상대자 이름. 묶을 때만 쓴다. */
  pkey: string;
}

/** 같은 기관이 같은 업체와 반복해서 맺은 계약 묶음 */
export interface RepeatGroup {
  inst: string;
  partner: string;
  count: number;
  total: number;
  items: Contract[];
}

/** 짧은 기간에 몰린 같은 기관·같은 업체 계약 묶음 (분할 의심) */
export interface SplitGroup extends RepeatGroup {
  /** 묶인 계약의 첫 날짜와 마지막 날짜 */
  from: string;
  to: string;
  spanDays: number;
}

export type Tab = 'home' | 'repeat' | 'split' | 'lookup' | 'recent';
