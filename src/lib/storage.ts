import { isLocalStorageAvailable } from '../config/env';

// In-memory fallback for when localStorage is not available
const memoryStorage = new Map<string, string>();

function safeGetItem(key: string): string | null {
  if (!key) return null;
  
  try {
    if (isLocalStorageAvailable) {
      return localStorage.getItem(key);
    }
    return memoryStorage.get(key) || null;
  } catch (error) {
    console.warn(`Failed to get item "${key}" from storage:`, error);
    return memoryStorage.get(key) || null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  if (!key) return false;
  
  try {
    if (isLocalStorageAvailable) {
      localStorage.setItem(key, value);
      // Also backup to memory in case localStorage becomes unavailable
      memoryStorage.set(key, value);
      return true;
    }
    memoryStorage.set(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set item "${key}" in storage:`, error);
    // Fallback to memory storage
    try {
      memoryStorage.set(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

export function getArray(key: string): any[] {
  try {
    const data = safeGetItem(key);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`Failed to parse array from storage key "${key}":`, error);
    return [];
  }
}

export function setArray(key: string, arr: any[]): boolean {
  try {
    if (!Array.isArray(arr)) {
      console.warn(`Attempted to set non-array value for key "${key}"`);
      return false;
    }
    
    const serialized = JSON.stringify(arr);
    return safeSetItem(key, serialized);
  } catch (error) {
    console.warn(`Failed to serialize array for key "${key}":`, error);
    return false;
  }
}

export function pushItem(key: string, item: any): boolean {
  try {
    if (!item || typeof item !== 'object') {
      console.warn(`Invalid item provided for key "${key}"`);
      return false;
    }
    
    const arr = getArray(key);
    arr.push(item);
    return setArray(key, arr);
  } catch (error) {
    console.warn(`Failed to push item to array "${key}":`, error);
    return false;
  }
}

export function upsertItemById(key: string, item: any): boolean {
  try {
    if (!item || typeof item !== 'object' || !item.id) {
      console.warn(`Invalid item provided for upsert in key "${key}" - item must have id`);
      return false;
    }
    
    const arr = getArray(key);
    const index = arr.findIndex(x => x && x.id === item.id);
    
    if (index >= 0) {
      arr[index] = item;
    } else {
      arr.push(item);
    }
    
    return setArray(key, arr);
  } catch (error) {
    console.warn(`Failed to upsert item in array "${key}":`, error);
    return false;
  }
}

export function removeItemById(key: string, id: string): boolean {
  try {
    if (!id) {
      console.warn(`Invalid id provided for removal from key "${key}"`);
      return false;
    }
    
    const arr = getArray(key);
    const filtered = arr.filter(x => x && x.id !== id);
    
    return setArray(key, filtered);
  } catch (error) {
    console.warn(`Failed to remove item from array "${key}":`, error);
    return false;
  }
}

// Initialize localStorage keys if they don't exist
export function initializeStorage(): void {
  const keys = ['jobs', 'applications', 'jobChats'];
  
  keys.forEach(key => {
    const existing = safeGetItem(key);
    if (!existing) {
      safeSetItem(key, JSON.stringify([]));
    }
  });
}

// Clear all app data (useful for testing/reset)
export function clearAllAppData(): boolean {
  try {
    const keys = ['jobs', 'applications', 'jobChats'];
    let success = true;
    
    keys.forEach(key => {
      if (!setArray(key, [])) {
        success = false;
      }
    });
    
    return success;
  } catch (error) {
    console.warn('Failed to clear app data:', error);
    return false;
  }
}