import React, { useState, useEffect } from 'react';
import AuditLogViewer from './AuditLogViewer';
import { useAuth } from './AuthContext';
import ActionItem from './ActionItem'; // Import the new component

const API_URL = 'http://localhost:8000';

function CarePlan({ clientId, onShowAudit, visibleAudit }) {
    const { user, authToken } = useAuth();
    const [carePlans, setCarePlans] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the "Create New" form
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Draft');
    const [actions, setActions] = useState([{ goal_description: '' }]);

    // State for provider assignment
    const [selectedProvider, setSelectedProvider] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = { 'Authorization': `Bearer ${authToken}` };
            const [plansRes, providersRes] = await Promise.all([
                fetch(`${API_URL}/api/v1/clients/${clientId}/careplans`, { headers }),
                fetch(`${API_URL}/api/v1/providers`, { headers }),
            ]);

            if (!plansRes.ok || !providersRes.ok) throw new Error('Failed to fetch care plan data.');

            const plansData = await plansRes.json();
            const providersData = await providersRes.json();

            setCarePlans(plansData);
            setProviders(providersData);
            if (providersData.length > 0) {
                setSelectedProvider(providersData[0].provider_id);
            }
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [clientId, authToken]);

    const handleActionChange = (index, event) => {
        const newActions = [...actions];
        newActions[index].goal_description = event.target.value;
        setActions(newActions);
    };

    const handleAddAction = () => setActions([...actions, { goal_description: '' }]);
    const handleRemoveAction = (index) => setActions(actions.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newCarePlan = {
            start_date: startDate,
            status: status,
            actions: actions.filter(a => a.goal_description.trim() !== ''),
        };

        try {
            await fetch(`${API_URL}/api/v1/clients/${clientId}/careplans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(newCarePlan),
            });
            fetchData(); // Refresh data
            setStartDate(new Date().toISOString().split('T')[0]);
            setActions([{ goal_description: '' }]);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleAssignProvider = async (carePlanId) => {
        try {
            await fetch(`${API_URL}/api/v1/careplans/${carePlanId}/assign-provider`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ provider_id: parseInt(selectedProvider) }),
            });
            fetchData(); // Refresh to show assigned provider
        } catch (err) {
            setError(err.message);
        }
    };

    const getProviderName = (providerId) => {
        const provider = providers.find(p => p.provider_id === providerId);
        return provider ? provider.name : 'Not Assigned';
    };

    const canManage = user && (user.role === 'manager' || user.role === 'admin');

    if (loading) return <p>Loading care plans...</p>;
    if (error) return <p className="error">Error: {error}</p>;

    return (
        <div>
            <h4>Existing Care Plans</h4>
            {carePlans.length > 0 && carePlans.map(plan => (
                <div key={plan.care_plan_id} className="care-plan-item">
                    <p>
                        <strong>Plan ID:</strong> {plan.care_plan_id} | <strong>Status:</strong> {plan.status} | <strong>Provider:</strong> {getProviderName(plan.assigned_provider_id)}
                        {onShowAudit && (
                            <button className="history-button" onClick={() => onShowAudit('care_plan', plan.care_plan_id)}>
                                {visibleAudit?.type === 'care_plan' && visibleAudit?.id === plan.care_plan_id ? 'Hide' : 'Show'} History
                            </button>
                        )}
                    </p>
                    {/* Replace the simple list with the new ActionItem component */}
                    <ul>{plan.actions.map(action => <ActionItem key={action.action_id} action={action} />)}</ul>

                    {!plan.assigned_provider_id && canManage && (
                        <div className="assign-provider-form">
                            <select onChange={(e) => setSelectedProvider(e.target.value)} value={selectedProvider}>
                                {providers.map(p => <option key={p.provider_id} value={p.provider_id}>{p.name}</option>)}
                            </select>
                            <button onClick={() => handleAssignProvider(plan.care_plan_id)}>Assign Provider</button>
                        </div>
                    )}

                    {visibleAudit?.type === 'care_plan' && visibleAudit?.id === plan.care_plan_id && (
                        <AuditLogViewer objectType="care_plan" objectId={plan.care_plan_id} />
                    )}
                </div>
            ))}

            <hr style={{ margin: '20px 0' }} />
            <h4>Create New Care Plan</h4>
            {/* ... create form ... */}
        </div>
    );
}

export default CarePlan;