import React, { useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';

const AuthTest: React.FC = () => {
  const { user, loading, login, logout } = useAuth();

  useEffect(() => {
    console.log('=== AUTH TEST COMPONENT ===');
    console.log('Current state:', { 
      user: user?.username, 
      role: user?.role, 
      loading,
      timestamp: new Date().toISOString()
    });
  }, [user, loading]);

  const testLogin = async () => {
    console.log('🧪 Testing login...');
    const result = await login('testuser', 'testpass');
    console.log('🧪 Login result:', result);
  };

  const testLogout = async () => {
    console.log('🧪 Testing logout...');
    await logout();
    console.log('🧪 Logout completed');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Test</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="font-semibold mb-2">Current State:</h2>
        <p>User: {user?.username || 'None'}</p>
        <p>Role: {user?.role || 'None'}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
      </div>

      <div className="space-x-4">
        <button 
          onClick={testLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Login
        </button>
        <button 
          onClick={testLogout}
          className="bg-red-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          Test Logout
        </button>
      </div>

      <div className="mt-8 bg-yellow-100 p-4 rounded">
        <h3 className="font-semibold mb-2">Test Scenarios:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>Initial load - should show loading then user state</li>
          <li>Login - should set user and reset loading</li>
          <li>Logout - should clear user</li>
          <li>Re-login - should work without blank page</li>
        </ol>
      </div>
    </div>
  );
};

export default AuthTest;
