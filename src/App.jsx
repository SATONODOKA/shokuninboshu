import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JobList from './pages/JobList';
import JobCreate from './pages/JobCreate';
import CompletedJobs from './pages/CompletedJobs';
import CandidateList from './pages/CandidateList';
import MessageCompose from './pages/MessageCompose';
import LineSend from './pages/LineSend';
import EnvCheck from './pages/EnvCheck';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JobList />} />
        <Route path="/job/create" element={<JobCreate />} />
        <Route path="/jobs/completed" element={<CompletedJobs />} />
        <Route path="/recruit/targets" element={<CandidateList />} />
        <Route path="/recruit/compose" element={<MessageCompose />} />
        <Route path="/line/send" element={<LineSend />} />
        <Route path="/env-check" element={<EnvCheck />} />
      </Routes>
    </Router>
  );
}

export default App;