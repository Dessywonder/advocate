import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import AssistiveTech from './AssistiveTech';
import Dashboard from './Dashboard';
import ClientPage from './ClientPage';

const API_URL = 'http://localhost:8000';

const AssessmentsViewer = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/assessments`);
      if (!response.ok) throw new Error('Failed to fetch data from the server.');
      const data = await response.json();
      setAssessments(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  return (
    <div>
        <h2>Synced Assessments</h2>
        <button onClick={fetchAssessments} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        {loading && <p>Loading assessments...</p>}
        {error && <p className="error">Error: {error}</p>}
        {!loading && !error && (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Client ID</th>
                <th>Assessor ID</th>
                <th>Date</th>
                <th>Location</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(assessment => (
                <tr key={assessment.assessment_id}>
                  <td>{assessment.assessment_id}</td>
                  <td className="clickable" onClick={() => navigate(`/client/${assessment.client_id}`)}>
                    {assessment.client_id}
                  </td>
                  <td>{assessment.assessor_id}</td>
                  <td>{new Date(assessment.date).toLocaleString()}</td>
                  <td>{assessment.location}</td>
                  <td>{JSON.parse(assessment.answers_json).notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </div>
  );
};


function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Care Management Platform</h1>
        <nav>
            <Link to="/"><button>Dashboard</button></Link>
            <Link to="/assessments"><button>Assessments</button></Link>
            <Link to="/assistive-tech"><button>Assistive Tech</button></Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/assessments" element={<AssessmentsViewer />} />
          <Route path="/assistive-tech" element={<AssistiveTech />} />
          <Route path="/client/:clientId" element={<ClientPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;