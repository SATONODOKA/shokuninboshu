import { useState } from 'react';
import { EllipsisVerticalIcon, UserIcon, CalendarIcon, MapPinIcon, CurrencyYenIcon } from '@heroicons/react/24/outline';
import { Job } from '../types';
import { StatusPill } from './StatusPill';
import { IconButton } from './IconButton';
import { fmtDate, fromNow } from '../utils/dates';
import { updateJob, deleteJob } from '../lib/data';
import { generateId } from '../lib/ids';

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (job: Job) => void;
}

export function JobCard({ job, onEdit, onDeleted, onUpdated }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  const handleToggleStatus = () => {
    const newStatus = job.status === 'OPEN' ? 'PAUSED' : 'OPEN';
    const updated = updateJob(job.id, { status: newStatus });
    if (updated && onUpdated) {
      onUpdated(updated);
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？')) {
      deleteJob(job.id);
      if (onDeleted) {
        onDeleted(job.id);
      }
    }
    setShowMenu(false);
  };

  const handleNotify = () => {
    const updated = updateJob(job.id, { notifyCount: job.notifyCount + 1 });
    if (updated && onUpdated) {
      onUpdated(updated);
    }
    alert(`「${job.summary}」の求人情報を配信しました`);
    setShowMenu(false);
  };

  const getStatusPillProps = (status: Job['status']) => {
    switch (status) {
      case 'OPEN':
        return { status: 'ok' as const, text: '募集中' };
      case 'PAUSED':
        return { status: 'warn' as const, text: '一時停止' };
      case 'CLOSED':
        return { status: 'err' as const, text: '終了' };
    }
  };

  const statusProps = getStatusPillProps(job.status);

  return (
    <div className="bg-white border border-brand-pale rounded-lg shadow-sm hover:shadow-md transition-all hover:border-brand">
      <div className="bg-brand-pale p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-brand">{job.trade}</span>
              <StatusPill status={statusProps.status}>
                {statusProps.text}
              </StatusPill>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">{job.summary}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 text-brand" />
              <span>{job.sitePref} {job.siteCity}</span>
            </div>
          </div>
          <div className="relative">
            <IconButton onClick={() => setShowMenu(!showMenu)}>
              <EllipsisVerticalIcon className="h-5 w-5 text-gray-600" />
            </IconButton>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 w-40">
                <button 
                  onClick={() => {
                    if (onEdit) onEdit(job);
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-brand-pale"
                >
                  編集
                </button>
                <button 
                  onClick={() => {
                    const newJob = { ...job, id: generateId() };
                    // TODO: Implement duplicate
                    alert('複製機能は実装中です');
                    setShowMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-brand-pale"
                >
                  複製
                </button>
                <button 
                  onClick={handleToggleStatus}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-brand-pale"
                >
                  {job.status === 'OPEN' ? '非公開にする' : '公開する'}
                </button>
                <button 
                  onClick={handleNotify}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-brand-pale"
                >
                  通知を送る
                </button>
                <hr className="my-1" />
                <button 
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  削除
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4 text-brand" />
            <span>{fmtDate(job.startDate)} - {fmtDate(job.endDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserIcon className="h-4 w-4 text-brand" />
            <span className="font-medium">{job.headcountFilled}/{job.headcountNeeded}名</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <CurrencyYenIcon className="h-4 w-4 text-brand" />
            <span className="text-lg font-bold text-gray-900">{job.salaryBand}</span>
            {job.salaryNote && (
              <span className="text-sm text-gray-600 ml-2">{job.salaryNote}</span>
            )}
          </div>
          <div className="text-right text-xs text-gray-500">
            <div>通知: {job.notifyCount}回</div>
            <div>更新: {fromNow(job.lastUpdatedAt)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}