import React, { useState, useEffect } from 'react';
import './App.css'; // Reusing the main CSS for simplicity

const API_URL = 'http://localhost:8000';
const WORKFLOW_STATUSES = [
    'Referral', 'Triage', 'Assessment', 'Device Approval',
    'Procurement', 'Installation', 'Review', 'Maintenance'
];

function AssistiveTech() {
    const [devices, setDevices] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    // Form state
    const [clientId, setClientId] = useState('');
    const [deviceType, setDeviceType] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/assistive-devices`);
            if (!response.ok) throw new Error('Failed to fetch devices.');
            const data = await response.json();
            setDevices(data);
            setError(null);
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
            const response = await fetch(`${API_URL}/api/v1/assistive-devices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_id: parseInt(clientId), device_type: deviceType }),
            });
            if (!response.ok) throw new Error('Failed to create referral.');
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
            const response = await fetch(`${API_URL}/api/v1/assistive-devices/${deviceId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error('Failed to update status.');
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
                            <td>{device.client_id}</td>
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