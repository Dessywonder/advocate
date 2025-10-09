import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000';

function ProvidersPage() {
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { authToken } = useAuth();

    // Form state for creating a new provider
    const [name, setName] = useState('');
    const [services, setServices] = useState('');

    const fetchProviders = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/providers`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch providers.');
            const data = await response.json();
            setProviders(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProviders();
    }, [authToken]);

    const handleCreateProvider = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/api/v1/providers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ name, services_offered: services }),
            });
            if (!response.ok) throw new Error('Failed to create provider.');

            // Refresh list and clear form
            fetchProviders();
            setName('');
            setServices('');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div>
            <h2>Provider Management</h2>
            <div className="form-container" style={{ maxWidth: '600px', marginBottom: '20px' }}>
                <h3>Add New Provider</h3>
                <form onSubmit={handleCreateProvider}>
                    <input
                        type="text"
                        placeholder="Provider Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Services Offered (e.g., 'Domiciliary Care')"
                        value={services}
                        onChange={(e) => setServices(e.target.value)}
                    />
                    <button type="submit">Add Provider</button>
                </form>
            </div>

            {loading && <p>Loading providers...</p>}
            {error && <p className="error">Error: {error}</p>}

            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Services Offered</th>
                    </tr>
                </thead>
                <tbody>
                    {providers.map(provider => (
                        <tr key={provider.provider_id}>
                            <td>{provider.provider_id}</td>
                            <td>{provider.name}</td>
                            <td>{provider.services_offered}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default ProvidersPage;