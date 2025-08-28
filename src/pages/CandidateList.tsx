import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, Worker, Trade, Pref } from '../types';
import { mockJobs } from '../data/jobs';
import { mockWorkers } from '../data/workers';
import { useSearchParams, maskUserId, formatLastSeen } from '../utils/helpers';
import { getWorkersFromLocalStorage, updateWorkerInLocalStorage, removeWorkerFromLocalStorage } from '../utils/workerSync';
import { subscribeToWorkers, updateWorkerInFirestore, deleteWorkerFromFirestore } from '../lib/firestoreWorkers';

type SortOption = 'name-asc' | 'lastSeen-desc';

export default function CandidateList() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  
  // Check if this is standalone candidate list (no jobId)
  const isStandalone = !jobId;
  
  const [job, setJob] = useState<Job | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<Worker[]>([]);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<Set<string>>(new Set());
  const [isUsingFirestore, setIsUsingFirestore] = useState(false);
  
  // Filter states
  const [selectedTrades, setSelectedTrades] = useState<Set<Trade>>(new Set());
  const [selectedPref, setSelectedPref] = useState<Pref | ''>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  useEffect(() => {
    if (!isStandalone) {
      // Load job data when coming from job recruitment flow
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      const foundJob = jobs.find((j: Job) => j.id === jobId) || mockJobs.find(j => j.id === jobId);
      setJob(foundJob || null);
    }
    
    // Try to use Firestore first, fallback to localStorage
    let unsubscribe: (() => void) | null = null;
    
    // Set up Firestore real-time subscription
    unsubscribe = subscribeToWorkers((firestoreWorkers) => {
      if (firestoreWorkers.length > 0) {
        console.log('Using Firestore workers:', firestoreWorkers.length);
        setWorkers(firestoreWorkers);
        setFilteredWorkers(firestoreWorkers);
        setIsUsingFirestore(true);
      } else {
        // Fallback to localStorage if no Firestore workers
        const localWorkers = getWorkersFromLocalStorage();
        console.log('Fallback to local workers:', localWorkers.length);
        setWorkers(localWorkers);
        setFilteredWorkers(localWorkers);
        setIsUsingFirestore(false);
      }
    });
    
    // If Firestore subscription failed, use localStorage immediately
    if (!unsubscribe) {
      const localWorkers = getWorkersFromLocalStorage();
      console.log('Firebase not available, using local workers:', localWorkers.length);
      setWorkers(localWorkers);
      setFilteredWorkers(localWorkers);
      setIsUsingFirestore(false);
    }

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [jobId, isStandalone]);

  useEffect(() => {
    applyFilters();
  }, [workers, selectedTrades, selectedPref, selectedCity, sortBy]);

  const applyFilters = () => {
    let filtered = workers;

    // Filter by trade
    if (selectedTrades.size > 0) {
      filtered = filtered.filter(worker => selectedTrades.has(worker.trade));
    }

    // Filter by prefecture
    if (selectedPref) {
      filtered = filtered.filter(worker => worker.pref === selectedPref);
    }

    // Filter by city
    if (selectedCity) {
      filtered = filtered.filter(worker => worker.city === selectedCity);
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'lastSeen-desc':
          const aTime = new Date(a.lastSeenAt || 0).getTime();
          const bTime = new Date(b.lastSeenAt || 0).getTime();
          return bTime - aTime;
        default:
          return 0;
      }
    });

    setFilteredWorkers(filtered);
  };

  const toggleTradeFilter = (trade: Trade) => {
    const newSelected = new Set(selectedTrades);
    if (newSelected.has(trade)) {
      newSelected.delete(trade);
    } else {
      newSelected.add(trade);
    }
    setSelectedTrades(newSelected);
  };

  const getCitiesForPref = (pref: Pref): string[] => {
    return Array.from(new Set(workers.filter(w => w.pref === pref).map(w => w.city))).sort();
  };

  const toggleWorkerSelection = (workerId: string) => {
    const newSelected = new Set(selectedWorkerIds);
    if (newSelected.has(workerId)) {
      newSelected.delete(workerId);
    } else {
      newSelected.add(workerId);
    }
    setSelectedWorkerIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedWorkerIds.size === filteredWorkers.length) {
      setSelectedWorkerIds(new Set());
    } else {
      setSelectedWorkerIds(new Set(filteredWorkers.map(w => w.id)));
    }
  };

  const handleNext = () => {
    if (isStandalone) {
      // In standalone mode, show message that job selection is needed
      alert('候補者にメッセージを送るには、まず求人一覧から案件を選択してください。');
      navigate('/');
    } else {
      const selectedIds = Array.from(selectedWorkerIds).join(',');
      navigate(`/recruit/compose?jobId=${jobId}&ids=${selectedIds}`);
    }
  };

  const handleEdit = async (worker: Worker) => {
    const newName = prompt('名前を編集:', worker.name);
    if (newName && newName.trim() !== worker.name) {
      if (isUsingFirestore) {
        // Update in Firestore (will trigger real-time update)
        const success = await updateWorkerInFirestore(worker.id, { name: newName.trim() });
        if (!success) {
          alert('Firestoreの更新に失敗しました。');
        }
      } else {
        // Fallback to localStorage
        const updatedWorkers = updateWorkerInLocalStorage(worker.id, { name: newName.trim() });
        setWorkers(updatedWorkers);
      }
    }
  };

  const handleDelete = async (workerId: string) => {
    if (window.confirm('この候補者を削除しますか？')) {
      if (isUsingFirestore) {
        // Delete from Firestore (will trigger real-time update)
        const success = await deleteWorkerFromFirestore(workerId);
        if (!success) {
          alert('Firestoreからの削除に失敗しました。');
        }
      } else {
        // Fallback to localStorage
        const updatedWorkers = removeWorkerFromLocalStorage(workerId);
        setWorkers(updatedWorkers);
      }
      
      // Update selected list if deleted worker was selected
      setSelectedWorkerIds(prev => {
        const newSelected = new Set(prev);
        newSelected.delete(workerId);
        return newSelected;
      });
    }
  };

  if (!isStandalone && !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">案件が見つかりません</h2>
          <button 
            onClick={() => navigate('/')}
            className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg"
          >
            求人一覧に戻る
          </button>
        </div>
      </div>
    );
  }

  const allTrades: Trade[] = ['大工', '電気', '左官'];
  const allPrefs: Pref[] = ['東京', '神奈川', '千葉', '埼玉'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-teal-600 hover:text-teal-700 flex items-center gap-2"
            >
              ← {isStandalone ? 'メインメニューに戻る' : '求人一覧に戻る'}
            </button>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">候補者リスト</h1>
            {!isStandalone && job && (
              <div className="text-lg text-gray-700">
                『{job.title}｜{job.startDate}〜{job.endDate}｜{job.salaryBand}』
              </div>
            )}
            {isStandalone && (
              <div className="flex items-center justify-between">
                <div className="text-lg text-gray-700">
                  登録された全候補者の管理・閲覧ができます
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    isUsingFirestore 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {isUsingFirestore ? '🔥 Firestore同期' : '💾 ローカル'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Trade Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">業種</label>
              <div className="flex flex-wrap gap-2">
                {allTrades.map(trade => (
                  <button
                    key={trade}
                    onClick={() => toggleTradeFilter(trade)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedTrades.has(trade)
                        ? 'bg-teal-100 text-teal-800 border border-teal-300'
                        : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {trade}
                  </button>
                ))}
              </div>
            </div>

            {/* Prefecture Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
              <select
                value={selectedPref}
                onChange={(e) => {
                  setSelectedPref(e.target.value as Pref);
                  setSelectedCity('');
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">全て</option>
                {allPrefs.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            {/* City Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={!selectedPref}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100"
              >
                <option value="">全て</option>
                {selectedPref && getCitiesForPref(selectedPref).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ソート</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="name-asc">名前順</option>
                <option value="lastSeen-desc">最近見た順</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              該当 <span className="font-medium">{filteredWorkers.length}</span>・
              選択 <span className="font-medium">{selectedWorkerIds.size}</span>
            </div>
            <button
              onClick={applyFilters}
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-md text-sm"
            >
              適用
            </button>
          </div>
        </div>

        {/* Workers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={filteredWorkers.length > 0 && selectedWorkerIds.size === filteredWorkers.length}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名前</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">業種</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">地域</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">最終更新</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  {isStandalone && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkers.map(worker => (
                  <tr key={worker.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedWorkerIds.has(worker.id)}
                        onChange={() => toggleWorkerSelection(worker.id)}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {worker.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker.trade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {worker.pref}-{worker.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatLastSeen(worker.lastSeenAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                      {maskUserId(worker.id)}
                    </td>
                    {isStandalone && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(worker)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => handleDelete(worker.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            削除
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredWorkers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">該当する候補者がいません</h3>
              <p className="text-gray-500">フィルター条件を調整してください。</p>
            </div>
          )}
        </div>

        {/* Fixed Footer */}
        {!isStandalone && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <span className="font-medium">{selectedWorkerIds.size}</span> 名を選択中
              </div>
              <button
                onClick={handleNext}
                disabled={selectedWorkerIds.size === 0}
                className="bg-teal-500 hover:bg-teal-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-8 rounded-lg transition-colors"
              >
                次へ
              </button>
            </div>
          </div>
        )}

        {/* Spacer for fixed footer only when needed */}
        {!isStandalone && <div className="h-20"></div>}
      </div>
    </div>
  );
}