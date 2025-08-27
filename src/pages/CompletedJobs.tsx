import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { formatDate } from '../utils/helpers';

export default function CompletedJobs() {
  const navigate = useNavigate();
  const [completedJobs, setCompletedJobs] = useState<Job[]>([]);
  const [sortBy, setSortBy] = useState<'completedDate' | 'duration' | 'filled'>('completedDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Load completed jobs from localStorage
    const allJobs = JSON.parse(localStorage.getItem('jobs') || '[]');
    const completed = allJobs.filter((job: Job) => job.status === 'COMPLETED');
    setCompletedJobs(completed);
  }, []);

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const calculateFillRate = (job: Job) => {
    return job.need > 0 ? ((job.decided / job.need) * 100).toFixed(1) : '0.0';
  };

  const getSortedJobs = () => {
    return [...completedJobs].sort((a, b) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'duration':
          aValue = calculateDuration(a.startDate, a.endDate);
          bValue = calculateDuration(b.startDate, b.endDate);
          break;
        case 'filled':
          aValue = parseFloat(calculateFillRate(a));
          bValue = parseFloat(calculateFillRate(b));
          break;
        case 'completedDate':
        default:
          // For now, use endDate as completion date proxy
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  };

  const handleSort = (column: 'completedDate' | 'duration' | 'filled') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Analytics summary
  const analytics = {
    totalJobs: completedJobs.length,
    totalHired: completedJobs.reduce((sum, job) => sum + job.decided, 0),
    avgFillRate: completedJobs.length > 0 
      ? (completedJobs.reduce((sum, job) => sum + parseFloat(calculateFillRate(job)), 0) / completedJobs.length).toFixed(1)
      : '0.0',
    avgDuration: completedJobs.length > 0
      ? Math.round(completedJobs.reduce((sum, job) => sum + calculateDuration(job.startDate, job.endDate), 0) / completedJobs.length)
      : 0
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-6 mb-4">
                <h1 className="text-3xl font-bold text-gray-800">求人管理</h1>
                <nav className="flex gap-4">
                  <button 
                    onClick={() => navigate('/')}
                    className="text-gray-500 hover:text-gray-700 pb-1 font-medium"
                  >
                    募集中
                  </button>
                  <button className="text-teal-600 border-b-2 border-teal-600 pb-1 font-medium">
                    完了済み
                  </button>
                </nav>
              </div>
              <p className="text-gray-600">完了した案件の分析とパフォーマンス管理ができます。</p>
            </div>
          </div>
        </header>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{analytics.totalJobs}</div>
            <div className="text-sm text-gray-600">完了案件数</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-teal-600">{analytics.totalHired}</div>
            <div className="text-sm text-gray-600">総採用者数</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">{analytics.avgFillRate}%</div>
            <div className="text-sm text-gray-600">平均充足率</div>
          </div>
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <div className="text-2xl font-bold text-purple-600">{analytics.avgDuration}</div>
            <div className="text-sm text-gray-600">平均工期(日)</div>
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {completedJobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      案件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      業種・地域
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      期間
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('duration')}
                    >
                      工期 {getSortIcon('duration')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      給与帯
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('filled')}
                    >
                      充足率 {getSortIcon('filled')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      通知回数
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('completedDate')}
                    >
                      完了日 {getSortIcon('completedDate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSortedJobs().map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{job.title}</div>
                        {job.summary && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{job.summary}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{job.trade}</div>
                        <div className="text-xs text-gray-500">{job.pref} {job.city}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{formatDate(job.startDate)}</div>
                        <div className="text-xs text-gray-500">〜{formatDate(job.endDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {calculateDuration(job.startDate, job.endDate)}日
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.salaryBand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`font-medium ${
                            parseFloat(calculateFillRate(job)) >= 100 ? 'text-green-600' :
                            parseFloat(calculateFillRate(job)) >= 80 ? 'text-blue-600' :
                            parseFloat(calculateFillRate(job)) >= 60 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {calculateFillRate(job)}%
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            ({job.decided}/{job.need})
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {job.notifyCount || 0}回
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(job.endDate)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h5.586a1 1 0 00.707-.293l5.414-5.414A1 1 0 0016 14.586V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">完了済みの案件がありません</h3>
              <p className="text-gray-500">案件を完了すると、こちらに蓄積され分析できるようになります。</p>
            </div>
          )}
        </div>

        {/* Future Analytics Placeholder */}
        {completedJobs.length > 0 && (
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">分析機能（開発予定）</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-500">
              <div>
                <h4 className="font-medium mb-2">トレンド分析</h4>
                <ul className="text-sm space-y-1">
                  <li>• 月別・季節別の採用成功率</li>
                  <li>• 業種別パフォーマンス比較</li>
                  <li>• 地域別需要動向</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">予測・提案</h4>
                <ul className="text-sm space-y-1">
                  <li>• 最適な給与設定の提案</li>
                  <li>• 募集期間の推奨値</li>
                  <li>• 成功率向上のための示唆</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}