import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './App.css';
import CarePlan from './CarePlan'; // Import the new component

function ClientPage() {
    const { clientId } = useParams();
    const navigate = useNavigate();

    return (
        <div>
            <button onClick={() => navigate('/')}>
                &larr; Back to Dashboard
            </button>
            <h2 style={{ marginTop: '20px' }}>Client Details: ID {clientId}</h2>
            <div className="client-page-container">
                {/* These sections are still placeholders, but the structure is here */}
                <div className="client-section">
                    <h3>Assessments</h3>
                    <p>A list of assessments for client {clientId} would appear here.</p>
                </div>
                <div className="client-section">
                    <h3>Assistive Devices</h3>
                    <p>A list of assistive devices for client {clientId} would appear here.</p>
                </div>
                {/* The Care Plan component is now integrated */}
                <div className="client-section" id="care-plan-section">
                    <CarePlan clientId={clientId} />
                </div>
            </div>
        </div>
    );
}

export default ClientPage;