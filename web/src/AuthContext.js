import React, { createContext, useState, useContext } from 'react';
import { jwtDecode } from 'jwt-decode'; // We'll need a library to decode the JWT

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem('authToken'));
    const [user, setUser] = useState(() => {
        const token = localStorage.getItem('authToken');
        try {
            return token ? jwtDecode(token) : null;
        } catch (e) {
            console.error("Invalid token:", e);
            return null;
        }
    });

    const login = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        try {
            setUser(jwtDecode(token));
        } catch (e) {
            console.error("Failed to decode token on login:", e);
            setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setUser(null);
    };

    const value = {
        authToken,
        user,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};