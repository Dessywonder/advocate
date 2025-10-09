import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { apiFetch } from './api';
import './App.css';
import CarePlan from './CarePlan';
import AuditLogViewer from './AuditLogViewer';

const ClientPage = () => {
    const { clientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [assessments, setAssessments] = useState([]);
    const [devices, setDevices] = useState([]);
    const [gpSummary, setGpSummary] = useState(null); // State for GP Connect data
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleAudit, setVisibleAudit] = useState(null);

    useEffect(() => {
        const fetchDataForClient = async () => {
            setLoading(true);
            setError(null);
            try {
                const [assessmentsData, devicesData] = await Promise.all([
                    apiFetch(`/api/v1/clients/${clientId}/assessments`),
                    apiFetch(`/api/v1/clients/${clientId}/devices`)
                ]);
                setAssessments(assessmentsData);
                setDevices(devicesData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDataForClient();
    }, [clientId]);

    const [nhsNumberInput, setNhsNumberInput] = useState('');

    const handleFetchGpSummary = async (e) => {
        e.preventDefault();
        if (!nhsNumberInput) return;
        try {
            const data = await apiFetch('/api/v1/gp-connect/fetch-summary', {
                method: 'POST',
                body: JSON.stringify({ nhs_number: nhsNumberInput }),
            });
            setGpSummary(data);
        } catch (err) {
            setError(err.message);
        }
    };

    const toggleAuditViewer = (type, id) => {
        setVisibleAudit(visibleAudit && visibleAudit.type === type && visibleAudit.id === id ? null : { type, id });
    };

    const canViewAudit = user && (user.role === 'manager' || user.role === 'admin');
    const canFetchGpSummary = user && (user.role === 'manager' || user.role === 'admin');

    return (
        <div>
            <button onClick={() => navigate(-1)}>&larr; Back</button>
            <h2 style={{ marginTop: '20px' }}>Client Details: ID {clientId}</h2>

            {loading && <p>Loading client details...</p>}
            {error && <p className="error">{error}</p>}

            {!loading && !error && (
                <div className="client-page-container">
                    <div className="client-section">
                        <h3>GP Connect Summary</h3>
                        {canFetchGpSummary && (
                            <form onSubmit={handleFetchGpSummary} className="gp-connect-form">
                                <input
                                    type="text"
                                    value={nhsNumberInput}
                                    onChange={(e) => setNhsNumberInput(e.target.value)}
                                    placeholder="Enter NHS Number"
                                    required
                                />
                                <button type="submit">Fetch GP Summary</button>
                            </form>
                        )}
                        {gpSummary && (
                            <div className="gp-summary-details">
                                <p><strong>Name:</strong> {gpSummary.name[0].text || `${gpSummary.name[0].given.join(' ')} ${gpSummary.name[0].family}`}</p>
                                <p><strong>DoB:</strong> {gpSummary.birthDate}</p>
                                <p><strong>Address:</strong> {gpSummary.address[0].text || `${gpSummary.address[0].line[0]}, ${gpSummary.address[0].city}, ${gpSummary.address[0].postalCode}`}</p>
                            </div>
                        )}
                    </div>
                    {/* ... other sections ... */}
                    <div className="client-section">
                        <h3>Assessments</h3>
                        {assessments.length > 0 ? (
                            <ul>{assessments.map(a => <li key={a.assessment_id}>Assessment on {new Date(a.date).toLocaleDateString()}</li>)}</ul>
                        ) : <p>No assessments found.</p>}
                    </div>
                    <div className="client-section">
                        <h3>Assistive Devices</h3>
                        {devices.length > 0 ? (
                            <ul>
                                {devices.map(d => (
                                    <li key={d.device_id}>
                                        {d.device_type} (Status: {d.status})
                                        {canViewAudit && <button className="history-button" onClick={() => toggleAuditViewer('assistive_device', d.device_id)}>History</button>}
                                        {visibleAudit?.type === 'assistive_device' && visibleAudit?.id === d.device_id && <AuditLogViewer objectType="assistive_device" objectId={d.device_id} />}
                                    </li>
                                ))}
                            </ul>
                        ) : <p>No assistive devices found.</p>}
                    </div>
                    <div className="client-section">
                        <CarePlan clientId={clientId} onShowAudit={canViewAudit ? toggleAuditViewer : null} visibleAudit={visibleAudit} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientPage;