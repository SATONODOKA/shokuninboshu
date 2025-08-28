import { Worker } from '../types';
import { mockWorkers } from '../data/workers';

export function initializeWorkersInLocalStorage() {
  const storedWorkers = localStorage.getItem('workers');
  if (!storedWorkers) {
    // Initialize with mock data if no stored workers
    localStorage.setItem('workers', JSON.stringify(mockWorkers));
    return mockWorkers;
  }
  return JSON.parse(storedWorkers);
}

export function addWorkerToLocalStorage(worker: Worker) {
  const storedWorkers = localStorage.getItem('workers');
  const currentWorkers: Worker[] = storedWorkers ? JSON.parse(storedWorkers) : mockWorkers;
  
  // Check if worker already exists
  const existingWorkerIndex = currentWorkers.findIndex(w => w.id === worker.id);
  
  if (existingWorkerIndex >= 0) {
    // Update existing worker
    currentWorkers[existingWorkerIndex] = { ...currentWorkers[existingWorkerIndex], ...worker };
  } else {
    // Add new worker
    currentWorkers.push(worker);
  }
  
  localStorage.setItem('workers', JSON.stringify(currentWorkers));
  return currentWorkers;
}

export function updateWorkerInLocalStorage(workerId: string, updates: Partial<Worker>) {
  const storedWorkers = localStorage.getItem('workers');
  const currentWorkers: Worker[] = storedWorkers ? JSON.parse(storedWorkers) : mockWorkers;
  
  const workerIndex = currentWorkers.findIndex(w => w.id === workerId);
  if (workerIndex >= 0) {
    currentWorkers[workerIndex] = { ...currentWorkers[workerIndex], ...updates };
    localStorage.setItem('workers', JSON.stringify(currentWorkers));
  }
  
  return currentWorkers;
}

export function removeWorkerFromLocalStorage(workerId: string) {
  const storedWorkers = localStorage.getItem('workers');
  const currentWorkers: Worker[] = storedWorkers ? JSON.parse(storedWorkers) : mockWorkers;
  
  const filteredWorkers = currentWorkers.filter(w => w.id !== workerId);
  localStorage.setItem('workers', JSON.stringify(filteredWorkers));
  return filteredWorkers;
}

export function getWorkersFromLocalStorage(): Worker[] {
  const storedWorkers = localStorage.getItem('workers');
  return storedWorkers ? JSON.parse(storedWorkers) : mockWorkers;
}