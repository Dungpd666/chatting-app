import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactElement;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tg-bg">
        <div className="flex flex-col items-center gap-4">
          <div className="tg-spinner w-8 h-8" />
          <p className="text-tg-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
