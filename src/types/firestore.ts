export type WorkerDoc = {
  lineUid: string;      // LINE userId
  name?: string;
  photoUrl?: string;
  trade?: string;       // '大工' | '電気' | '左官' など
  pref?: string;        // 都道府県
  city?: string;        // 市区
  status?: 'active' | 'blocked' | 'pending';
  source?: 'liff' | 'follow' | 'import';
  lastActiveAt?: any;   // Firestore Timestamp | null
  lastNotifiedAt?: any; // Firestore Timestamp | null
  createdAt?: any;
  updatedAt?: any;
};

export type SendLogDoc = {
  jobId: string;
  message: string;
  toCount: number;
  success: string[];                 // lineUid 配列
  failed: { id: string; reason: string }[];
  createdAt?: any;
  createdBy?: string;
};