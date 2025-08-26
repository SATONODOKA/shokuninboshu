export function computeStartDeadline(startDate: string, bufferDays: number): string {
  try {
    // UTC時間で計算してタイムゾーンの影響を避ける
    const date = new Date(startDate + 'T00:00:00Z');
    date.setUTCDate(date.getUTCDate() - bufferDays);
    return date.toISOString().split('T')[0];
  } catch {
    // フォールバック: 現在日付から計算
    const fallback = new Date();
    fallback.setDate(fallback.getDate() - bufferDays);
    return fallback.toISOString().split('T')[0];
  }
}

export function formatDate(dateString: string): string {
  try {
    // 日付文字列をUTCとして解析
    const date = new Date(dateString + 'T00:00:00Z');
    
    // ブラウザ環境での日本語フォーマット
    if (typeof window !== 'undefined') {
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Asia/Tokyo'
      }).format(date);
    }
    
    // サーバー側でのフォールバック
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}/${month}/${day}`;
  } catch {
    return dateString; // パースに失敗した場合は元の文字列を返す
  }
}

export function getCurrentDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}