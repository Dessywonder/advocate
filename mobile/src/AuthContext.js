import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);
const TOKEN_KEY = 'authToken';

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await SecureStore.getItemAsync(TOKEN_KEY);
                if (token) {
                    setAuthToken(token);
                    setUser(jwtDecode(token));
                }
            } catch (e) {
                console.error("Failed to load auth token:", e);
            } finally {
                setLoading(false);
            }
        };
        loadToken();
    }, []);

    const login = async (token) => {
        try {
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            setAuthToken(token);
            setUser(jwtDecode(token));
        } catch (e) {
            console.error("Failed to save auth token:", e);
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            setAuthToken(null);
            setUser(null);
        } catch (e) {
            console.error("Failed to delete auth token:", e);
        }
    };

    const value = {
        authToken,
        user,
        loading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};