// Utility functions for the application

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric'
  });
}

export function maskUserId(userId: string): string {
  // Show full ID for 佐藤温 (for testing purposes)
  if (userId === 'U183464892806e6fa15f21be39de2f14e') {
    return userId;
  }
  
  if (userId.length <= 4) return userId;
  return `${userId.slice(0, 1)}${'x'.repeat(Math.max(0, userId.length - 8))}...${userId.slice(-4)}`;
}

export function formatLastSeen(lastSeenAt?: string): string {
  if (!lastSeenAt) return '不明';
  
  const date = new Date(lastSeenAt);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return '1時間以内';
  if (diffInHours < 24) return `${diffInHours}時間前`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}日前`;
  
  return date.toLocaleDateString('ja-JP', {
    month: 'numeric',
    day: 'numeric'
  });
}

export function generateJobTemplate(job: { title: string; pref: string; city: string; startDate: string; endDate: string; salaryBand: string }): string {
  const startFormatted = formatDate(job.startDate);
  const endFormatted = formatDate(job.endDate);
  
  return `${job.title}／${startFormatted}〜${endFormatted}／${job.salaryBand}

現場: ${job.pref}${job.city}○○
条件に合う方は「応募します」と返信 or お電話ください：080-xxxx-xxxx

詳細についてはお気軽にお問い合わせください。`;
}

export function countCharacters(text: string): number {
  return text.length;
}

export function useSearchParams() {
  const searchParams = new URLSearchParams(window.location.search);
  
  return {
    get: (key: string) => searchParams.get(key),
    getAll: (key: string) => searchParams.getAll(key)
  };
}