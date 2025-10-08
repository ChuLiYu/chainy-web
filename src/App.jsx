import { useState, useEffect, useCallback } from 'react';
import './App.css';
import './styles.css';
import {
  clearToken,
  clearUserProfile,
  isAuthenticated as checkAuth,
  getCurrentUser,
  createAuthenticatedRequest,
  handleAuthError
} from './utils/auth.js';
import { createLogger } from './utils/logger.js';
import {
  fetchWithServiceStatusCheck
} from './utils/serviceStatus.js';
import { ServiceStatusDisplay, ServiceStatusBanner } from './components/ServiceStatusDisplay.jsx';

// Initialize logger for App component
const logger = createLogger('App');

// Environment variables
const API_ENDPOINT = import.meta.env.VITE_CHAINY_API ?? 'https://9qwxcajqf9.execute-api.ap-northeast-1.amazonaws.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI ?? 'http://localhost:3000';


// URL validation
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// Custom code validation
function isValidCustomCode(code) {
  const pattern = /^[a-zA-Z0-9_-]{4,32}$/;
  return pattern.test(code);
}

// Short URL resolution
function resolveShortUrl(link) {
  const base = window.location.origin;
  if (link.custom_code) {
    return `${base}/${link.custom_code}`;
  }
  return `${base}/${link.code}`;
}

// Translations
const translations = {
  en: {
    title: 'CHAINY',
    subtitle: 'Instant Links, WAGMI 🚀',
    urlShortener: 'URL Shortener',
    targetUrl: 'Target URL',
    placeholder: 'https://your-website.com',
    generateShortUrl: 'Generate Short URL',
    loginPrompt: '💡 Login to customize short codes and manage links',
    signInWithGoogle: 'Sign in with Google',
    poweredBy: 'Powered by Chainy',
    github: 'GitHub',
    myShortLinks: 'My Short Links',
    myLinks: 'My Links',
    customCode: 'Custom Code',
    customCodePlaceholder: 'e.g., my-link',
    customCodeHelp: 'Add a memorable title for this short URL to easily identify it in your list',
    invalidUrl: 'Please enter a valid URL',
    invalidCustomCode: 'Custom code must be 4-32 characters, letters, numbers, hyphens, and underscores only',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    deleteLink: 'Delete',
    editLink: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    logout: 'Click to sign out',
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    noLinks: 'No short links yet. Create your first one above!',
    loginFailed: 'Login failed',
    jwtMissing: 'JWT token missing',
    authExpired: 'Authentication expired. Please login again.',
    userProfileMissing: 'User profile is missing. Please login again.',
    failedToFetch: 'Failed to fetch links',
    failedToRetrieve: 'Failed to retrieve links',
    networkError: 'Network error. Please check your connection.',
    serverError: 'Server error. Please try again later.',
    unknownError: 'Unknown error occurred'
  },
  zh: {
    title: 'CHAINY',
    subtitle: '即時連結，WAGMI 🚀',
    urlShortener: '網址縮短器',
    targetUrl: '目標網址',
    placeholder: 'https://your-website.com',
    generateShortUrl: '生成短網址',
    loginPrompt: '💡 登入以自訂代碼和管理連結',
    signInWithGoogle: '使用 Google 登入',
    poweredBy: '由 Chainy 提供技術支援',
    github: 'GitHub',
    myShortLinks: '我的短網址',
    myLinks: '我的連結',
    customCode: '自訂代碼',
    customCodePlaceholder: '例如：my-link',
    customCodeHelp: '為此短網址添加一個難忘的標題，以便在列表中輕鬆識別',
    invalidUrl: '請輸入有效的網址',
    invalidCustomCode: '自訂代碼必須是 4-32 個字符，只能包含字母、數字、連字符和底線',
    copyLink: '複製連結',
    copied: '已複製！',
    deleteLink: '刪除',
    editLink: '編輯',
    save: '儲存',
    cancel: '取消',
    logout: '點擊登出',
    loading: '載入中...',
    error: '錯誤',
    retry: '重試',
    noLinks: '還沒有短網址。請在上面創建您的第一個！',
    loginFailed: '登入失敗',
    jwtMissing: 'JWT 令牌缺失',
    authExpired: '認證已過期。請重新登入。',
    userProfileMissing: '用戶資料缺失。請重新登入。',
    failedToFetch: '獲取連結失敗',
    failedToRetrieve: '檢索連結失敗',
    networkError: '網路錯誤。請檢查您的連接。',
    serverError: '伺服器錯誤。請稍後再試。',
    unknownError: '發生未知錯誤'
  }
};

function App() {
  // State management - grouped by functionality
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Links management state
  const [showLinksList, setShowLinksList] = useState(false);
  const [linksList, setLinksList] = useState([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState(new Set());
  
  // UI state
  const [language, setLanguage] = useState('en');
  const [serviceStatus, setServiceStatus] = useState(null);
  const [showServiceStatusModal, setShowServiceStatusModal] = useState(false);
  
  // Computed values
  const isValidUrlValue = isValidUrl(url);
  const isValidCustomCodeValue = isValidCustomCode(customCode);
  const t = translations[language];

  // Fetch links list with retry logic
  const fetchLinksList = useCallback(async (retryAttempt = 0) => {
    if (!isAuthenticated) return;

    setIsLoadingLinks(true);
    setError('');

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        throw new Error(t.userProfileMissing);
      }

      const options = createAuthenticatedRequest({ method: 'GET' });
      const response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links`, options, language);

      if (handleAuthError(response)) {
        setIsAuthenticated(false);
        setUser(null);
        throw new Error(t.authExpired);
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || t.failedToFetch);
      }

      const data = await response.json();
      const links = data.links || [];
      const normalizedLinks = links.map(link => ({
        ...link,
        shortUrl: resolveShortUrl(link),
        short_url: link.short_url || link.shortUrl || undefined
      }));

      const sortedLinks = normalizedLinks.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setLinksList(sortedLinks);
    } catch (err) {
      logger.error('Error fetching links:', err);

      if (err.isServiceDown && err.serviceStatus) {
        setServiceStatus(err.serviceStatus);
        setShowServiceStatusModal(true);
        return;
      }

      if (retryAttempt < 2 && (err.message.includes('fetch') || err.message.includes('network'))) {
        logger.debug(`Retrying fetchLinksList, attempt ${retryAttempt + 1}`);
        setTimeout(() => {
          fetchLinksList(retryAttempt + 1);
        }, 1000 * (retryAttempt + 1));
        return;
      }

      setError(err.message || t.failedToRetrieve);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [isAuthenticated, language, t]);


  // Pure OAuth 2.0 redirect handler
  const handleGoogleResponse = useCallback(() => {
    logger.debug('Google login button clicked - redirecting to OAuth 2.0 flow');

    const startOAuthRedirect = async () => {
      try {
        logger.debug('=== OAUTH REDIRECT DEBUG ===');
        logger.debug('Starting Google OAuth redirect login');
        logger.debug('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
        logger.debug('GOOGLE_REDIRECT_URI:', GOOGLE_REDIRECT_URI);
        logger.debug('Current origin:', window.location.origin);

        if (!GOOGLE_CLIENT_ID) {
          throw new Error('Google Client ID not configured');
        }

        const generateRandomString = (length) => {
          const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
          const array = new Uint8Array(length);
          window.crypto.getRandomValues(array);
          return Array.from(array, (byte) => charset[byte % charset.length]).join('');
        };

        const base64UrlEncode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
          .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        const createPkcePair = async () => {
          const verifier = generateRandomString(128);
          const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
          const challenge = base64UrlEncode(digest);
          return { verifier, challenge };
        };

        const state = `google_auth_${generateRandomString(16)}`;
        const { verifier, challenge } = await createPkcePair();
        sessionStorage.setItem(`pkce_verifier_${state}`, verifier);
        
        logger.debug('PKCE parameters:', {
          state,
          verifier: verifier.substring(0, 20) + '...',
          challenge: challenge.substring(0, 20) + '...'
        });

        const redirectUri = GOOGLE_REDIRECT_URI || window.location.origin;
        const params = new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'openid email profile',
          include_granted_scopes: 'true',
          access_type: 'offline',
          state,
          code_challenge: challenge,
          code_challenge_method: 'S256'
        });

        logger.debug('OAuth parameters:', {
          client_id: GOOGLE_CLIENT_ID,
          redirect_uri: redirectUri,
          state,
          hasChallenge: !!challenge,
          scope: 'openid email profile'
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        logger.debug('Redirecting to Google OAuth URL:', authUrl);

        window.location.href = authUrl;
      } catch (err) {
        logger.error('Failed to start redirect login:', err);
        setError(err.message || 'Google 登入失敗');
      }
    };

    startOAuthRedirect();
  }, [setError]);

  // OAuth callback handler
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      logger.error('OAuth error:', error);
      setError(`登入失敗: ${error}`);
      return;
    }

    if (code && state && state.startsWith('google_auth')) {
      logger.debug('OAuth callback detected:', { 
        code: code.substring(0, 20) + '...', 
        state 
      });
      
      const handleOAuthCallback = async () => {
        try {
          setIsLoggingIn(true);
          setError('');
          
          logger.debug('=== OAUTH CALLBACK DEBUG ===');
          logger.debug('API_ENDPOINT:', API_ENDPOINT);
          logger.debug('GOOGLE_REDIRECT_URI:', GOOGLE_REDIRECT_URI);
          logger.debug('Code:', code ? code.substring(0, 20) + '...' : 'null');
          logger.debug('State:', state);
          
          const pkceVerifier = sessionStorage.getItem(`pkce_verifier_${state}`);
          logger.debug('PKCE verifier:', pkceVerifier ? pkceVerifier.substring(0, 20) + '...' : 'null');
          
          const requestBody = {
            googleToken: code,
            provider: 'google',
            tokenType: 'code',
            redirectUri: GOOGLE_REDIRECT_URI,
            codeVerifier: pkceVerifier
          };

          logger.debug('Request body:', requestBody);
          logger.debug('Request URL:', `${API_ENDPOINT}/auth/google`);

          const response = await fetch(`${API_ENDPOINT}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
          });

          logger.debug('Response status:', response.status);
          logger.debug('Response headers:', Object.fromEntries(response.headers.entries()));

          if (!response.ok) {
            const errorText = await response.text();
            logger.error('Response error text:', errorText);
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
          }

          const data = await response.json();
          logger.debug('OAuth success:', data);

          localStorage.setItem('chainy_jwt_token', data.jwt);
          localStorage.setItem('chainy_user_profile', JSON.stringify(data.user));
          setUser(data.user);
          setIsAuthenticated(true);
          
          sessionStorage.removeItem(`pkce_verifier_${state}`);
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (err) {
          logger.error('OAuth callback error:', err);
          setError('登入失敗: ' + err.message);
        } finally {
          setIsLoggingIn(false);
        }
      };

      handleOAuthCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsAuthenticated, setIsLoggingIn, setError, setUser]);

  // Initialize authentication status
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = checkAuth();
      setIsAuthenticated(authStatus);
      if (authStatus) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
    };
    checkAuthStatus();
  }, []);

  // Fetch links when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      logger.debug('User authenticated, fetching links list');
      fetchLinksList();
    }
  }, [isAuthenticated, fetchLinksList]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUrlValue) {
      setError(t.invalidUrl);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
        const options = createAuthenticatedRequest({
          method: 'POST',
        body: JSON.stringify({
          target: url,
          custom_code: customCode || undefined,
        }),
        });

      const response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links`, options, language);

        if (handleAuthError(response)) {
          setIsAuthenticated(false);
          setUser(null);
        throw new Error(t.authExpired);
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create short link');
      }

      const data = await response.json();
      setResult(data);
      setUrl('');
      setCustomCode('');

      if (isAuthenticated) {
        await fetchLinksList();
      }
    } catch (err) {
      logger.error('Error creating short link:', err);
      
      if (err.isServiceDown && err.serviceStatus) {
        setServiceStatus(err.serviceStatus);
        setShowServiceStatusModal(true);
        return;
      }
      
      setError(err.message || t.unknownError);
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
    }
  };

  // Copy link with tracking
  const copyLink = async (link) => {
    await copyToClipboard(link.shortUrl);
    setCopiedLinks(prev => new Set([...prev, link.id]));
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
        newSet.delete(link.id);
          return newSet;
        });
      }, 2000);
  };

  // Delete link
  const deleteLink = async (linkId) => {
    try {
      const options = createAuthenticatedRequest({ method: 'DELETE' });
      const response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links/${linkId}`, options, language);

      if (handleAuthError(response)) {
        setIsAuthenticated(false);
        setUser(null);
        throw new Error(t.authExpired);
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete link');
      }

      await fetchLinksList();
    } catch (err) {
      logger.error('Error deleting link:', err);
      setError(err.message || 'Failed to delete link');
    }
  };

  // Logout
  const handleLogout = () => {
    clearToken();
    clearUserProfile();
              setIsAuthenticated(false);
              setUser(null);
              setShowLinksList(false);
              setLinksList([]);
              setResult(null);
  };

  // Toggle links list
  const handleToggleLinksList = () => {
    if (!isAuthenticated) return;
    if (!showLinksList) {
      fetchLinksList();
    }
    setShowLinksList(prev => !prev);
  };

  // Service status handlers
  const handleServiceStatusRetry = () => {
    setShowServiceStatusModal(false);
    setServiceStatus(null);
    if (isAuthenticated && showLinksList) {
      fetchLinksList();
    }
  };

  const handleServiceStatusDismiss = () => {
    setShowServiceStatusModal(false);
    setServiceStatus(null);
  };

  // Loading spinner component
  const LoadingSpinner = ({ size = 20, color = 'rgba(59, 130, 246, 0.8)' }) => (
    <div
              style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${color}`,
                borderRadius: '50%',
        borderTopColor: 'transparent',
        animation: 'spin 1s ease-in-out infinite',
      }}
    />
  );

  return (
    <div className="app">
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <span className="rocket">🚀</span>
            <div className="language-selector">
          <button
                className={language === 'zh' ? 'active' : ''} 
            onClick={() => setLanguage('zh')}
          >
            中文
          </button>
              <span>|</span>
          <button
                className={language === 'en' ? 'active' : ''} 
            onClick={() => setLanguage('en')}
          >
            EN
          </button>
        </div>
      </div>
          <h1 className="title">{t.title}</h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>
      </header>

      {/* User Profile */}
      {isAuthenticated && user && (
        <div className="user-profile">
          <div className="user-info">
            <img
              src={user.picture || 'https://via.placeholder.com/40'}
              alt={user.name || 'User'}
              className="user-avatar"
            />
            <div className="user-details">
              <span className="user-name">{user.name || 'User'}</span>
              <button 
                className="logout-btn"
                onClick={handleLogout}
                title={t.logout}
              >
                {t.logout}
              </button>
              </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        <div className="url-shortener">
          <h2>{t.urlShortener}</h2>
          
          <form onSubmit={handleSubmit} className="url-form">
            <div className="form-group">
              <label htmlFor="url">{t.targetUrl}</label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.placeholder}
                className={!isValidUrlValue && url ? 'invalid' : ''}
                required
              />
              {!isValidUrlValue && url && (
                <span className="error-text">{t.invalidUrl}</span>
                  )}
                </div>

            {isAuthenticated && (
              <div className="form-group">
                <label htmlFor="customCode">{t.customCode}</label>
                <input
                  id="customCode"
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder={t.customCodePlaceholder}
                  className={!isValidCustomCodeValue && customCode ? 'invalid' : ''}
                />
                <small className="help-text">{t.customCodeHelp}</small>
                {!isValidCustomCodeValue && customCode && (
                  <span className="error-text">{t.invalidCustomCode}</span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !isValidUrlValue || (customCode && !isValidCustomCodeValue)}
              className="submit-btn"
            >
              {isLoading ? <LoadingSpinner size={16} /> : t.generateShortUrl}
            </button>
          </form>

          {/* Error Display */}
            {error && (
            <div className="error-message">
              <p>{error}</p>
              {(error.includes('Failed to fetch') || error.includes('Failed to retrieve')) && (
                  <button
                    onClick={() => fetchLinksList()}
                    disabled={isLoadingLinks}
                  className="retry-btn"
                >
                  {t.retry}
                  </button>
              )}
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="result">
              <div className="result-content">
                <div className="result-info">
                  <p className="result-label">Short URL:</p>
                  <p className="result-url">{result.shortUrl}</p>
                </div>
                  <button
                  onClick={() => copyToClipboard(result.shortUrl)}
                  className="copy-btn"
                  disabled={copied}
                >
                  {copied ? t.copied : t.copyLink}
                  </button>
                </div>
              </div>
          )}

          {/* Login Prompt */}
          {!isAuthenticated && (
            <div className="login-prompt">
              <p>{t.loginPrompt}</p>
                <button
                onClick={handleGoogleResponse}
                disabled={isLoggingIn}
                className="google-login-btn"
              >
                {isLoggingIn ? <LoadingSpinner size={16} /> : t.signInWithGoogle}
                </button>
            </div>
          )}

          {/* My Short Links */}
        {isAuthenticated && (
            <div className="my-links-section">
            <button
              onClick={handleToggleLinksList}
                className="toggle-links-btn"
              >
                <span>{t.myShortLinks}</span>
                <span className="toggle-icon">
                  {showLinksList ? '▲' : '▼'}
                </span>
              </button>
              
              {showLinksList && (
                <div className="links-list">
                  <h3>{t.myLinks}</h3>
                  
                  {isLoadingLinks ? (
                    <div className="loading-state">
                      <LoadingSpinner />
                      <span>{t.loading}</span>
                </div>
                  ) : linksList.length === 0 ? (
                    <p className="no-links">{t.noLinks}</p>
                  ) : (
                    <div className="links-grid">
                      {linksList.map((link) => (
                        <div key={link.id} className="link-item">
                          <div className="link-content">
                            <div className="link-info">
                              <p className="link-title">{link.title || link.target}</p>
                              <p className="link-url">{link.shortUrl}</p>
                              <p className="link-target">{link.target}</p>
                </div>
                            <div className="link-actions">
                              <button
                                onClick={() => copyLink(link)}
                                className="action-btn copy"
                                disabled={copiedLinks.has(link.id)}
                              >
                                {copiedLinks.has(link.id) ? t.copied : t.copyLink}
            </button>
                              <button
                                onClick={() => deleteLink(link.id)}
                                className="action-btn delete"
                              >
                                {t.deleteLink}
                              </button>
            </div>
                          </div>
                        </div>
                      ))}
          </div>
        )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

        {/* Footer */}
      <footer className="footer">
        <p>{t.poweredBy}</p>
        <a href="https://github.com/ChuLiYu" target="_blank" rel="noopener noreferrer">
          {t.github}
        </a>
      </footer>

      {/* Service Status Components */}
      <ServiceStatusDisplay
        serviceStatus={serviceStatus}
        showModal={showServiceStatusModal}
        onRetry={handleServiceStatusRetry}
        onDismiss={handleServiceStatusDismiss}
      />
      <ServiceStatusBanner serviceStatus={serviceStatus} />
    </div>
  );
}

export default App;
