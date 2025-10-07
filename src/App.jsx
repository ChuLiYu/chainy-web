import { useState } from 'react';
import './App.css';
import './styles.css';

// Debug: Test if App component is loading
console.log('App component is loading...');

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? 'http://localhost:3000';

function App() {
  console.log('App function is executing...');
  
  // Minimal state for testing
  const [testState, setTestState] = useState('test');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  console.log('App state initialized:', testState);

  // Google OAuth redirect login function
  const handleGoogleLogin = async () => {
    console.log('Google login button clicked');
    setIsLoggingIn(true);
    
    try {
      console.log('Starting Google OAuth redirect...');
      console.log('Client ID:', GOOGLE_CLIENT_ID);
      console.log('Redirect URI:', GOOGLE_REDIRECT_URI);
      
      if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID_HERE') {
        throw new Error('Google Client ID not configured');
      }
      
      // Create OAuth URL
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        state: 'google_auth_' + Math.random().toString(36).substring(7)
      });
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
      console.log('Redirecting to:', authUrl);
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google 登入錯誤: ' + error.message);
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="App">
      <h1>CHAINY - Debug Test</h1>
      <p>Test State: {testState}</p>
      <button onClick={() => setTestState('clicked')}>
        Test Button
      </button>
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(2, 6, 23, 0.6)', borderRadius: '12px' }}>
        <p>Google Login Button Test:</p>
        <button 
          onClick={handleGoogleLogin}
          disabled={isLoggingIn}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 24px',
            backgroundColor: isLoggingIn ? '#f3f4f6' : 'white',
            border: '1px solid #dadce0',
            borderRadius: '8px',
            cursor: isLoggingIn ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            color: isLoggingIn ? '#9ca3af' : '#3c4043',
            opacity: isLoggingIn ? 0.7 : 1
          }}
        >
          {isLoggingIn ? '登入中...' : 'Sign in with Google'}
        </button>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          <p>Client ID: {GOOGLE_CLIENT_ID.substring(0, 20)}...</p>
          <p>Redirect URI: {GOOGLE_REDIRECT_URI}</p>
        </div>
      </div>
    </div>
  );
}

export default App;
