import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonLoading } from '@ionic/react';

const DashboardRedirect: React.FC = () => {
  const { userRole, verificationStatus, loading } = useAuth();

  if (loading) {
    return <IonLoading isOpen={true} message="Loading profile..." spinner="circles" />;
  }

  if (userRole === 'superadmin') {
    return <Redirect to="/superadmin/dashboard" />;
  } else if (userRole === 'admin') {
    return <Redirect to="/admin/dashboard" />;
  } else if (userRole === 'user') {
    // Handle redirection based on verification status for users
    switch (verificationStatus) {
      case 'verified':
        return <Redirect to="/user/dashboard" />;
      case 'pending':
        return <Redirect to="/user/pending-verification" />;
      case 'rejected':
        return <Redirect to="/user/rejected-verification" />;
      case 'not_submitted':
      default:
        return <Redirect to="/user/start-registration" />;
    }
  } else {
    // If no role or unknown role, redirect to login
    return <Redirect to="/login" />;
  }
};

export default DashboardRedirect;