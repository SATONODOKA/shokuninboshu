import { UserIcon, CalendarIcon, MapPinIcon, CurrencyYenIcon, PencilIcon, TrashIcon, EyeSlashIcon, EyeIcon, BellIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Job } from '../types';
import { StatusPill } from './StatusPill';
import { fmtDate, fromNow } from '../utils/dates';
import { updateJob, deleteJob, createApplication, createMessage, getThreads } from '../lib/data';
import { bus } from '../lib/bus';
import { buildJobFlex } from '../lib/lineFlex';

interface JobCardProps {
  job: Job;
  onEdit?: (job: Job) => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (job: Job) => void;
}

export function JobCard({ job, onEdit, onDeleted, onUpdated }: JobCardProps) {
  
  const handleToggleStatus = () => {
    const newStatus = job.status === 'OPEN' ? 'PAUSED' : 'OPEN';
    const updated = updateJob(job.id, { status: newStatus });
    if (updated && onUpdated) {
      onUpdated(updated);
    }
  };

  const handleDelete = () => {
    if (window.confirm('本当に削除しますか？')) {
      deleteJob(job.id);
      if (onDeleted) {
        onDeleted(job.id);
      }
    }
  };

  const handleNotify = async () => {
    // ユーザーIDをプロンプトで入力してもらう（実際の運用では対象者リストから選択）
    const userId = prompt('送信先のLINE User IDを入力してください:', localStorage.getItem('lineUserId') || '');
    
    if (!userId) {
      return;
    }

    try {
      // buildJobFlexを使ってFlexメッセージを作成
      const flexMessage = buildJobFlex({
        trade: job.trade,
        sitePref: job.sitePref,
        siteCity: job.siteCity,
        startDate: fmtDate(job.startDate),
        endDate: fmtDate(job.endDate),
        salaryBand: job.salaryBand,
        summary: job.summary,
        tel: job.tel
      });

      // Push APIに送信
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/push`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: userId.trim(),
          messages: [flexMessage]
        })
      });

      if (response.ok) {
        // 成功時の処理: job.notifyCount++
        const updated = updateJob(job.id, { notifyCount: job.notifyCount + 1 });
        if (updated && onUpdated) {
          onUpdated(updated);
        }
        
        // DMタブにsystemログ「募集通知を送信（n回目）」を追加
        const threads = getThreads();
        const jobThreads = threads.filter(thread => thread.jobId === job.id);
        jobThreads.forEach(thread => {
          createMessage({
            threadId: thread.id,
            jobId: job.id,
            role: 'system',
            text: `募集通知を送信（${job.notifyCount + 1}回目）`
          });
        });

        // 既存のbus.emit（モニター用）
        bus.emit('JOB_PUBLISHED', {
          id: job.id,
          title: job.summary,
          trade: job.trade,
          location: `${job.sitePref}${job.siteCity}`,
          salary: job.salaryBand + (job.salaryNote ? ` (${job.salaryNote})` : ''),
          period: `${fmtDate(job.startDate)} 〜 ${fmtDate(job.endDate)}`
        });
        
        alert(`「${job.summary}」の求人情報をLINEに送信しました！`);
      } else {
        const errorText = await response.text();
        alert(`送信に失敗しました: ${errorText}`);
      }
    } catch (error: any) {
      alert(`エラーが発生しました: ${error.message}`);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(job);
    }
  };

  const handleTestApplication = () => {
    const testNames = ['田中太郎', '佐藤花子', '鈴木一郎', '山田美香', '高橋健太'];
    const randomName = testNames[Math.floor(Math.random() * testNames.length)];
    
    createApplication({
      jobId: job.id,
      applicantName: randomName,
      phone: '090-1234-5678',
      lineId: `line_${randomName.slice(0, 2)}`,
      note: 'テスト応募です',
      status: 'APPLIED'
    });
    
    alert(`${randomName}さんからの応募を作成しました`);
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
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-brand">{job.trade}</span>
              <StatusPill status={statusProps.status}>
                {statusProps.text}
              </StatusPill>
            </div>
            <h3 className="font-semibold text-gray-900 text-lg mb-2">{job.summary}</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPinIcon className="h-4 w-4 text-gray-400" />
              <span>{job.sitePref} {job.siteCity}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>{fmtDate(job.startDate)} - {fmtDate(job.endDate)}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserIcon className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{job.headcountFilled}/{job.headcountNeeded}名</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <CurrencyYenIcon className="h-4 w-4 text-gray-400" />
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

        <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
          <button
            onClick={handleEdit}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="編集"
          >
            <PencilIcon className="h-4 w-4" />
            <span>編集</span>
          </button>
          <button
            onClick={handleToggleStatus}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title={job.status === 'OPEN' ? '非公開にする' : '公開する'}
          >
            {job.status === 'OPEN' ? (
              <EyeSlashIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
            <span>{job.status === 'OPEN' ? '非公開にする' : '公開する'}</span>
          </button>
          <button
            onClick={handleNotify}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            title="通知を送る"
          >
            <BellIcon className="h-4 w-4" />
            <span>通知</span>
          </button>
          <button
            onClick={handleTestApplication}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
            title="テスト応募を作成"
          >
            <UserPlusIcon className="h-4 w-4" />
            <span>応募テスト</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 hover:bg-red-200 text-red-600 rounded transition-colors ml-auto"
            title="削除"
          >
            <TrashIcon className="h-4 w-4" />
            <span>削除</span>
          </button>
        </div>
      </div>
    </div>
  );
}