import { useAppContext } from '../hooks/useAppContext';

const ChatUI = () => {
  const { messages, sendMessage, craftsmanInfo } = useAppContext();

  const handleApply = () => {
    const replyMessage = {
      id: Date.now(),
      type: 'reply',
      sender: 'user',
      content: '応募しました',
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    sendMessage(replyMessage);
  };

  const handleSkip = () => {
    const replyMessage = {
      id: Date.now(),
      type: 'reply',
      sender: 'user',
      content: 'スルーしました',
      timestamp: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    };
    sendMessage(replyMessage);
  };

  if (messages.length === 0) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-gray-100 p-4 border-b">
          <h3 className="font-bold text-gray-800">案件通知チャット</h3>
          <p className="text-sm text-gray-600">{craftsmanInfo.name}さん</p>
        </div>
        
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p>まだ通知はありません</p>
            <p className="text-sm mt-2">工務店から案件が届くとここに表示されます</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <div className="bg-white p-4 border-b shadow-sm">
        <h3 className="font-bold text-gray-800">案件通知チャット</h3>
        <p className="text-sm text-gray-600">{craftsmanInfo.name}さん</p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            {message.sender === 'user' ? (
              <div className="max-w-xs">
                <div 
                  className="text-white p-3 rounded-lg shadow-sm"
                  style={{ 
                    backgroundColor: '#00B900',
                    borderRadius: '18px 18px 4px 18px'
                  }}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 text-right">{message.timestamp}</p>
              </div>
            ) : (
              <div className="max-w-sm">
                <div 
                  className="bg-white p-3 shadow-sm border-0"
                  style={{ 
                    borderRadius: '18px 18px 18px 4px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <p className="text-gray-800 text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.type === 'job' && (
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => handleApply()}
                        className="flex-1 py-2 px-3 text-white text-xs rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#007AFF' }}
                      >
                        応募する
                      </button>
                      <button
                        onClick={() => handleSkip()}
                        className="flex-1 py-2 px-3 text-white text-xs rounded-lg hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: '#8E8E93' }}
                      >
                        スルーする
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{message.timestamp}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatUI;