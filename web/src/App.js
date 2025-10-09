import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useParams, Outlet } from 'react-router-dom';
import './App.css';
import { useAuth } from './AuthContext';
import AssistiveTech from './AssistiveTech';
import Dashboard from './Dashboard';
import ClientPage from './ClientPage';
import LoginPage from './LoginPage';
import ProtectedRoute from './ProtectedRoute';
import RoleProtectedRoute from './RoleProtectedRoute'; // Import the new component

const API_URL = 'http://localhost:8000';

// This component remains largely the same
const AssessmentsViewer = () => {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAssessments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/assessments`, {
          // In a real app, the token would be attached here
      });
      if (!response.ok) throw new Error('Failed to fetch data. You may not have the required permissions.');
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
        {/* ... rest of the component is the same ... */}
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

// A layout component to show the header for protected routes
const AppLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="App">
            <header className="App-header">
                <h1>Care Management Platform</h1>
                <nav>
                    {/* Manager/Admin can see Dashboard */}
                    {(user.role === 'manager' || user.role === 'admin') &&
                        <Link to="/"><button>Dashboard</button></Link>
                    }
                    {/* Assessor/Manager/Admin can see Assessments */}
                    {(user.role === 'assessor' || user.role === 'manager' || user.role === 'admin') &&
                        <Link to="/assessments"><button>Assessments</button></Link>
                    }
                    {/* Coordinator/Manager/Admin can see Assistive Tech */}
                    {(user.role === 'coordinator' || user.role === 'manager' || user.role === 'admin') &&
                        <Link to="/assistive-tech"><button>Assistive Tech</button></Link>
                    }
                </nav>
                <div className="user-info">
                    {user && <span>Welcome, {user.role}!</span>}
                    <button onClick={handleLogout}>Logout</button>
                </div>
            </header>
            <main>
                <Outlet /> {/* Child routes will render here */}
            </main>
        </div>
    );
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* These are the nested, protected routes with role-based access */}
        <Route index element={
            <RoleProtectedRoute requiredRoles={['manager', 'admin']}>
                <Dashboard />
            </RoleProtectedRoute>
        } />
        <Route path="assessments" element={
            <RoleProtectedRoute requiredRoles={['assessor', 'manager', 'admin']}>
                <AssessmentsViewer />
            </RoleProtectedRoute>
        } />
        <Route path="assistive-tech" element={
            <RoleProtectedRoute requiredRoles={['coordinator', 'manager', 'admin']}>
                <AssistiveTech />
            </RoleProtectedRoute>
        } />
        <Route path="client/:clientId" element={<ClientPage />} />
      </Route>
    </Routes>
  );
}

export default App;