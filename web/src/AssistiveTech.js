import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from './api';
import './App.css'; // Reusing the main CSS for simplicity

const WORKFLOW_STATUSES = [
    'Referral', 'Triage', 'Assessment', 'Device Approval',
    'Procurement', 'Installation', 'Review', 'Maintenance'
];

function AssistiveTech() {
    const navigate = useNavigate();
    const [devices, setDevices] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [clientId, setClientId] = useState('');
    const [deviceType, setDeviceType] = useState('');

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await apiFetch('/api/v1/assistive-devices');
            setDevices(data);
        } catch (err) {
            setError(err.message);
            setDevices([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateReferral = async (e) => {
        e.preventDefault();
        if (!clientId || !deviceType) {
            setError('Client ID and Device Type are required.');
            return;
        }
        try {
            await apiFetch('/api/v1/assistive-devices', {
                method: 'POST',
                body: JSON.stringify({ client_id: parseInt(clientId), device_type: deviceType }),
            });
            // Refresh data and clear form
            fetchData();
            setClientId('');
            setDeviceType('');
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleUpdateStatus = async (deviceId, newStatus) => {
        try {
            await apiFetch(`/api/v1/assistive-devices/${deviceId}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus }),
            });
            fetchData(); // Refresh list
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Assistive Technology Referrals</h2>

            <div className="form-container">
                <h3>Create New Referral</h3>
                <form onSubmit={handleCreateReferral}>
                    <input
                        type="number"
                        placeholder="Client ID"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Device Type (e.g., 'Walker')"
                        value={deviceType}
                        onChange={(e) => setDeviceType(e.target.value)}
                        required
                    />
                    <button type="submit">Create Referral</button>
                </form>
            </div>

            {loading && <p>Loading devices...</p>}
            {error && <p className="error">Error: {error}</p>}

            <table>
                <thead>
                    <tr>
                        <th>Device ID</th>
                        <th>Client ID</th>
                        <th>Device Type</th>
                        <th>Status</th>
                        <th>Created On</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {devices.map(device => (
                        <tr key={device.device_id}>
                            <td>{device.device_id}</td>
                            <td className="clickable" onClick={() => navigate(`/client/${device.client_id}`)}>
                                {device.client_id}
                            </td>
                            <td>{device.device_type}</td>
                            <td>{device.status}</td>
                            <td>{new Date(device.created_at).toLocaleString()}</td>
                            <td>
                                <select
                                    value={device.status}
                                    onChange={(e) => handleUpdateStatus(device.device_id, e.target.value)}
                                >
                                    {WORKFLOW_STATUSES.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default AssistiveTech;