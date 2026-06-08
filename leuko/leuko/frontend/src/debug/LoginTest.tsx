import React, { useEffect, useState } from 'react';

const LoginTest: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testAuthFlow = async () => {
      try {
        // Test 1: Check if we can reach the backend
        console.log('Testing backend connectivity...');
        const response = await fetch('http://localhost:4000/api/me', {
          credentials: 'include'
        });
        console.log('Backend response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend response data:', data);
          setAuthStatus(`Connected - User: ${data.user?.username || 'None'}`);
        } else {
          setAuthStatus('Backend not responding correctly');
        }
      } catch (err) {
        console.error('Auth test error:', err);
        setError(`Network error: ${err}`);
        setAuthStatus('Failed to connect');
      }
    };

    testAuthFlow();
  }, []);

  return (
    <div className="p-8 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Login Debug Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Authentication Status:</h2>
          <p className={authStatus.includes('Failed') ? 'text-red-600' : 'text-green-600'}>
            {authStatus}
          </p>
        </div>
        
        {error && (
          <div className="p-4 border border-red-300 bg-red-50 rounded">
            <h2 className="font-semibold mb-2 text-red-600">Error:</h2>
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Component Test:</h2>
          <p>If you can see this page, basic React rendering is working.</p>
          <button 
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => console.log('Button clicked - JavaScript working')}
          >
            Test JavaScript
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;
