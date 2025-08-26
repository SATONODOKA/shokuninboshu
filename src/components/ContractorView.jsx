import { useState } from 'react';
import { useAppContext } from '../context/AppContext';

const ContractorView = () => {
  const { addJob } = useAppContext();
  const [formData, setFormData] = useState({
    jobType: '',
    address: '',
    price: '',
    schedule: ''
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
    
    if (!formData.jobType || !formData.address || !formData.price || !formData.schedule) {
      alert('すべての項目を入力してください');
      return;
    }

    addJob(formData);
    
    setFormData({
      jobType: '',
      address: '',
      price: '',
      schedule: ''
    });
    
    alert('募集を掛けました！職人タブで確認できます。');
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">新規案件募集</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
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
            現場住所
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="例: 東京都渋谷区○○1-2-3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            単価
          </label>
          <input
            type="text"
            name="price"
            value={formData.price}
            onChange={handleInputChange}
            placeholder="例: 日給15,000円〜"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            日程
          </label>
          <input
            type="text"
            name="schedule"
            value={formData.schedule}
            onChange={handleInputChange}
            placeholder="例: 2024年1月15日〜1月31日"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          募集をかける
        </button>
      </form>
    </div>
  );
};

export default ContractorView;