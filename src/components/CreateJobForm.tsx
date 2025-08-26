import { useState } from 'react';
import { TRADES, PREFECTURES, CITIES_MAP, SALARY_BANDS, DEADLINE_BUFFERS } from '../types';
import type { Job } from '../types';
import { generateId } from '../lib/ids';
import { upsertItemById } from '../lib/storage';

interface CreateJobFormProps {
  onSuccess: () => void;
  editJob?: Job;
}

export default function CreateJobForm({ onSuccess, editJob }: CreateJobFormProps) {
  const [formData, setFormData] = useState({
    trade: editJob?.trade || '',
    sitePref: editJob?.sitePref || '',
    siteCity: editJob?.siteCity || '',
    summary: editJob?.summary || '',
    startDate: editJob?.startDate || '',
    endDate: editJob?.endDate || '',
    salaryBand: editJob?.salaryBand || '',
    salaryNote: editJob?.salaryNote || '',
    headcountNeeded: editJob?.headcountNeeded || 1,
    startByDeadlineDays: editJob?.startByDeadlineDays || 7
  });

  const [showToast, setShowToast] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'headcountNeeded' || name === 'startByDeadlineDays' ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.trade || !formData.sitePref || !formData.siteCity || !formData.summary || 
        !formData.startDate || !formData.endDate || !formData.salaryBand) {
      alert('必須項目を入力してください');
      return;
    }

    const now = Date.now();
    const job: Job = {
      id: editJob?.id || generateId(),
      ...formData,
      headcountFilled: editJob?.headcountFilled || 0,
      stopPublish: editJob?.stopPublish || false,
      status: editJob?.status || 'OPEN',
      notifyCount: editJob?.notifyCount || 0,
      createdAt: editJob?.createdAt || now,
      lastUpdatedAt: now
    };

    upsertItemById('jobs', job);
    
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onSuccess();
    }, 2000);

    if (!editJob) {
      setFormData({
        trade: '',
        sitePref: '',
        siteCity: '',
        summary: '',
        startDate: '',
        endDate: '',
        salaryBand: '',
        salaryNote: '',
        headcountNeeded: 1,
        startByDeadlineDays: 7
      });
    }
  };

  const availableCities = formData.sitePref ? CITIES_MAP[formData.sitePref as keyof typeof CITIES_MAP] || [] : [];

  return (
    <div className="max-w-2xl mx-auto p-6">
      {showToast && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">
          {editJob ? '求人を更新しました' : '求人を公開しました'}
        </div>
      )}
      
      <h2 className="text-2xl font-bold mb-6">{editJob ? '求人編集' : '新規募集'}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">職種 *</label>
            <select
              name="trade"
              value={formData.trade}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {TRADES.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">欲しい人数 *</label>
            <select
              name="headcountNeeded"
              value={formData.headcountNeeded}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {[...Array(20)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}人</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">都道府県 *</label>
            <select
              name="sitePref"
              value={formData.sitePref}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {PREFECTURES.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">市区町村 *</label>
            <select
              name="siteCity"
              value={formData.siteCity}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={!formData.sitePref}
              required
            >
              <option value="">選択してください</option>
              {availableCities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">案件概要 *</label>
          <textarea
            name="summary"
            value={formData.summary}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="案件の概要を入力してください"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始日 *</label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">終了日 *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">給与帯 *</label>
            <select
              name="salaryBand"
              value={formData.salaryBand}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">選択してください</option>
              {SALARY_BANDS.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">着手期限バッファ（日数） *</label>
            <select
              name="startByDeadlineDays"
              value={formData.startByDeadlineDays}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              {DEADLINE_BUFFERS.map(days => (
                <option key={days} value={days}>{days}日前</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">給与補足</label>
          <input
            type="text"
            name="salaryNote"
            value={formData.salaryNote}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="例：経験に応じて調整、交通費別途支給"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            {editJob ? '更新する' : '公開して募集を開始'}
          </button>
        </div>
      </form>
    </div>
  );
}