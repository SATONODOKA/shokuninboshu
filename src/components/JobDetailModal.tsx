import { useState, useEffect } from 'react';
import type { Job, Application, JobChatMessage } from '../types';
import { getArray, upsertItemById, pushItem } from '../lib/storage';
import { computeStartDeadline, formatDate } from '../utils/dates';
import { generateId } from '../lib/ids';
import { bus } from '../lib/bus';

interface JobDetailModalProps {
  job: Job;
  onClose: () => void;
  onEdit: (job: Job) => void;
  onUpdate: () => void;
}

export default function JobDetailModal({ job, onClose, onEdit, onUpdate }: JobDetailModalProps) {
  const [applications, setApplications] = useState<Application[]>([]);
  const [chatMessages, setChatMessages] = useState<JobChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showAddApplication, setShowAddApplication] = useState(false);
  const [applicationForm, setApplicationForm] = useState({
    applicantName: '',
    applicantTrade: '',
    applicantPref: '',
    applicantCity: '',
    phone: '',
    lineId: '',
    selfReportedDriveMin: '',
    note: ''
  });

  useEffect(() => {
    loadData();
  }, [job.id]);

  const loadData = () => {
    const allApplications = getArray('applications');
    const allChats = getArray('jobChats');
    
    setApplications(allApplications.filter((app: Application) => app.jobId === job.id));
    setChatMessages(allChats.filter((chat: JobChatMessage) => chat.jobId === job.id)
      .sort((a, b) => a.createdAt - b.createdAt));
  };

  const handleNotify = () => {
    const updatedJob = {
      ...job,
      notifyCount: job.notifyCount + 1,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    
    pushItem('jobChats', {
      id: generateId(),
      jobId: job.id,
      role: 'system',
      text: `募集通知を送信しました（${job.notifyCount + 1}回目）`,
      createdAt: Date.now()
    });

    // Send notification to LINE mock
    bus.emit('JOB_PUBLISHED', {
      id: job.id,
      title: job.summary,
      trade: job.trade,
      location: `${job.sitePref}${job.siteCity}`,
      salary: job.salaryAmount ? `${job.salaryAmount}万円` : '応相談',
      period: job.workPeriod || '応相談'
    });
    
    onUpdate();
    loadData();
  };

  const handleTogglePublish = () => {
    const updatedJob = {
      ...job,
      stopPublish: !job.stopPublish,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    onUpdate();
  };

  const handleCloseJob = () => {
    const updatedJob = {
      ...job,
      status: 'CLOSED' as const,
      lastUpdatedAt: Date.now()
    };
    upsertItemById('jobs', updatedJob);
    onUpdate();
  };

  const handleApplicationStatusChange = (applicationId: string, newStatus: Application['status']) => {
    const application = applications.find(app => app.id === applicationId);
    if (!application) return;

    const updatedApplication = { ...application, status: newStatus };
    upsertItemById('applications', updatedApplication);

    // HIREDの場合、job.headcountFilledを更新
    if (newStatus === 'HIRED' && application.status !== 'HIRED') {
      const newHeadcountFilled = Math.min(job.headcountFilled + 1, job.headcountNeeded);
      const updatedJob = {
        ...job,
        headcountFilled: newHeadcountFilled,
        status: newHeadcountFilled > 0 ? 'IN_PROGRESS' as const : job.status,
        lastUpdatedAt: Date.now()
      };
      upsertItemById('jobs', updatedJob);
    } else if (application.status === 'HIRED' && newStatus !== 'HIRED') {
      // HIREDから他のステータスに変更された場合、headcountFilledを減らす
      const newHeadcountFilled = Math.max(job.headcountFilled - 1, 0);
      const updatedJob = {
        ...job,
        headcountFilled: newHeadcountFilled,
        lastUpdatedAt: Date.now()
      };
      upsertItemById('jobs', updatedJob);
    }

    onUpdate();
    loadData();
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    pushItem('jobChats', {
      id: generateId(),
      jobId: job.id,
      role: 'contractor',
      text: newMessage,
      createdAt: Date.now()
    });

    setNewMessage('');
    loadData();
  };

  const handleAddApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicationForm.applicantName.trim()) {
      alert('応募者名は必須です');
      return;
    }

    const newApplication: Application = {
      id: generateId(),
      jobId: job.id,
      applicantName: applicationForm.applicantName,
      applicantTrade: applicationForm.applicantTrade || undefined,
      applicantPref: applicationForm.applicantPref || undefined,
      applicantCity: applicationForm.applicantCity || undefined,
      phone: applicationForm.phone || undefined,
      lineId: applicationForm.lineId || undefined,
      selfReportedDriveMin: applicationForm.selfReportedDriveMin ? Number(applicationForm.selfReportedDriveMin) : undefined,
      status: 'APPLIED',
      note: applicationForm.note || undefined,
      createdAt: Date.now()
    };

    pushItem('applications', newApplication);
    
    // チャットにも追加
    pushItem('jobChats', {
      id: generateId(),
      jobId: job.id,
      role: 'worker',
      text: `${applicationForm.applicantName}さんが応募しました（手動追加）`,
      createdAt: Date.now()
    });

    setApplicationForm({
      applicantName: '',
      applicantTrade: '',
      applicantPref: '',
      applicantCity: '',
      phone: '',
      lineId: '',
      selfReportedDriveMin: '',
      note: ''
    });
    
    setShowAddApplication(false);
    loadData();
  };

  const getStatusBadge = (status: Job['status']) => {
    const styles = {
      OPEN: 'bg-green-100 text-green-800',
      PAUSED: 'bg-yellow-100 text-yellow-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      CLOSED: 'bg-gray-100 text-gray-800'
    };
    
    const labels = {
      OPEN: '募集中',
      PAUSED: '一時停止',
      IN_PROGRESS: '進行中',
      CLOSED: '完了'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getApplicationStatusBadge = (status: Application['status']) => {
    const styles = {
      APPLIED: 'bg-blue-100 text-blue-800',
      INTERVIEWING: 'bg-yellow-100 text-yellow-800',
      HIRED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    
    const labels = {
      APPLIED: '応募中',
      INTERVIEWING: '面接中',
      HIRED: '採用',
      REJECTED: '不採用'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const deadline = computeStartDeadline(job.startDate, job.startByDeadlineDays);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">{job.trade}</h2>
            {getStatusBadge(job.status)}
            {job.stopPublish && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                非公開
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* 基本情報 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-3">基本情報</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><span className="font-medium">場所：</span>{job.sitePref}・{job.siteCity}</div>
              <div><span className="font-medium">期間：</span>{formatDate(job.startDate)} 〜 {formatDate(job.endDate)}</div>
              <div><span className="font-medium">給与：</span>{job.salaryBand} {job.salaryNote && `（${job.salaryNote}）`}</div>
              <div><span className="font-medium">人数：</span>{job.headcountFilled}/{job.headcountNeeded}人</div>
              <div><span className="font-medium">着手期限：</span>{formatDate(deadline)}</div>
              <div><span className="font-medium">通知回数：</span>{job.notifyCount}回</div>
            </div>
            <div className="mt-3">
              <span className="font-medium">概要：</span>
              <p className="mt-1">{job.summary}</p>
            </div>
          </div>

          {/* アクションバー */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={handleNotify}
              disabled={job.status === 'CLOSED'}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              通知を送る
            </button>
            <button
              onClick={() => onEdit(job)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              編集
            </button>
            <button
              onClick={handleTogglePublish}
              disabled={job.status === 'CLOSED'}
              className={`px-4 py-2 rounded disabled:opacity-50 ${
                job.stopPublish 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {job.stopPublish ? '公開再開' : '公開停止'}
            </button>
            <button
              onClick={handleCloseJob}
              disabled={job.status === 'CLOSED'}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
            >
              クローズ
            </button>
          </div>

          {/* 応募実績 */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">応募実績</h3>
              <button
                onClick={() => setShowAddApplication(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                手動で応募を追加
              </button>
            </div>

            {showAddApplication && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <form onSubmit={handleAddApplication} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">応募者名 *</label>
                      <input
                        type="text"
                        value={applicationForm.applicantName}
                        onChange={(e) => setApplicationForm({...applicationForm, applicantName: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">職種</label>
                      <input
                        type="text"
                        value={applicationForm.applicantTrade}
                        onChange={(e) => setApplicationForm({...applicationForm, applicantTrade: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">都道府県</label>
                      <input
                        type="text"
                        value={applicationForm.applicantPref}
                        onChange={(e) => setApplicationForm({...applicationForm, applicantPref: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">市区</label>
                      <input
                        type="text"
                        value={applicationForm.applicantCity}
                        onChange={(e) => setApplicationForm({...applicationForm, applicantCity: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">電話番号</label>
                      <input
                        type="text"
                        value={applicationForm.phone}
                        onChange={(e) => setApplicationForm({...applicationForm, phone: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">LINE ID</label>
                      <input
                        type="text"
                        value={applicationForm.lineId}
                        onChange={(e) => setApplicationForm({...applicationForm, lineId: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">所要時間（分）</label>
                      <input
                        type="number"
                        value={applicationForm.selfReportedDriveMin}
                        onChange={(e) => setApplicationForm({...applicationForm, selfReportedDriveMin: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">メモ</label>
                      <input
                        type="text"
                        value={applicationForm.note}
                        onChange={(e) => setApplicationForm({...applicationForm, note: e.target.value})}
                        className="w-full px-3 py-2 border rounded text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      追加
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddApplication(false)}
                      className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                    >
                      キャンセル
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="space-y-3">
              {applications.map((app) => (
                <div key={app.id} className="bg-white border rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center text-sm">
                    <div>
                      <div className="font-medium">{app.applicantName}</div>
                      {app.applicantTrade && <div className="text-gray-500 text-xs">{app.applicantTrade}</div>}
                    </div>
                    <div>
                      {app.applicantPref && app.applicantCity ? `${app.applicantPref}・${app.applicantCity}` : 
                       app.applicantPref || app.applicantCity || '-'}
                    </div>
                    <div>
                      {app.selfReportedDriveMin ? `${app.selfReportedDriveMin}分` : '-'}
                    </div>
                    <div>
                      <div>{app.phone || '-'}</div>
                      {app.lineId && <div className="text-xs text-blue-600">#{app.lineId}</div>}
                    </div>
                    <div>
                      <select
                        value={app.status}
                        onChange={(e) => handleApplicationStatusChange(app.id, e.target.value as Application['status'])}
                        className="w-full px-2 py-1 border rounded text-xs"
                      >
                        <option value="APPLIED">応募中</option>
                        <option value="INTERVIEWING">面接中</option>
                        <option value="HIRED">採用</option>
                        <option value="REJECTED">不採用</option>
                      </select>
                    </div>
                    <div className="text-xs">
                      {app.note && <div className="text-gray-600">{app.note}</div>}
                      <div className="text-gray-400 mt-1">{new Date(app.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {applications.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  まだ応募者がいません
                </div>
              )}
            </div>
          </div>

          {/* チャット履歴 */}
          <div>
            <h3 className="text-lg font-semibold mb-4">チャット履歴</h3>
            <div className="bg-gray-50 rounded-lg p-4 h-64 overflow-y-auto mb-4">
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'contractor' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.role === 'system'
                          ? 'bg-yellow-100 text-yellow-800'
                          : message.role === 'contractor'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border'
                      }`}
                    >
                      <p>{message.text}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'contractor' ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="工務店メモを送信..."
                className="flex-1 px-3 py-2 border rounded text-sm"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
              >
                送信
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}