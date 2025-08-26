import { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('contractor');
  const [jobs, setJobs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [craftsmanInfo, setCraftsmanInfo] = useState(null);

  const addJob = (jobData) => {
    const newJob = {
      id: Date.now(),
      ...jobData,
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    setJobs([...jobs, newJob]);
    
    const notification = {
      id: Date.now(),
      type: 'job',
      sender: 'system',
      content: `新しい案件が届きました！\n\n職種: ${jobData.jobType}\n現場住所: ${jobData.address}\n単価: ${jobData.price}\n日程: ${jobData.schedule}`,
      jobData: newJob,
      timestamp: newJob.timestamp
    };
    setMessages([...messages, notification]);
  };

  const sendMessage = (message) => {
    setMessages([...messages, message]);
  };

  const value = {
    activeTab,
    setActiveTab,
    jobs,
    addJob,
    messages,
    sendMessage,
    craftsmanInfo,
    setCraftsmanInfo
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};