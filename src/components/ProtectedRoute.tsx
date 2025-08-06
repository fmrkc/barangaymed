import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
  redirectTo: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole, redirectTo }) => {
  const { currentUser, userRole, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // If user is not authenticated, redirect to login
  if (!currentUser) {
    return <Redirect to="/user/login" />;
  }

  // If user doesn't have the required role, redirect to specified route
  if (userRole !== requiredRole) {
    return <Redirect to={redirectTo} />;
  }

  // If user is authenticated and has the required role, render children
  return <>{children}</>;
};

export default ProtectedRoute;
