import { useState, useEffect } from 'react';
import './App.css';
import './styles.css';

// Debug: Test if App component is loading
console.log('App component is loading...');

// Google OAuth configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE';
const API_ENDPOINT = import.meta.env.VITE_CHAINY_API ?? 'https://9qwxcajqf9.execute-api.ap-northeast-1.amazonaws.com';

// 安全的重定向 URI 選擇函數
function getSecureRedirectUri() {
  // 1. 優先使用環境變數
  if (import.meta.env.VITE_GOOGLE_REDIRECT_URI) {
    console.log('Using environment redirect URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
    return import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  }
  
  // 2. 根據當前域名自動選擇
  const currentOrigin = window.location.origin;
  if (currentOrigin === 'https://chainy.luichu.dev') {
    console.log('Using production redirect URI based on origin:', currentOrigin);
    return 'https://chainy.luichu.dev';
  } else if (currentOrigin === 'http://localhost:3000' || currentOrigin === 'http://127.0.0.1:3000') {
    console.log('Using local development redirect URI based on origin:', currentOrigin);
    return 'http://localhost:3000';
  }
  
  // 3. 默認使用本地開發
  console.log('Using default local development redirect URI');
  return 'http://localhost:3000';
}

const GOOGLE_REDIRECT_URI = getSecureRedirectUri();

function App() {
  console.log('App function is executing...');

  // State management
  const [testState, setTestState] = useState('test');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  console.log('App state initialized:', testState);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state && state.startsWith('google_auth_')) {
        console.log('OAuth callback detected:', { code: code.substring(0, 20) + '...', state });

        try {
          setIsLoggingIn(true);
          setError('');

          // Exchange code for token via backend
          const response = await fetch(`${API_ENDPOINT}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              googleToken: code,
              provider: 'google',
              tokenType: 'code',
              redirectUri: GOOGLE_REDIRECT_URI,
              codeVerifier: null // PKCE not implemented yet
            })
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const data = await response.json();
          console.log('OAuth success:', data);

          // Store user info
          setUser(data.user);
          setIsAuthenticated(true);

          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (err) {
          console.error('OAuth callback error:', err);
          setError('登入失敗: ' + err.message);
        } finally {
          setIsLoggingIn(false);
        }
      }
    };

    handleOAuthCallback();
  }, []);

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

      {/* Error Display */}
      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c33' }}>
          <strong>錯誤:</strong> {error}
        </div>
      )}

      {/* Authentication Status */}
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(2, 6, 23, 0.6)', borderRadius: '12px' }}>
        {isAuthenticated && user ? (
          <div>
            <h3 style={{ color: '#4ade80', marginBottom: '10px' }}>✅ 登入成功！</h3>
            <p><strong>用戶名稱:</strong> {user.name}</p>
            <p><strong>電子郵件:</strong> {user.email}</p>
            <p><strong>用戶 ID:</strong> {user.id}</p>
            <button
              onClick={() => {
                setIsAuthenticated(false);
                setUser(null);
                setError('');
              }}
              style={{
                marginTop: '10px',
                padding: '8px 16px',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              登出
            </button>
          </div>
        ) : (
          <div>
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
              <p>API Endpoint: {API_ENDPOINT}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
