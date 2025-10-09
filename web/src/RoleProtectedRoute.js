import React from 'react';
import { useAuth } from './AuthContext';
import { Navigate } from 'react-router-dom';

function RoleProtectedRoute({ children, requiredRoles }) {
    const { user } = useAuth();

    if (!user || !requiredRoles.includes(user.role)) {
        // If the user doesn't have the required role, redirect them.
        // For simplicity, we'll send them to the main dashboard.
        // A more complex app might have a dedicated "Unauthorized" page.
        return <Navigate to="/" replace />;
    }

    return children;
}

export default RoleProtectedRoute;