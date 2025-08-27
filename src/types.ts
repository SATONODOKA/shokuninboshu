export type Trade = '大工' | '電気' | '左官';
export type Pref = '東京' | '神奈川' | '千葉' | '埼玉';

export type Job = {
  id: string;
  title: string;        // 例: 【大工】相模原 2名
  trade: Trade;
  pref: Pref;
  city: string;
  startDate: string;    // YYYY-MM-DD
  endDate: string;
  salaryBand: string;   // 例: 2〜4万円/日
  need: number;         // 必要人数
  decided: number;      // 決定人数
  summary?: string;
  notifyCount?: number;
};

export type Worker = {
  id: string;           // LINE userIdもしくはダミー
  name: string;
  trade: Trade;
  pref: Pref;
  city: string;
  lastSeenAt?: string;
};