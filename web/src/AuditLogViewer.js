import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000';

function AuditLogViewer({ objectType, objectId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authToken } = useAuth();

    useEffect(() => {
        const fetchAuditLogs = async () => {
            if (!objectType || !objectId) return;

            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/api/v1/audit/${objectType}/${objectId}`, {
                    headers: { 'Authorization': `Bearer ${authToken}` },
                });

                if (!response.ok) {
                    throw new Error('Could not fetch audit logs. You may not have permission.');
                }

                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAuditLogs();
    }, [objectType, objectId, authToken]);

    if (loading) return <p>Loading audit trail...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="audit-log-container">
            <h4>Audit Trail</h4>
            {logs.length === 0 ? (
                <p>No history found for this record.</p>
            ) : (
                <table className="audit-table">
                    <thead>
                        <tr>
                            <th>Timestamp</th>
                            <th>User ID</th>
                            <th>Action</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map(log => (
                            <tr key={log.event_id}>
                                <td>{new Date(log.event_timestamp).toLocaleString()}</td>
                                <td>{log.user_id}</td>
                                <td>{log.action}</td>
                                <td><pre>{JSON.stringify(log.details, null, 2)}</pre></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default AuditLogViewer;