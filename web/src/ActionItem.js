import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const API_URL = 'http://localhost:8000';

function ActionItem({ action }) {
    const { user, authToken } = useAuth();
    const [outcomes, setOutcomes] = useState([]);
    const [showOutcomeForm, setShowOutcomeForm] = useState(false);
    const [outcomeDescription, setOutcomeDescription] = useState('');
    const [error, setError] = useState(null);

    const fetchOutcomes = async () => {
        try {
            const response = await fetch(`${API_URL}/api/v1/actions/${action.action_id}/outcomes`, {
                headers: { 'Authorization': `Bearer ${authToken}` },
            });
            if (!response.ok) throw new Error('Failed to fetch outcomes.');
            const data = await response.json();
            setOutcomes(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchOutcomes();
    }, [action.action_id, authToken]);

    const handleRecordOutcome = async (e) => {
        e.preventDefault();
        try {
            await fetch(`${API_URL}/api/v1/actions/${action.action_id}/outcomes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ outcome_description: outcomeDescription }),
            });
            fetchOutcomes(); // Refresh outcomes list
            setOutcomeDescription('');
            setShowOutcomeForm(false);
        } catch (err) {
            setError(err.message);
        }
    };

    const canRecordOutcome = user && (user.role === 'assessor' || user.role === 'manager');

    return (
        <li className="action-item">
            <span>{action.goal_description}</span>
            <div className="outcomes-section">
                {outcomes.length > 0 && (
                    <ul className="outcomes-list">
                        {outcomes.map(o => (
                            <li key={o.outcome_id}>
                                <strong>Outcome:</strong> {o.outcome_description} (Recorded at: {new Date(o.recorded_at).toLocaleDateString()})
                            </li>
                        ))}
                    </ul>
                )}
                {canRecordOutcome && (
                    <button className="record-outcome-btn" onClick={() => setShowOutcomeForm(!showOutcomeForm)}>
                        {showOutcomeForm ? 'Cancel' : 'Record Outcome'}
                    </button>
                )}
                {showOutcomeForm && (
                    <form onSubmit={handleRecordOutcome} className="outcome-form">
                        <textarea
                            value={outcomeDescription}
                            onChange={(e) => setOutcomeDescription(e.target.value)}
                            placeholder="Describe the outcome..."
                            required
                        />
                        <button type="submit">Save Outcome</button>
                    </form>
                )}
                {error && <p className="error" style={{ fontSize: '12px' }}>{error}</p>}
            </div>
        </li>
    );
}

export default ActionItem;