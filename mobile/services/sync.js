import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('assessments.db');
const API_URL = 'http://localhost:8000'; // This would be an environment variable in a real app

export const syncAssessments = async () => {
    return new Promise((resolve, reject) => {
        db.transaction(tx => {
            // Step 1: Select all assessments that have not been synced yet
            tx.executeSql(
                'SELECT * FROM assessments WHERE synced = 0;',
                [],
                async (_, { rows: { _array: assessments } }) => {
                    if (assessments.length === 0) {
                        console.log('No new assessments to sync.');
                        resolve({ syncedCount: 0, errors: [] });
                        return;
                    }

                    console.log(`Found ${assessments.length} assessments to sync.`);
                    let syncedCount = 0;
                    const errors = [];

                    for (const assessment of assessments) {
                        try {
                            // Step 2: For each assessment, send it to the backend
                            const response = await fetch(`${API_URL}/api/v1/assessments`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    client_id: assessment.client_id,
                                    assessor_id: assessment.assessor_id,
                                    date: assessment.date,
                                    location: assessment.location,
                                    form_version: assessment.form_version,
                                    answers_json: assessment.answers_json,
                                    attachments: assessment.attachments,
                                }),
                            });

                            if (response.ok) {
                                // Step 3: If successful, update the local record to mark it as synced
                                await new Promise((resolveUpdate, rejectUpdate) => {
                                    db.transaction(updateTx => {
                                        updateTx.executeSql(
                                            'UPDATE assessments SET synced = 1 WHERE id = ?;',
                                            [assessment.id],
                                            () => {
                                                console.log(`Assessment ${assessment.id} marked as synced.`);
                                                syncedCount++;
                                                resolveUpdate();
                                            },
                                            (_, error) => {
                                                console.error(`Failed to update sync status for assessment ${assessment.id}:`, error);
                                                errors.push({ id: assessment.id, error: 'Failed to update local status.' });
                                                rejectUpdate(error);
                                            }
                                        );
                                    });
                                });
                            } else {
                                const errorData = await response.json();
                                console.error(`Failed to sync assessment ${assessment.id}:`, errorData.detail);
                                errors.push({ id: assessment.id, error: errorData.detail });
                            }
                        } catch (error) {
                            console.error(`Network or unexpected error syncing assessment ${assessment.id}:`, error);
                            errors.push({ id: assessment.id, error: 'Network error or server unavailable.' });
                        }
                    }
                    resolve({ syncedCount, errors });
                },
                (_, error) => {
                    console.error('Failed to select assessments for syncing:', error);
                    reject(error);
                }
            );
        });
    });
};