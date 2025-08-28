import { useState } from 'react';
import { ensureFirebase } from '../lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc, Timestamp } from 'firebase/firestore';
import { WorkerDoc } from '../types/firestore';

export default function FirestoreTest() {
  const [status, setStatus] = useState<string>('');
  const [workers, setWorkers] = useState<any[]>([]);

  const testFirebaseConnection = async () => {
    setStatus('Testing Firebase connection...');
    try {
      const firebaseResult = ensureFirebase();
      if (!firebaseResult.success) {
        setStatus(`Firebase init failed: ${firebaseResult.error}`);
        return;
      }

      if (!firebaseResult.firestore) {
        setStatus('Firestore not available');
        return;
      }

      setStatus('Firebase connected successfully!');
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const addTestWorker = async () => {
    setStatus('Adding test worker...');
    try {
      const firebaseResult = ensureFirebase();
      if (!firebaseResult.success || !firebaseResult.firestore) {
        setStatus('Firebase not initialized');
        return;
      }

      const db = firebaseResult.firestore;
      const testWorkerId = `test_${Date.now()}`;
      
      const workerDoc: WorkerDoc = {
        lineUid: testWorkerId,
        name: `テスト候補者${testWorkerId.slice(-4)}`,
        trade: '大工',
        pref: '東京',
        city: '品川区',
        status: 'active',
        source: 'follow',
        lastActiveAt: Timestamp.now(),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const workerRef = doc(db, 'workers', testWorkerId);
      await setDoc(workerRef, workerDoc);
      
      setStatus(`Test worker added successfully: ${testWorkerId}`);
      await loadWorkers();
    } catch (error: any) {
      setStatus(`Error adding worker: ${error.message}`);
      console.error('Full error:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
      
      // Show more detailed error message
      if (error.code === 'permission-denied') {
        setStatus('Permission denied: Check Firestore security rules');
      } else if (error.code === 'unavailable') {
        setStatus('Firestore unavailable: Check network connection');
      } else {
        setStatus(`Error: ${error.code} - ${error.message}`);
      }
    }
  };

  const loadWorkers = async () => {
    setStatus('Loading workers...');
    try {
      const firebaseResult = ensureFirebase();
      if (!firebaseResult.success || !firebaseResult.firestore) {
        setStatus('Firebase not initialized');
        return;
      }

      const db = firebaseResult.firestore;
      const workersRef = collection(db, 'workers');
      const querySnapshot = await getDocs(workersRef);
      
      const workersData: any[] = [];
      querySnapshot.forEach((doc) => {
        workersData.push({ id: doc.id, ...doc.data() });
      });

      setWorkers(workersData);
      setStatus(`Loaded ${workersData.length} workers from Firestore`);
    } catch (error: any) {
      setStatus(`Error loading workers: ${error.message}`);
      console.error('Full error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Firestore テスト</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Firestore 接続テスト</h2>
          
          <div className="space-y-4">
            <button
              onClick={testFirebaseConnection}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Firebase接続テスト
            </button>
            
            <button
              onClick={addTestWorker}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            >
              テスト候補者追加
            </button>
            
            <button
              onClick={loadWorkers}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              候補者一覧読み込み
            </button>
          </div>
          
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="font-semibold mb-2">ステータス:</h3>
            <p className="text-sm">{status}</p>
          </div>
        </div>

        {workers.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Firestore候補者データ ({workers.length}件)</h2>
            <div className="space-y-2">
              {workers.map((worker, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded flex justify-between">
                  <div>
                    <div className="font-medium">{worker.name}</div>
                    <div className="text-sm text-gray-600">
                      {worker.trade} | {worker.pref}-{worker.city} | {worker.status}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    ID: {worker.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}