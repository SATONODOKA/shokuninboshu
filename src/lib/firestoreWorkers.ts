import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { ensureFirebase } from './firebase';
import { Worker } from '../types';
import { WorkerDoc } from '../types/firestore';

// Convert Firestore WorkerDoc to local Worker type
export function convertFirestoreWorkerToLocal(id: string, workerDoc: WorkerDoc): Worker {
  return {
    id: id, // Use document ID as worker ID (which is LINE userId)
    name: workerDoc.name || `候補者${id.substring(-8)}`,
    trade: (workerDoc.trade as any) || '大工',
    pref: (workerDoc.pref as any) || '東京',
    city: workerDoc.city || '品川区',
    lastSeenAt: workerDoc.lastActiveAt?.toDate?.()?.toISOString() || new Date().toISOString(),
  };
}

// Convert local Worker to Firestore WorkerDoc (for updates)
export function convertLocalWorkerToFirestore(worker: Worker): Partial<WorkerDoc> {
  return {
    lineUid: worker.id,
    name: worker.name,
    trade: worker.trade,
    pref: worker.pref,
    city: worker.city,
    lastActiveAt: worker.lastSeenAt ? Timestamp.fromDate(new Date(worker.lastSeenAt)) : Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
}

// Set up real-time listener for workers collection
export function subscribeToWorkers(callback: (workers: Worker[]) => void): (() => void) | null {
  try {
    const firebaseResult = ensureFirebase();
    if (!firebaseResult.success || !firebaseResult.firestore) {
      console.error('Firebase not initialized, cannot subscribe to workers');
      return null;
    }

    const db = firebaseResult.firestore;
    const workersRef = collection(db, 'workers');
    const q = query(workersRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const workers: Worker[] = [];
      querySnapshot.forEach((doc) => {
        const workerData = doc.data() as WorkerDoc;
        const worker = convertFirestoreWorkerToLocal(doc.id, workerData);
        workers.push(worker);
      });
      
      console.log('Firestore workers updated:', workers.length);
      callback(workers);
    }, (error) => {
      console.error('Error listening to workers collection:', error);
      // Fallback to empty array on error
      callback([]);
    });

    return unsubscribe;
  } catch (error) {
    console.error('Error setting up workers subscription:', error);
    return null;
  }
}

// Get workers once (no real-time updates)
export async function getWorkersOnce(): Promise<Worker[]> {
  try {
    const firebaseResult = ensureFirebase();
    if (!firebaseResult.success || !firebaseResult.firestore) {
      console.error('Firebase not initialized');
      return [];
    }

    const db = firebaseResult.firestore;
    const workersRef = collection(db, 'workers');
    const querySnapshot = await getDocs(workersRef);
    
    const workers: Worker[] = [];
    querySnapshot.forEach((doc) => {
      const workerData = doc.data() as WorkerDoc;
      const worker = convertFirestoreWorkerToLocal(doc.id, workerData);
      workers.push(worker);
    });

    return workers;
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
}

// Update worker in Firestore
export async function updateWorkerInFirestore(workerId: string, updates: Partial<Worker>): Promise<boolean> {
  try {
    const firebaseResult = ensureFirebase();
    if (!firebaseResult.success || !firebaseResult.firestore) {
      return false;
    }

    const db = firebaseResult.firestore;
    const workerRef = doc(db, 'workers', workerId);
    
    // Convert updates to Firestore format
    const firestoreUpdates: Partial<WorkerDoc> = {
      updatedAt: Timestamp.now(),
    };
    
    if (updates.name) firestoreUpdates.name = updates.name;
    if (updates.trade) firestoreUpdates.trade = updates.trade;
    if (updates.pref) firestoreUpdates.pref = updates.pref;
    if (updates.city) firestoreUpdates.city = updates.city;
    if (updates.lastSeenAt) {
      firestoreUpdates.lastActiveAt = Timestamp.fromDate(new Date(updates.lastSeenAt));
    }

    await updateDoc(workerRef, firestoreUpdates);
    return true;
  } catch (error) {
    console.error('Error updating worker in Firestore:', error);
    return false;
  }
}

// Delete worker from Firestore
export async function deleteWorkerFromFirestore(workerId: string): Promise<boolean> {
  try {
    const firebaseResult = ensureFirebase();
    if (!firebaseResult.success || !firebaseResult.firestore) {
      return false;
    }

    const db = firebaseResult.firestore;
    const workerRef = doc(db, 'workers', workerId);
    await deleteDoc(workerRef);
    return true;
  } catch (error) {
    console.error('Error deleting worker from Firestore:', error);
    return false;
  }
}