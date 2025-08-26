import { useAppContext } from '../context/AppContext';

const TabNavigator = () => {
  const { activeTab, setActiveTab } = useAppContext();

  return (
    <div className="flex bg-white border-b border-gray-200">
      <button
        onClick={() => setActiveTab('contractor')}
        className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all ${
          activeTab === 'contractor'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
        }`}
      >
        工務店
      </button>
      <button
        onClick={() => setActiveTab('craftsman')}
        className={`flex-1 py-3 px-4 text-center font-medium text-sm transition-all ${
          activeTab === 'craftsman'
            ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
        }`}
      >
        職人
      </button>
    </div>
  );
};

export default TabNavigator;