import { AppProvider, useAppContext } from './context/AppContext';
import TabNavigator from './components/TabNavigator';
import ContractorView from './components/ContractorView';
import CraftsmanView from './components/CraftsmanView';

const AppContent = () => {
  const { activeTab } = useAppContext();

  return (
    <div className="min-h-screen bg-gray-50">
      <TabNavigator />
      <div className="h-screen">
        {activeTab === 'contractor' && <ContractorView />}
        {activeTab === 'craftsman' && <CraftsmanView />}
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;