# GitHub Authentication Setup

This document explains how the GitHub authentication system works in the PReviewer frontend.

## Overview

The frontend uses a robust GitHub OAuth authentication system with the following features:

- **OAuth 2.0 Flow**: Secure GitHub authentication using OAuth 2.0
- **Token Management**: Automatic token refresh and storage
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Loading States**: Proper loading indicators during authentication
- **Protected Routes**: Route protection based on authentication state
- **Context Management**: Global auth state management using React Context

## Architecture

### Components

1. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Manages global authentication state
   - Handles GitHub OAuth callback
   - Provides login/logout functions
   - Manages token refresh

2. **API Utilities** (`src/lib/api.ts`)
   - Centralized API calls
   - Error handling and response processing
   - Token management utilities

3. **ProtectedRoute** (`src/components/ProtectedRoute.tsx`)
   - Route protection component
   - Shows different content based on auth state
   - Handles loading and error states

4. **UI Components**
   - `Loading` components for loading states
   - `Error` components for error display
   - Updated `Navbar` with auth-aware buttons

### Authentication Flow

1. **Initial Load**
   - Check for existing access token in localStorage
   - Validate token with backend
   - Refresh token if needed
   - Load user data

2. **Login Process**
   - User clicks "Connect GitHub"
   - Redirect to GitHub OAuth authorization
   - GitHub redirects back with authorization code
   - Exchange code for access token
   - Store token and user data

3. **Token Refresh**
   - Automatic token refresh every 10 minutes
   - Background refresh without user interruption
   - Fallback to logout if refresh fails

4. **Logout Process**
   - Disconnect from GitHub (revoke token)
   - Clear local storage
   - Reset auth state

## Environment Configuration

Create a `.env.local` file in the frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:5000

# GitHub OAuth Configuration (if needed for frontend)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id_here
```

## Usage

### Using the Auth Context

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  
  if (!isAuthenticated) {
    return <button onClick={login}>Connect GitHub</button>;
  }

  return (
    <div>
      <p>Welcome, {user?.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protecting Routes

```tsx
import { ProtectedRoute } from '@/components/ProtectedRoute';

function App() {
  return (
    <ProtectedRoute requireAuth={true}>
      <Dashboard />
    </ProtectedRoute>
  );
}
```

### Conditional Rendering

```tsx
import { useAuthGuard } from '@/components/ProtectedRoute';

function MyComponent() {
  const { canAccess, isLoading } = useAuthGuard();

  if (isLoading) return <Loading />;
  
  return canAccess ? <ProtectedContent /> : <PublicContent />;
}
```

## Error Handling

The system handles various error scenarios:

- **Network Errors**: Connection issues with backend
- **Authentication Errors**: Invalid or expired tokens
- **GitHub API Errors**: Issues with GitHub OAuth
- **User Cancellation**: User cancels OAuth flow

All errors are displayed to users with appropriate messages and recovery options.

## Security Features

- **Token Storage**: Access tokens stored in localStorage (consider httpOnly cookies for production)
- **Token Validation**: Regular validation of token validity
- **Automatic Refresh**: Background token refresh to maintain session
- **Secure Logout**: Proper token revocation on logout
- **Error Boundaries**: React error boundaries for graceful error handling

## Backend Integration

The frontend expects the following backend endpoints:

- `GET /api/github/login` - Initiate OAuth flow
- `GET /api/github/callback` - Handle OAuth callback
- `POST /api/github/refresh` - Refresh access token
- `DELETE /api/github/disconnect` - Disconnect from GitHub
- `GET /api/user/profile` - Get current user profile

## Development

### Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

### Testing Authentication

1. Start the backend server
2. Start the frontend development server
3. Navigate to the application
4. Click "Connect GitHub" to test the OAuth flow

### Debugging

- Check browser console for authentication logs
- Monitor network requests in browser dev tools
- Verify environment variables are set correctly
- Check backend logs for API errors

## Production Considerations

- Use environment variables for all configuration
- Implement proper CORS settings
- Consider using httpOnly cookies for token storage
- Add rate limiting for auth endpoints
- Implement proper logging and monitoring
- Add security headers
- Consider implementing refresh token rotation 