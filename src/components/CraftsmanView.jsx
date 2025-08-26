import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ChatUI from './ChatUI';

const CraftsmanView = () => {
  const { craftsmanInfo, setCraftsmanInfo } = useAppContext();
  const [formData, setFormData] = useState({
    name: '',
    jobType: '',
    address: '',
    movingRange: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.jobType || !formData.address || !formData.movingRange) {
      alert('すべての項目を入力してください');
      return;
    }

    setCraftsmanInfo(formData);
  };

  if (!craftsmanInfo) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">職人情報登録</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="例: 山田太郎"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              職種
            </label>
            <input
              type="text"
              name="jobType"
              value={formData.jobType}
              onChange={handleInputChange}
              placeholder="例: 大工、電気工事士、配管工"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              現在地住所
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="例: 東京都新宿区○○1-2-3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              移動可能範囲
            </label>
            <input
              type="text"
              name="movingRange"
              value={formData.movingRange}
              onChange={handleInputChange}
              placeholder="例: 都内全域、関東近郊"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            登録完了
          </button>
        </form>
      </div>
    );
  }

  return <ChatUI />;
};

export default CraftsmanView;