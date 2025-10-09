import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './App.css';
import CarePlan from './CarePlan';
import AuditLogViewer from './AuditLogViewer'; // Import the new component

const API_URL = 'http://localhost:8000';

const ClientPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { authToken, user } = useAuth();

    const [assessments, setAssessments] = useState([]);
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleAudit, setVisibleAudit] = useState(null); // To control which audit log is visible

    useEffect(() => {
        const fetchDataForClient = async () => {
            setLoading(true);
            setError(null);
            try {
                const headers = { 'Authorization': `Bearer ${authToken}` };

                const [assessmentsRes, devicesRes] = await Promise.all([
                    fetch(`${API_URL}/api/v1/clients/${clientId}/assessments`, { headers }),
                    fetch(`${API_URL}/api/v1/clients/${clientId}/devices`, { headers })
                ]);

                if (!assessmentsRes.ok || !devicesRes.ok) {
                    throw new Error('Failed to fetch client data. You may not have the required permissions.');
                }

                const assessmentsData = await assessmentsRes.json();
                const devicesData = await devicesRes.json();

                setAssessments(assessmentsData);
                setDevices(devicesData);

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDataForClient();
    }, [clientId, authToken]);

    const toggleAuditViewer = (type, id) => {
        if (visibleAudit && visibleAudit.type === type && visibleAudit.id === id) {
            setVisibleAudit(null); // Hide if it's already visible
        } else {
            setVisibleAudit({ type, id });
        }
    };

    const canViewAudit = user && (user.role === 'manager' || user.role === 'admin');

    return (
        <div>
            <button onClick={() => navigate(-1)}>&larr; Back</button>
            <h2 style={{ marginTop: '20px' }}>Client Details: ID {clientId}</h2>

            {loading && <p>Loading client details...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <div className="client-page-container">
                    <div className="client-section">
                        <h3>Assessments</h3>
                        {assessments.length > 0 ? (
                            <ul>
                                {assessments.map(a => <li key={a.assessment_id}>Assessment on {new Date(a.date).toLocaleDateString()}</li>)}
                            </ul>
                        ) : <p>No assessments found for this client.</p>}
                    </div>
                    <div className="client-section">
                        <h3>Assistive Devices</h3>
                        {devices.length > 0 ? (
                            <ul>
                                {devices.map(d => (
                                    <li key={d.device_id}>
                                        {d.device_type} (Status: {d.status})
                                        {canViewAudit && (
                                            <button className="history-button" onClick={() => toggleAuditViewer('assistive_device', d.device_id)}>
                                                {visibleAudit?.type === 'assistive_device' && visibleAudit?.id === d.device_id ? 'Hide' : 'Show'} History
                                            </button>
                                        )}
                                        {visibleAudit?.type === 'assistive_device' && visibleAudit?.id === d.device_id && (
                                            <AuditLogViewer objectType="assistive_device" objectId={d.device_id} />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No assistive devices found for this client.</p>}
                    </div>
                    <div className="client-section" id="care-plan-section">
                        <CarePlan clientId={clientId} onShowAudit={canViewAudit ? toggleAuditViewer : null} visibleAudit={visibleAudit} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPage;