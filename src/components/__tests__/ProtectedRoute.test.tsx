import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { AuthProvider, useAuth } from '../../contexts/AuthContext';
import { logSecurityEvent } from '../../utils/logger';

// Mock the logger
jest.mock('../../utils/logger', () => ({
  logSecurityEvent: jest.fn(),
  logUnauthorizedAccess: jest.fn(),
}));

// Mock the security utils
jest.mock('../../utils/securityUtils', () => ({
  validateAccess: jest.fn(),
  forceTokenRefresh: jest.fn(),
}));

// Mock the auth context
const mockAuthContext = {
  currentUser: { uid: 'test-user-id', email: 'test@example.com' },
  userRole: 'user',
  userBarangayId: 'brgy-001',
  loading: false,
  login: jest.fn(),
  logout: jest.fn(),
  refreshUserClaims: jest.fn(),
};

jest.mock('../../contexts/AuthContext', () => ({
  ...jest.requireActual('../../contexts/AuthContext'),
  useAuth: jest.fn(),
}));

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

describe('ProtectedRoute Security Enhancements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue(mockAuthContext);
    (require('../../utils/securityUtils').validateAccess as jest.Mock).mockReturnValue({ isValid: true });
    (require('../../utils/securityUtils').forceTokenRefresh as jest.Mock).mockResolvedValue(undefined);
  });

  const renderWithRouter = (initialRoute = '/protected', authState: any = mockAuthContext) => {
    (useAuth as jest.Mock).mockReturnValue(authState);
    
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialRoute]}>
          <div>
            <Route 
              path="/protected" 
              render={() => (
                <ProtectedRoute requiredRole="user" redirectTo="/login">
                  <TestComponent />
                </ProtectedRoute>
              )} 
            />
            <Route path="/login" render={() => <LoginComponent />} />
          </div>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  test('should grant access when user has required role', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      'test-user-id',
      'ACCESS_GRANTED',
      expect.stringContaining('User successfully accessed protected route'),
      expect.any(Object)
    );
  });

  test('should redirect when user does not have required role', async () => {
    (require('../../utils/securityUtils').validateAccess as jest.Mock).mockReturnValue({ 
      isValid: false, 
      reason: 'User role user does not match required role admin' 
    });

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      'test-user-id',
      'ACCESS_DENIED',
      expect.stringContaining('Access denied for'),
      expect.any(Object)
    );
  });

  test('should show loading state during validation', async () => {
    const loadingAuthState = { ...mockAuthContext, loading: true };
    renderWithRouter('/protected', loadingAuthState);

    expect(screen.getByText('Verifying access permissions...')).toBeInTheDocument();
  });

  test('should redirect unauthenticated users to login with return URL', async () => {
    const unauthenticatedAuthState = { 
      ...mockAuthContext, 
      currentUser: null,
      userRole: null,
      userBarangayId: null
    };
    renderWithRouter('/protected', unauthenticatedAuthState);

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      'unknown',
      'UNAUTHENTICATED_ACCESS',
      expect.stringContaining('Attempted access to protected route'),
      expect.any(Object)
    );
  });

  test('should handle token refresh errors gracefully', async () => {
    const error = new Error('Token refresh failed');
    (require('../../utils/securityUtils').forceTokenRefresh as jest.Mock).mockRejectedValue(error);

    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(logSecurityEvent).toHaveBeenCalledWith(
      'test-user-id',
      'SECURITY_VALIDATION_ERROR',
      expect.stringContaining('Error during security validation'),
      expect.any(Object)
    );
  });

  test('should validate barangay-specific access', async () => {
    (require('../../utils/securityUtils').validateAccess as jest.Mock).mockImplementation(
      (userRole, userBarangayId, requiredRole, requiredBarangayId) => {
        if (requiredBarangayId && userBarangayId !== requiredBarangayId) {
          return { isValid: false, reason: 'Barangay access denied' };
        }
        return { isValid: true };
      }
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <div>
            <Route 
              path="/protected" 
              render={() => (
                <ProtectedRoute 
                  requiredRole="admin" 
                  requiredBarangayId="brgy-002" 
                  redirectTo="/login"
                >
                  <TestComponent />
                </ProtectedRoute>
              )} 
            />
            <Route path="/login" render={() => <LoginComponent />} />
          </div>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  test('should support additional custom validation', async () => {
    const additionalValidation = jest.fn().mockReturnValue(false);

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/protected']}>
          <div>
            <Route 
              path="/protected" 
              render={() => (
                <ProtectedRoute 
                  requiredRole="user" 
                  redirectTo="/login"
                  additionalValidation={additionalValidation}
                >
                  <TestComponent />
                </ProtectedRoute>
              )} 
            />
            <Route path="/login" render={() => <LoginComponent />} />
          </div>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });

    expect(additionalValidation).toHaveBeenCalled();
    expect(logSecurityEvent).toHaveBeenCalledWith(
      'test-user-id',
      'ACCESS_DENIED',
      expect.stringContaining('Custom validation failed'),
      expect.any(Object)
    );
  });
});
