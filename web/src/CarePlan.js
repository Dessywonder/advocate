import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:8000';

function CarePlan({ clientId }) {
    const [carePlans, setCarePlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for the "Create New" form
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [status, setStatus] = useState('Draft');
    const [actions, setActions] = useState([{ goal_description: '' }]);

    const fetchCarePlans = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/clients/${clientId}/careplans`);
            if (!response.ok) throw new Error('Failed to fetch care plans.');
            const data = await response.json();
            setCarePlans(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            setCarePlans([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCarePlans();
    }, [clientId]);

    const handleActionChange = (index, event) => {
        const newActions = [...actions];
        newActions[index].goal_description = event.target.value;
        setActions(newActions);
    };

    const handleAddAction = () => {
        setActions([...actions, { goal_description: '' }]);
    };

    const handleRemoveAction = (index) => {
        const newActions = actions.filter((_, i) => i !== index);
        setActions(newActions);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const newCarePlan = {
            start_date: startDate,
            status: status,
            actions: actions.filter(a => a.goal_description.trim() !== ''), // Filter out empty actions
        };

        try {
            const response = await fetch(`${API_URL}/api/v1/clients/${clientId}/careplans`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCarePlan),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to create care plan.');
            }
            // Reset form and refresh data
            setStartDate(new Date().toISOString().split('T')[0]);
            setActions([{ goal_description: '' }]);
            fetchCarePlans();
        } catch (err) {
            setError(err.message);
        }
    };

    if (loading) return <p>Loading care plans...</p>;
    if (error) return <p className="error">Error: {error}</p>;

    return (
        <div>
            <h4>Existing Care Plans</h4>
            {carePlans.length === 0 ? (
                <p>No care plans found for this client.</p>
            ) : (
                <div className="care-plan-list">
                    {carePlans.map(plan => (
                        <div key={plan.care_plan_id} className="care-plan-item">
                            <p><strong>Plan ID:</strong> {plan.care_plan_id} | <strong>Status:</strong> {plan.status} | <strong>Start Date:</strong> {plan.start_date}</p>
                            <ul>
                                {plan.actions.map(action => (
                                    <li key={action.action_id}>{action.goal_description}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            <hr style={{ margin: '20px 0' }} />

            <h4>Create New Care Plan</h4>
            <form onSubmit={handleSubmit} className="care-plan-form">
                <label>Start Date:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />

                <label>Status:</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="Draft">Draft</option>
                    <option value="Active">Active</option>
                </select>

                <label>Goals/Actions:</label>
                {actions.map((action, index) => (
                    <div key={index} className="action-input">
                        <input
                            type="text"
                            placeholder="Describe a goal or action"
                            value={action.goal_description}
                            onChange={(e) => handleActionChange(index, e)}
                        />
                        <button type="button" onClick={() => handleRemoveAction(index)} disabled={actions.length <= 1}>Remove</button>
                    </div>
                ))}
                <button type="button" onClick={handleAddAction}>Add Action</button>
                <button type="submit" style={{ marginLeft: '10px' }}>Save Care Plan</button>
            </form>
        </div>
    );
}

export default CarePlan;