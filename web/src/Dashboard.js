import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area } from 'recharts';
import './App.css';

const API_URL = 'http://localhost:8000';

function Dashboard() {
    const [predictionData, setPredictionData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchPredictions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/v1/predictions`);
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || 'Failed to fetch predictions.');
            }
            const data = await response.json();
            setPredictionData(data);
            setError(null);
        } catch (err) {
            setError(err.message);
            setPredictionData(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPredictions();
    }, []);

    if (loading) return <p>Loading forecast...</p>;
    if (error) return <p className="error">Error: {error}</p>;
    if (!predictionData) return <p>No prediction data available.</p>;

    return (
        <div>
            <h2>12-Week Assessment Forecast</h2>
            <p>
                <strong>Model Version:</strong> {predictionData.model_version} <br/>
                <strong>Model Summary:</strong> {predictionData.explainability.summary}
            </p>
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer>
                    <LineChart
                        data={predictionData.forecast}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="predicted_value" stroke="#8884d8" name="Predicted Assessments" />
                        {/* Area chart for confidence interval */}
                        <Area
                            type="monotone"
                            dataKey="confidence_high"
                            stackId="1"
                            stroke={false}
                            fill="#82ca9d"
                            fillOpacity={0.2}
                            name="Confidence High"
                        />
                        <Area
                            type="monotone"
                            dataKey="confidence_low"
                            stackId="2"
                            stroke={false}
                            fill="#82ca9d"
                            fillOpacity={0.2}
                            name="Confidence Low"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

export default Dashboard;