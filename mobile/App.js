import React from 'react';
import { ActivityIndicator, View, Button } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/AuthContext';
import LoginPage from './src/LoginPage';
import AssessmentForm from './components/AssessmentForm';

const Stack = createNativeStackNavigator();

function AppNavigator() {
    const { authToken, loading, logout } = useAuth();

    if (loading) {
        // We are still checking for a token, show a loading screen
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator>
                {authToken == null ? (
                    // No token found, user isn't signed in
                    <Stack.Screen
                        name="Login"
                        component={LoginPage}
                        options={{
                            title: 'Sign In',
                            headerShown: false, // Hide header for the login screen
                        }}
                    />
                ) : (
                    // User is signed in
                    <Stack.Screen
                        name="MainApp"
                        component={AssessmentForm}
                        options={{
                            title: 'Offline Assessments',
                            headerRight: () => (
                                <Button onPress={logout} title="Logout" />
                            ),
                        }}
                    />
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}