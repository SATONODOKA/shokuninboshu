import { useState } from 'react';
import { EllipsisVerticalIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { Job } from '../types';
import { StatusPill } from './StatusPill';
import { IconButton } from './IconButton';
import { fmtDate, fromNow } from '../utils/dates';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [showMenu, setShowMenu] = useState(false);

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
    <div className="bg-white border border-ui-line rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-brand">{job.trade}</span>
            <StatusPill status={statusProps.status}>
              {statusProps.text}
            </StatusPill>
          </div>
          <h3 className="font-medium text-ink-900 mb-1">{job.summary}</h3>
          <p className="text-sm text-ink-600">{job.sitePref} {job.siteCity}</p>
        </div>
        <div className="relative">
          <IconButton onClick={() => setShowMenu(!showMenu)}>
            <EllipsisVerticalIcon className="h-5 w-5" />
          </IconButton>
          {showMenu && (
            <div className="absolute right-0 top-8 bg-white border border-ui-line rounded-lg shadow-lg py-1 z-10 w-32">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">編集</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">複製</button>
              <button className="w-full text-left px-3 py-2 text-sm text-state-err hover:bg-gray-50">削除</button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-ink-600 mb-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{fmtDate(job.startDate)} - {fmtDate(job.endDate)}</span>
          </div>
          <div className="flex items-center gap-1">
            <UserIcon className="h-4 w-4" />
            <span>{job.headcountFilled}/{job.headcountNeeded}名</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-lg font-bold text-ink-900">{job.salaryBand}</span>
          {job.salaryNote && (
            <span className="text-sm text-ink-600 ml-2">{job.salaryNote}</span>
          )}
        </div>
        <div className="text-right text-xs text-ink-500">
          <div>通知: {job.notifyCount}回</div>
          <div>更新: {fromNow(job.lastUpdatedAt)}</div>
        </div>
      </div>
    </div>
  );
}