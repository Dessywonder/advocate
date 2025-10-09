import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from './AuthContext';

// NOTE: For Android emulators, 10.0.2.2 is an alias for the host machine's localhost.
// For iOS simulators or physical devices, you would use your machine's local network IP.
const API_URL = 'http://10.0.2.2:8000';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const auth = useAuth();

    const handleSubmit = async () => {
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/v1/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    username: email,
                    password: password,
                }).toString(),
            });

            if (!response.ok) {
                throw new Error('Login failed. Please check your credentials.');
            }

            const data = await response.json();
            await auth.login(data.access_token);

        } catch (err) {
            setError(err.message);
            Alert.alert("Login Error", err.message);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome Back</Text>
            <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Button title="Login" onPress={handleSubmit} />

            <View style={styles.infoBox}>
                <Text>Test Users:</Text>
                <Text>Manager: manager@care.com</Text>
                <Text>Assessor: assessor@care.com</Text>
                <Text>(Any password will work)</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginBottom: 12,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    errorText: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
    },
    infoBox: {
        marginTop: 30,
        padding: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
    }
});

export default LoginPage;