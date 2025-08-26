import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TRADES, PREFECTURES, CITIES_MAP, SALARY_BANDS, Job } from '../types';
import { IconButton } from './IconButton';
import { updateJob } from '../lib/data';

interface EditJobModalProps {
  job: Job;
  onClose: () => void;
  onJobUpdated: (job: Job) => void;
}

export function EditJobModal({ job, onClose, onJobUpdated }: EditJobModalProps) {
  const [formData, setFormData] = useState({
    trade: job.trade,
    sitePref: job.sitePref,
    siteCity: job.siteCity,
    summary: job.summary,
    startDate: job.startDate,
    endDate: job.endDate,
    salaryBand: job.salaryBand,
    salaryNote: job.salaryNote || '',
    headcountNeeded: job.headcountNeeded
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedJob = updateJob(job.id, {
      trade: formData.trade,
      sitePref: formData.sitePref,
      siteCity: formData.siteCity,
      summary: formData.summary,
      startDate: formData.startDate,
      endDate: formData.endDate,
      salaryBand: formData.salaryBand,
      salaryNote: formData.salaryNote || undefined,
      headcountNeeded: formData.headcountNeeded
    });
    
    if (updatedJob) {
      onJobUpdated(updatedJob);
    }
    onClose();
  };

  const availableCities = formData.sitePref ? CITIES_MAP[formData.sitePref as keyof typeof CITIES_MAP] || [] : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">求人を編集</h2>
          <IconButton onClick={onClose}>
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </IconButton>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">職種 *</label>
            <select
              value={formData.trade}
              onChange={(e) => setFormData({...formData, trade: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              required
            >
              <option value="">選択してください</option>
              {TRADES.map(trade => (
                <option key={trade} value={trade}>{trade}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">都道府県 *</label>
              <select
                value={formData.sitePref}
                onChange={(e) => setFormData({...formData, sitePref: e.target.value, siteCity: ''})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                required
              >
                <option value="">選択</option>
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">市区町村 *</label>
              <select
                value={formData.siteCity}
                onChange={(e) => setFormData({...formData, siteCity: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                required
                disabled={!formData.sitePref}
              >
                <option value="">選択</option>
                {availableCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">概要 *</label>
            <textarea
              value={formData.summary}
              onChange={(e) => setFormData({...formData, summary: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand resize-none"
              placeholder="工事内容や求める経験などを記載してください"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">開始日 *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">終了日 *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">給与帯 *</label>
            <select
              value={formData.salaryBand}
              onChange={(e) => setFormData({...formData, salaryBand: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              required
            >
              <option value="">選択してください</option>
              {SALARY_BANDS.map(band => (
                <option key={band} value={band}>{band}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">給与備考</label>
            <input
              type="text"
              value={formData.salaryNote}
              onChange={(e) => setFormData({...formData, salaryNote: e.target.value})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              placeholder="日給、時給、その他条件など"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">必要人数 *</label>
            <input
              type="number"
              min="1"
              value={formData.headcountNeeded}
              onChange={(e) => setFormData({...formData, headcountNeeded: parseInt(e.target.value) || 1})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-brand text-white rounded-lg hover:bg-brand-hover transition-colors"
            >
              更新
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}