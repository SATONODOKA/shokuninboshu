export function fmtDate(dateString: string): string {
  try {
    const date = new Date(dateString + 'T00:00:00Z');
    
    if (typeof window !== 'undefined') {
      return new Intl.DateTimeFormat('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZone: 'Asia/Tokyo'
      }).format(date);
    }
    
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${year}/${month}/${day}`;
  } catch {
    return dateString;
  }
}

export function fromNow(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}日前`;
  } else if (hours > 0) {
    return `${hours}時間前`;
  } else if (minutes > 0) {
    return `${minutes}分前`;
  } else {
    return 'たった今';
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