import React, 'react';
import { Button, ScrollView, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import * as SQLite from 'expo-sqlite';
import { syncAssessments } from '../services/sync';
import { useAuth } from '../src/AuthContext'; // Import useAuth

// Open a database, creating it if it doesn't exist
const db = SQLite.openDatabase('assessments.db');

const AssessmentForm = () => {
    const { authToken } = useAuth(); // Get the auth token
    // State for form fields
    const [clientId, setClientId] = React.useState('');
    const [assessorId, setAssessorId] = React.useState('');
    const [location, setLocation] = React.useState('');
    const [answers, setAnswers] = React.useState('');
    const [statusMessage, setStatusMessage] = React.useState('');

    // Setup database table on component mount
    React.useEffect(() => {
        db.transaction(tx => {
            tx.executeSql(
                `CREATE TABLE IF NOT EXISTS assessments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER,
                    assessor_id INTEGER,
                    date TEXT,
                    location TEXT,
                    form_version TEXT,
                    answers_json TEXT,
                    attachments TEXT,
                    synced INTEGER DEFAULT 0
                );`,
                [],
                () => console.log('Table created successfully'),
                (_, error) => console.log('Error creating table: ', error)
            );
        });
    }, []);

    const saveAssessment = () => {
        if (!clientId || !assessorId) {
            setStatusMessage('Client ID and Assessor ID are required.');
            return;
        }

        const assessmentData = {
            client_id: parseInt(clientId, 10),
            assessor_id: parseInt(assessorId, 10),
            date: new Date().toISOString(),
            location: location,
            form_version: '1.0',
            answers_json: JSON.stringify({ notes: answers }),
            attachments: '', // Placeholder for now
        };

        db.transaction(tx => {
            tx.executeSql(
                `INSERT INTO assessments (client_id, assessor_id, date, location, form_version, answers_json, attachments)
                 VALUES (?, ?, ?, ?, ?, ?, ?);`,
                [
                    assessmentData.client_id,
                    assessmentData.assessor_id,
                    assessmentData.date,
                    assessmentData.location,
                    assessmentData.form_version,
                    assessmentData.answers_json,
                    assessmentData.attachments,
                ],
                (_, result) => {
                    console.log('Assessment saved locally, ID: ', result.insertId);
                    setStatusMessage(`Assessment saved successfully (ID: ${result.insertId})`);
                    // Clear form
                    setClientId('');
                    setAssessorId('');
                    setLocation('');
                    setAnswers('');
                },
                (_, error) => {
                    console.log('Error saving assessment: ', error);
                    setStatusMessage('Error saving assessment.');
                }
            );
        });
    };

    const handleSync = async () => {
        setStatusMessage('Starting sync...');
        try {
            const { syncedCount, errors } = await syncAssessments(authToken); // Pass the token here
            let message = `Sync complete. ${syncedCount} assessments synced.`;
            if (errors.length > 0) {
                message += ` ${errors.length} failed.`;
                console.log('Sync errors:', errors);
            }
            setStatusMessage(message);
            Alert.alert("Sync Complete", message);
        } catch (error) {
            setStatusMessage(`Sync failed: ${error.message}`);
            Alert.alert("Sync Error", error.message);
            console.error('Sync process failed:', error);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Offline Assessment</Text>
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Client ID"
                    value={clientId}
                    onChangeText={setClientId}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Assessor ID"
                    value={assessorId}
                    onChangeText={setAssessorId}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Location"
                    value={location}
                    onChangeText={setLocation}
                />
                <TextInput
                    style={styles.inputLarge}
                    placeholder="Assessment Notes..."
                    value={answers}
                    onChangeText={setAnswers}
                    multiline
                />
            </View>
            <Button title="Save Assessment Offline" onPress={saveAssessment} />
            <View style={styles.syncButtonContainer}>
                <Button title="Sync Data to Server" onPress={handleSync} color="#841584" />
            </View>
            {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
    },
    inputLarge: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 15,
        height: 100,
        textAlignVertical: 'top',
    },
    syncButtonContainer: {
        marginTop: 10,
    },
    status: {
        marginTop: 15,
        textAlign: 'center',
        color: 'blue',
    },
});

export default AssessmentForm;