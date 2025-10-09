import React, { useState, useEffect } from 'react';
import './App.css';
import AssistiveTech from './AssistiveTech';
import Dashboard from './Dashboard';

const API_URL = 'http://localhost:8000';

const AssessmentsViewer = () => {
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/assessments`);
      if (!response.ok) {
        throw new Error('Failed to fetch data from the server.');
      }
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
              {assessments.length > 0 ? (
                assessments.map(assessment => (
                  <tr key={assessment.assessment_id}>
                    <td>{assessment.assessment_id}</td>
                    <td>{assessment.client_id}</td>
                    <td>{assessment.assessor_id}</td>
                    <td>{new Date(assessment.date).toLocaleString()}</td>
                    <td>{assessment.location}</td>
                    <td>{JSON.parse(assessment.answers_json).notes}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6">No assessments found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
    </div>
  );
};


function App() {
  const [view, setView] = useState('dashboard'); // 'dashboard', 'assessments', or 'assistiveTech'

  return (
    <div className="App">
      <header className="App-header">
        <h1>Care Management Platform</h1>
        <nav>
            <button onClick={() => setView('dashboard')} disabled={view === 'dashboard'}>Dashboard</button>
            <button onClick={() => setView('assessments')} disabled={view === 'assessments'}>Assessments</button>
            <button onClick={() => setView('assistiveTech')} disabled={view === 'assistiveTech'}>Assistive Tech</button>
        </nav>
      </header>
      <main>
        {view === 'dashboard' && <Dashboard />}
        {view === 'assessments' && <AssessmentsViewer />}
        {view === 'assistiveTech' && <AssistiveTech />}
      </main>
    </div>
  );
}

export default App;