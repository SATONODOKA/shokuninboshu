import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job, Trade, Pref, JobStatus } from '../types';
import { useSearchParams } from '../utils/helpers';

export default function JobCreate() {
  const navigate = useNavigate();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const isEditing = !!editId;

  const [formData, setFormData] = useState({
    trade: '' as Trade | '',
    pref: '' as Pref | '',
    city: '',
    startDate: '',
    endDate: '',
    salaryMin: '',
    salaryMax: '',
    need: 1,
    summary: '',
    status: 'OPEN' as JobStatus,
    isPublished: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trades: Trade[] = ['大工', '電気', '左官'];
  const prefs: Pref[] = ['東京', '神奈川', '千葉', '埼玉'];
  const cities = {
    '東京': ['新宿区', '渋谷区', '港区', '世田谷区', '杉並区', '練馬区', '品川区', '足立区'],
    '神奈川': ['横浜市', '川崎市', '相模原市', '藤沢市', '茅ヶ崎市', '小田原市', '厚木市'],
    '千葉': ['千葉市', '船橋市', '市川市', '松戸市', '柏市', '浦安市', '流山市'],
    '埼玉': ['さいたま市', '川口市', '所沢市', '越谷市', '草加市', '春日部市', '熊谷市']
  };

  useEffect(() => {
    if (isEditing) {
      // Load existing job data for editing
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      const job = jobs.find((j: Job) => j.id === editId);
      if (job) {
        setFormData({
          trade: job.trade,
          pref: job.pref,
          city: job.city,
          startDate: job.startDate,
          endDate: job.endDate,
          salaryMin: job.salaryBand.split('〜')[0]?.replace('万円/日', '').trim() || '',
          salaryMax: job.salaryBand.split('〜')[1]?.replace('万円/日', '').trim() || '',
          need: job.need,
          summary: job.summary || '',
          status: job.status,
          isPublished: job.isPublished
        });
      }
    }
  }, [isEditing, editId]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.trade) newErrors.trade = '業種を選択してください';
    if (!formData.pref) newErrors.pref = '都道府県を選択してください';
    if (!formData.city) newErrors.city = '市区町村を選択してください';
    if (!formData.startDate) newErrors.startDate = '開始日を入力してください';
    if (!formData.endDate) newErrors.endDate = '終了日を入力してください';
    if (!formData.salaryMin) newErrors.salaryMin = '最低給与を入力してください';
    if (!formData.salaryMax) newErrors.salaryMax = '最高給与を入力してください';
    if (formData.need < 1) newErrors.need = '必要人数は1名以上で入力してください';

    // Date validation
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (start >= end) {
        newErrors.endDate = '終了日は開始日より後の日付を選択してください';
      }
    }

    // Salary validation
    if (formData.salaryMin && formData.salaryMax) {
      const min = parseFloat(formData.salaryMin);
      const max = parseFloat(formData.salaryMax);
      if (min >= max) {
        newErrors.salaryMax = '最高給与は最低給与より高く設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
      const salaryBand = `${formData.salaryMin}〜${formData.salaryMax}万円/日`;
      const title = `【${formData.trade}】${formData.city} ${formData.need}名`;

      const jobData: Job = {
        id: isEditing ? editId! : `job-${Date.now()}`,
        title,
        trade: formData.trade as Trade,
        pref: formData.pref as Pref,
        city: formData.city,
        startDate: formData.startDate,
        endDate: formData.endDate,
        salaryBand,
        need: formData.need,
        decided: isEditing ? jobs.find((j: Job) => j.id === editId)?.decided || 0 : 0,
        summary: formData.summary,
        notifyCount: isEditing ? jobs.find((j: Job) => j.id === editId)?.notifyCount || 0 : 0,
        status: formData.status,
        isPublished: formData.isPublished
      };

      let updatedJobs;
      if (isEditing) {
        updatedJobs = jobs.map((j: Job) => j.id === editId ? jobData : j);
      } else {
        updatedJobs = [...jobs, jobData];
      }

      localStorage.setItem('jobs', JSON.stringify(updatedJobs));

      // Show success message
      showSuccessToast(isEditing ? '求人を更新しました' : '求人を作成しました');

      // Navigate back to job list
      setTimeout(() => {
        navigate('/');
      }, 1000);

    } catch (error) {
      console.error('Error saving job:', error);
      showErrorToast('保存中にエラーが発生しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const showSuccessToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const showErrorToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }

    // Reset city when prefecture changes
    if (field === 'pref') {
      setFormData(prev => ({
        ...prev,
        city: ''
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="text-teal-600 hover:text-teal-700 flex items-center gap-2 mb-4"
          >
            ← 求人一覧に戻る
          </button>
          
          <h1 className="text-3xl font-bold text-gray-800">
            {isEditing ? '求人を編集' : '新しい求人を作成'}
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                業種 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.trade}
                onChange={(e) => handleChange('trade', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.trade ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {trades.map(trade => (
                  <option key={trade} value={trade}>{trade}</option>
                ))}
              </select>
              {errors.trade && <p className="text-red-500 text-xs mt-1">{errors.trade}</p>}
            </div>

            {/* Prefecture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                都道府県 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.pref}
                onChange={(e) => handleChange('pref', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.pref ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {prefs.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
              {errors.pref && <p className="text-red-500 text-xs mt-1">{errors.pref}</p>}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                市区町村 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={!formData.pref}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:bg-gray-100 ${
                  errors.city ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">選択してください</option>
                {formData.pref && cities[formData.pref as Pref]?.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
            </div>

            {/* Need count */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                必要人数 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.need}
                onChange={(e) => handleChange('need', parseInt(e.target.value) || 1)}
                min="1"
                max="50"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.need ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.need && <p className="text-red-500 text-xs mt-1">{errors.need}</p>}
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                開始日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.startDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                終了日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.endDate ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>

            {/* Salary Min */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最低給与 (万円/日) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.salaryMin}
                onChange={(e) => handleChange('salaryMin', e.target.value)}
                step="0.1"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.salaryMin ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="2.5"
              />
              {errors.salaryMin && <p className="text-red-500 text-xs mt-1">{errors.salaryMin}</p>}
            </div>

            {/* Salary Max */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最高給与 (万円/日) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.salaryMax}
                onChange={(e) => handleChange('salaryMax', e.target.value)}
                step="0.1"
                min="0"
                className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  errors.salaryMax ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="4.0"
              />
              {errors.salaryMax && <p className="text-red-500 text-xs mt-1">{errors.salaryMax}</p>}
            </div>
          </div>

          {/* Summary */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              詳細・備考
            </label>
            <textarea
              value={formData.summary}
              onChange={(e) => handleChange('summary', e.target.value)}
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="現場の詳細情報や特記事項があれば入力してください..."
            />
          </div>

          {/* Status and Publish settings */}
          {isEditing && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="OPEN">募集中</option>
                  <option value="PAUSED">一時停止</option>
                  <option value="COMPLETED">完了</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => handleChange('isPublished', e.target.checked)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="isPublished" className="ml-2 text-sm text-gray-700">
                  求人を公開する
                </label>
              </div>
            </div>
          )}

          {/* Submit buttons */}
          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? '保存中...' : isEditing ? '更新する' : '作成する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}