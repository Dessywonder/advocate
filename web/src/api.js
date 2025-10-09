const API_URL = 'http://localhost:8000';

/**
 * A custom fetch wrapper that automatically adds the Authorization header
 * to every API request. It also standardizes error handling.
 *
 * @param {string} endpoint The API endpoint to call (e.g., '/api/v1/assessments').
 * @param {object} options The options object for the fetch call (e.g., method, body, headers).
 * @returns {Promise<any>} A promise that resolves to the JSON response.
 * @throws {Error} Throws an error if the network response is not ok.
 */
export const apiFetch = async (endpoint, options = {}) => {
    const token = localStorage.getItem('authToken');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        // Try to parse the error message from the backend, otherwise use a generic message.
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            errorMessage = errorData.detail || JSON.stringify(errorData);
        } catch (e) {
            // The response was not JSON, so we use the status text.
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }

    // If the response has content, parse it as JSON. Otherwise, return null.
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return null;
    }
};