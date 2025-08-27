import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobList from './pages/JobList';
import JobCreate from './pages/JobCreate';
import CompletedJobs from './pages/CompletedJobs';
import CandidateList from './pages/CandidateList';
import MessageCompose from './pages/MessageCompose';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/job/create" element={<JobCreate />} />
        <Route path="/jobs/completed" element={<CompletedJobs />} />
        <Route path="/recruit/targets" element={<CandidateList />} />
        <Route path="/recruit/compose" element={<MessageCompose />} />
      </Routes>
    </Router>
  );
}

export default App;