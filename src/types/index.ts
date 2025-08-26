export interface Job {
  id: string;
  trade: string;
  sitePref: string;
  siteCity: string;
  summary: string;
  startDate: string;
  endDate: string;
  salaryBand: string;
  salaryNote?: string;
  headcountNeeded: number;
  headcountFilled: number;
  status: "OPEN" | "PAUSED" | "CLOSED";
  notifyCount: number;
  createdAt: number;
  lastUpdatedAt: number;
}

export interface Application {
  id: string;
  jobId: string;
  applicantName: string;
  phone?: string;
  lineId?: string;
  note?: string;
  status: "APPLIED" | "INTERVIEWING" | "HIRED" | "REJECTED";
  createdAt: number;
}

export interface Thread {
  id: string;
  jobId: string;
  counterpartName: string;
  contactTel?: string;
  contactLineId?: string;
  lastMessageText: string;
  lastMessageAt: number;
  hasReply: boolean;
  unreadCount: number;
}

export interface Message {
  id: string;
  threadId: string;
  jobId: string;
  role: "contractor" | "worker" | "system";
  text: string;
  createdAt: number;
  read?: boolean;
}

export const TRADES = ['大工', '電気工事士', '左官', '内装', '塗装', '設備'] as const;

export const PREFECTURES = ['東京', '神奈川', '埼玉', '千葉', '茨城', '栃木', '群馬'] as const;

export const CITIES_MAP = {
  東京: ['新宿区', '渋谷区', '港区', '世田谷区', '杉並区', '練馬区', '足立区', '江戸川区'],
  神奈川: ['横浜市', '川崎市', '相模原市', '横須賀市', '藤沢市', '茅ヶ崎市', '厚木市', '小田原市'],
  埼玉: ['さいたま市', '川口市', '所沢市', '越谷市', '草加市', '春日部市', '熊谷市', '川越市'],
  千葉: ['千葉市', '船橋市', '市川市', '松戸市', '柏市', '市原市', '流山市', '八千代市'],
  茨城: ['水戸市', 'つくば市', '日立市', 'ひたちなか市', '古河市', '土浦市', '取手市', '筑西市'],
  栃木: ['宇都宮市', '小山市', '栃木市', '足利市', '佐野市', '鹿沼市', '日光市', '真岡市'],
  群馬: ['前橋市', '高崎市', '桐生市', '伊勢崎市', '太田市', '沼田市', '館林市', '渋川市']
} as const;

export const SALARY_BANDS = ['〜20万', '20–40万', '40–60万', '60万〜'] as const;