import { useState, useEffect } from 'react';
import type { Job } from '../types';
import { getArray } from '../lib/storage';
import SideNavigation from './SideNavigation';
import JobBoard from './JobBoard';
import CreateJobForm from './CreateJobForm';
import JobSections from './JobSections';
import JobDetailModal from './JobDetailModal';

export default function ContractorDashboard() {
  const [currentSection, setCurrentSection] = useState('board');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [showJobDetail, setShowJobDetail] = useState(false);

  // localStorage初期化
  useEffect(() => {
    const keys = ['jobs', 'applications', 'jobChats'];
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }, []);

  const handleSectionChange = (section: string) => {
    setCurrentSection(section);
    setEditingJob(null);
  };

  const handleCreateNew = () => {
    setCurrentSection('create');
    setEditingJob(null);
  };

  const handleJobDetail = (job: Job) => {
    setSelectedJob(job);
    setShowJobDetail(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setCurrentSection('create');
  };

  const handleFormSuccess = () => {
    setCurrentSection('board');
    setEditingJob(null);
  };

  const handleJobUpdate = () => {
    // Job詳細モーダル内での更新後、最新のjobデータを取得
    if (selectedJob) {
      const jobs = getArray('jobs');
      const updatedJob = jobs.find((j: Job) => j.id === selectedJob.id);
      if (updatedJob) {
        setSelectedJob(updatedJob);
      }
    }
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'board':
        return (
          <JobBoard
            onCreateNew={handleCreateNew}
            onJobDetail={handleJobDetail}
            onEditJob={handleEditJob}
          />
        );
      
      case 'create':
        return (
          <CreateJobForm
            onSuccess={handleFormSuccess}
            editJob={editingJob || undefined}
          />
        );
      
      case 'in-progress':
        return (
          <JobSections
            section="in-progress"
            onJobDetail={handleJobDetail}
          />
        );
      
      case 'completed':
        return (
          <JobSections
            section="completed"
            onJobDetail={handleJobDetail}
          />
        );
      
      default:
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold">セクションが見つかりません</h2>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNavigation
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
      />
      
      <div className="flex-1 overflow-auto">
        {renderContent()}
      </div>

      {showJobDetail && selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => {
            setShowJobDetail(false);
            setSelectedJob(null);
          }}
          onEdit={handleEditJob}
          onUpdate={handleJobUpdate}
        />
      )}
    </div>
  );
}