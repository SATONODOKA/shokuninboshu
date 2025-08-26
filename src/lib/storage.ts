export function getArray(key: string): any[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function setArray(key: string, arr: any[]): void {
  localStorage.setItem(key, JSON.stringify(arr));
}

export function pushItem(key: string, item: any): void {
  const arr = getArray(key);
  arr.push(item);
  setArray(key, arr);
}

export function upsertItemById(key: string, item: any): void {
  const arr = getArray(key);
  const index = arr.findIndex(x => x.id === item.id);
  if (index >= 0) {
    arr[index] = item;
  } else {
    arr.push(item);
  }
  setArray(key, arr);
}

export function removeItemById(key: string, id: string): void {
  const arr = getArray(key);
  const filtered = arr.filter(x => x.id !== id);
  setArray(key, filtered);
}