export function computeStartDeadline(startDate: string, bufferDays: number): string {
  const date = new Date(startDate);
  date.setDate(date.getDate() - bufferDays);
  return date.toISOString().split('T')[0];
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('ja-JP');
}