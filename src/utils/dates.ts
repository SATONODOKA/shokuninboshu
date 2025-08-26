export function fmtDate(dateString: string): string {
  if (!dateString) return '';
  
  try {
    // Handle ISO date strings and YYYY-MM-DD format
    let date: Date;
    if (dateString.includes('T')) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + 'T00:00:00');
    }
    
    // Validate date
    if (isNaN(date.getTime())) {
      return dateString;
    }
    
    if (typeof window !== 'undefined' && typeof Intl !== 'undefined') {
      try {
        return new Intl.DateTimeFormat('ja-JP', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        }).format(date);
      } catch {
        // Fallback if Intl is not supported
      }
    }
    
    // Manual formatting as fallback
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.warn('Date formatting error:', error);
    return dateString;
  }
}

export function fromNow(timestamp: number): string {
  if (!timestamp || isNaN(timestamp)) {
    return '';
  }
  
  try {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 0) {
      return 'たった今';
    }
    
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
  } catch (error) {
    console.warn('fromNow error:', error);
    return '';
  }
}

export function getCurrentDateString(): string {
  try {
    const now = new Date();
    if (isNaN(now.getTime())) {
      // Fallback to manual date construction
      const fallback = new Date();
      const year = fallback.getFullYear();
      const month = String(fallback.getMonth() + 1).padStart(2, '0');
      const day = String(fallback.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return now.toISOString().split('T')[0];
  } catch (error) {
    console.warn('getCurrentDateString error:', error);
    // Manual fallback
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') return false;
  
  try {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime()) && date.getFullYear() > 1900;
  } catch (error) {
    console.warn('isValidDateString error:', error);
    return false;
  }
}