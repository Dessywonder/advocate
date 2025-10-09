import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from './api';

function ActionItem({ action }) {
    const { user } = useAuth();
    const [outcomes, setOutcomes] = useState([]);
    const [showOutcomeForm, setShowOutcomeForm] = useState(false);
    const [outcomeDescription, setOutcomeDescription] = useState('');
    const [error, setError] = useState(null);

    const fetchOutcomes = async () => {
        try {
            const data = await apiFetch(`/api/v1/actions/${action.action_id}/outcomes`);
            setOutcomes(data);
        } catch (err) {
            setError(err.message);
        }
    };

    useEffect(() => {
        fetchOutcomes();
    }, [action.action_id]);

    const handleRecordOutcome = async (e) => {
        e.preventDefault();
        try {
            await apiFetch(`/api/v1/actions/${action.action_id}/outcomes`, {
                method: 'POST',
                body: JSON.stringify({ outcome_description: outcomeDescription }),
            });
            fetchOutcomes(); // Refresh outcomes list
            setOutcomeDescription('');
            setShowOutcomeForm(false);
            setError(null);
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