import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface RedirectIfLoggedInProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const RedirectIfLoggedIn: React.FC<RedirectIfLoggedInProps> = ({ children, redirectTo }) => {
  const { currentUser, userRole, loading } = useAuth();

  // Show nothing while loading
  if (loading) {
    return null;
  }

  // If user is not authenticated, render the login/register page
  if (!currentUser) {
    return <>{children}</>;
  }

  // If user is authenticated, redirect based on their role
  if (userRole === 'user') {
    return <Redirect to="/user/dashboard" />;
  } else if (userRole === 'admin') {
    return <Redirect to="/admin/dashboard" />;
  } else if (userRole === 'superadmin') {
    return <Redirect to="/superadmin/dashboard" />;
  }

  // Fallback: if role is not recognized, redirect to login
  return <Redirect to="/login" />;
};

export default RedirectIfLoggedIn;
