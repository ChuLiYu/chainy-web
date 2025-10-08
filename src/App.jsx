import { useState, useEffect, useCallback, useReducer } from 'react';
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

const API_ENDPOINT = import.meta.env.VITE_CHAINY_API ?? 'https://your-api-gateway-url.amazonaws.com';
const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE';
const PKCE_VERIFIER_PREFIX = 'google_pkce_verifier';

// Language translations
const translations = {
  zh: {
    title: 'CHAINY',
    subtitle: 'Instant Links, WAGMI 🚀',
    urlShortener: 'URL Shortener',
    targetUrl: 'Target URL',
    placeholder: 'https://your-website.com',
    customCode: 'Custom Code',
    customCodePlaceholder: 'e.g., my-link',
    customCodeHelp: 'Add a memorable title for this short URL to easily identify it in your list',
    generateShortUrl: 'Generate Short URL',
    generating: 'Generating...',
    invalidUrl: 'Please enter a valid URL',
    invalidCustomCode: 'Custom code must be 4-32 characters (letters, numbers, hyphens, underscores)',
    loginPrompt: '💡 Login to customize short codes and manage links',
    signInWithGoogle: 'Sign in with Google',
    signingIn: 'Signing in...',
    myShortLinks: 'My Short Links▼',
    myLinks: 'My Links',
    noLinks: 'No links yet',
    loading: 'Loading...',
    copyLink: 'Copy',
    copied: 'Copied!',
    deleteLink: 'Delete',
    retry: 'Retry',
    poweredBy: 'Powered by Chainy',
    github: 'GitHub',
    logout: 'Click to sign out'
  },
  en: {
    title: 'CHAINY',
    subtitle: 'Instant Links, WAGMI 🚀',
    urlShortener: 'URL Shortener',
    targetUrl: 'Target URL',
    placeholder: 'https://your-website.com',
    customCode: 'Custom Code',
    customCodePlaceholder: 'e.g., my-link',
    customCodeHelp: 'Add a memorable title for this short URL to easily identify it in your list',
    generateShortUrl: 'Generate Short URL',
    generating: 'Generating...',
    invalidUrl: 'Please enter a valid URL',
    invalidCustomCode: 'Custom code must be 4-32 characters (letters, numbers, hyphens, underscores)',
    loginPrompt: '💡 Login to customize short codes and manage links',
    signInWithGoogle: 'Sign in with Google',
    signingIn: 'Signing in...',
    myShortLinks: 'My Short Links▼',
    myLinks: 'My Links',
    noLinks: 'No links yet',
    loading: 'Loading...',
    copyLink: 'Copy',
    copied: 'Copied!',
    deleteLink: 'Delete',
    retry: 'Retry',
    poweredBy: 'Powered by Chainy',
    github: 'GitHub',
    logout: 'Click to sign out'
  }
};

// 1. 合併相關狀態的 reducer
const initialState = {
  // URL 相關狀態
  url: '',
  customCode: '',
  result: null,
  error: '',
  
  // 載入狀態
  isLoading: false,
  isLoadingLinks: false,
  isLoggingIn: false,
  
  // 驗證狀態
  isValidUrl: false,
  isValidCustomCode: false,
  
  // 用戶認證狀態
  isAuthenticated: false,
  user: null,
  
  // UI 狀態
  language: 'en',
  copied: false,
  copiedLinks: new Set(),
  showLinksList: false,
  linksList: [],
  
  // 服務狀態
  serviceStatus: null,
  showServiceStatusModal: false
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_URL':
      return { ...state, url: action.payload };
    case 'SET_CUSTOM_CODE':
      return { ...state, customCode: action.payload };
    case 'SET_RESULT':
      return { ...state, result: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_LOADING_LINKS':
      return { ...state, isLoadingLinks: action.payload };
    case 'SET_LOGGING_IN':
      return { ...state, isLoggingIn: action.payload };
    case 'SET_VALIDATION':
      return { 
        ...state, 
        isValidUrl: action.payload.isValidUrl ?? state.isValidUrl,
        isValidCustomCode: action.payload.isValidCustomCode ?? state.isValidCustomCode
      };
    case 'SET_AUTH':
      return { 
        ...state, 
        isAuthenticated: action.payload.isAuthenticated ?? state.isAuthenticated,
        user: action.payload.user ?? state.user
      };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_COPIED':
      return { ...state, copied: action.payload };
    case 'ADD_COPIED_LINK':
      return { 
        ...state, 
        copiedLinks: new Set([...state.copiedLinks, action.payload])
      };
    case 'SET_SHOW_LINKS_LIST':
      return { ...state, showLinksList: action.payload };
    case 'SET_LINKS_LIST':
      return { ...state, linksList: action.payload };
    case 'SET_SERVICE_STATUS':
      return { 
        ...state, 
        serviceStatus: action.payload.serviceStatus ?? state.serviceStatus,
        showServiceStatusModal: action.payload.showModal ?? state.showServiceStatusModal
      };
    case 'RESET_FORM':
      return { 
        ...state, 
        url: '', 
        customCode: '', 
        result: null, 
        error: '',
        copied: false
      };
    default:
      return state;
  }
}

// 2. 自定義 Hook：URL 驗證
function useUrlValidation() {
  const isValidUrl = useCallback((url) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isValidCustomCode = useCallback((code) => {
    if (!code) return true; // 空值視為有效
    return /^[a-zA-Z0-9_-]{4,32}$/.test(code);
  }, []);

  return { isValidUrl, isValidCustomCode };
}

// 3. 自定義 Hook：認證管理
function useAuth() {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null
  });

  const login = useCallback((user, jwt) => {
    localStorage.setItem('chainy_jwt_token', jwt);
    localStorage.setItem('chainy_user_profile', JSON.stringify(user));
    setAuthState({ isAuthenticated: true, user });
  }, []);

  const logout = useCallback(() => {
    clearToken();
    clearUserProfile();
    setAuthState({ isAuthenticated: false, user: null });
  }, []);

  const checkAuthStatus = useCallback(() => {
    const isAuth = checkAuth();
    const user = getCurrentUser();
    setAuthState({ isAuthenticated: isAuth, user });
  }, []);

  return { ...authState, login, logout, checkAuthStatus };
}

// 4. 自定義 Hook：連結管理
function useLinksManagement(apiEndpoint, isAuthenticated) {
  const [linksState, setLinksState] = useState({
    linksList: [],
    isLoadingLinks: false,
    showLinksList: false
  });

  const resolveShortUrl = useCallback((link) => {
    if (!link) return '';
    const candidates = [link.short_url, link.shortUrl];
    const valid = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    if (valid) return valid;
    
    const base = 'https://chainy.luichu.dev';
    return link.code ? `${base}/${link.code}` : base;
  }, []);

  const fetchLinksList = useCallback(async () => {
    if (!isAuthenticated) return;

    setLinksState(prev => ({ ...prev, isLoadingLinks: true }));

    try {
      const currentUser = getCurrentUser();
      if (!currentUser?.userId) {
        throw new Error('User profile is missing. Please login again.');
      }

      const options = createAuthenticatedRequest({ method: 'GET' });
      const response = await fetchWithServiceStatusCheck(`${apiEndpoint}/links`, options, 'en');

      if (handleAuthError(response)) {
        throw new Error('Authentication expired. Please login again.');
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to fetch links');
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

      setLinksState(prev => ({ 
        ...prev, 
        linksList: sortedLinks, 
        isLoadingLinks: false 
      }));
    } catch (err) {
      logger.error('Error fetching links:', err);
      setLinksState(prev => ({ 
        ...prev, 
        isLoadingLinks: false 
      }));
      throw err;
    }
  }, [isAuthenticated, apiEndpoint, resolveShortUrl]);

  const toggleLinksList = useCallback(() => {
    setLinksState(prev => ({ 
      ...prev, 
      showLinksList: !prev.showLinksList 
    }));
  }, []);

  return {
    ...linksState,
    fetchLinksList,
    toggleLinksList
  };
}

// 5. 自定義 Hook：Google OAuth
function useGoogleAuth() {
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
        throw err;
      }
    };

    startOAuthRedirect();
  }, []);

  return { handleGoogleResponse };
}

// Loading Spinner Component
function LoadingSpinner({ size = 20 }) {
  return (
    <div
      className="inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animation: 'spin 1s ease-in-out infinite',
      }}
    />
  );
}

function App() {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { isValidUrl, isValidCustomCode } = useUrlValidation();
  const { isAuthenticated, user, login, logout, checkAuthStatus } = useAuth();
  const { linksList, isLoadingLinks, showLinksList, fetchLinksList, toggleLinksList } = useLinksManagement(API_ENDPOINT, isAuthenticated);
  const { handleGoogleResponse } = useGoogleAuth();

  const t = translations[state.language];

  // 驗證 URL 和自訂代碼
  const isValidUrlValue = isValidUrl(state.url);
  const isValidCustomCodeValue = isValidCustomCode(state.customCode);

  // 更新驗證狀態
  useEffect(() => {
    dispatch({
      type: 'SET_VALIDATION',
      payload: {
        isValidUrl: isValidUrlValue,
        isValidCustomCode: isValidCustomCodeValue
      }
    });
  }, [isValidUrlValue, isValidCustomCodeValue]);

  // 檢查認證狀態
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // OAuth 回調處理
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      logger.error('OAuth error:', error);
      dispatch({ type: 'SET_ERROR', payload: `登入失敗: ${error}` });
      return;
    }

    if (code && state && state.startsWith('google_auth')) {
      logger.debug('OAuth callback detected:', {
        code: code.substring(0, 20) + '...',
        state
      });

      const handleOAuthCallback = async () => {
        try {
          dispatch({ type: 'SET_LOGGING_IN', payload: true });
          dispatch({ type: 'SET_ERROR', payload: '' });

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

          login(data.user, data.jwt);
          sessionStorage.removeItem(`pkce_verifier_${state}`);
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (err) {
          logger.error('OAuth callback error:', err);
          dispatch({ type: 'SET_ERROR', payload: '登入失敗: ' + err.message });
        } finally {
          dispatch({ type: 'SET_LOGGING_IN', payload: false });
        }
      };

      handleOAuthCallback();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [login]);

  // 當用戶登入時自動載入連結
  useEffect(() => {
    if (isAuthenticated) {
      fetchLinksList();
    }
  }, [isAuthenticated, fetchLinksList]);

  // 處理表單提交
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isValidUrlValue || (state.customCode && !isValidCustomCodeValue)) {
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const requestBody = {
        url: state.url,
        ...(state.customCode && { customCode: state.customCode })
      };

      const options = isAuthenticated 
        ? createAuthenticatedRequest({ method: 'POST', body: JSON.stringify(requestBody) })
        : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) };

      const response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/create`, options, state.language);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create short URL');
      }

      const data = await response.json();
      dispatch({ type: 'SET_RESULT', payload: data });
      dispatch({ type: 'RESET_FORM' });

      if (isAuthenticated) {
        await fetchLinksList();
      }
    } catch (err) {
      logger.error('Error creating short URL:', err);
      dispatch({ type: 'SET_ERROR', payload: err.message || 'Failed to create short URL' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.url, state.customCode, state.language, isValidUrlValue, isValidCustomCodeValue, isAuthenticated, fetchLinksList]);

  // 複製到剪貼板
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      dispatch({ type: 'SET_COPIED', payload: true });
      setTimeout(() => dispatch({ type: 'SET_COPIED', payload: false }), 2000);
    } catch (err) {
      logger.error('Failed to copy to clipboard:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to copy to clipboard' });
    }
  }, []);

  // 複製連結
  const copyLink = useCallback((link) => {
    copyToClipboard(link.shortUrl);
    dispatch({ type: 'ADD_COPIED_LINK', payload: link.id });
  }, [copyToClipboard]);

  // 刪除連結
  const deleteLink = useCallback(async (linkId) => {
    try {
      const options = createAuthenticatedRequest({ method: 'DELETE' });
      const response = await fetch(`${API_ENDPOINT}/links/${linkId}`, options);

      if (!response.ok) {
        throw new Error('Failed to delete link');
      }

      await fetchLinksList();
    } catch (err) {
      logger.error('Error deleting link:', err);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete link' });
    }
  }, [fetchLinksList]);

  // 處理登出
  const handleLogout = useCallback(() => {
    logout();
    dispatch({ type: 'SET_LINKS_LIST', payload: [] });
    dispatch({ type: 'SET_SHOW_LINKS_LIST', payload: false });
  }, [logout]);

  // 處理服務狀態重試
  const handleServiceStatusRetry = useCallback(() => {
    dispatch({ type: 'SET_SERVICE_STATUS', payload: { showModal: false } });
    if (isAuthenticated) {
      fetchLinksList();
    }
  }, [isAuthenticated, fetchLinksList]);

  // 處理服務狀態關閉
  const handleServiceStatusDismiss = useCallback(() => {
    dispatch({ type: 'SET_SERVICE_STATUS', payload: { showModal: false } });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white animate-gradient bg-grid-pattern bg-crypto-pattern">
      {/* Language Selector */}
      <div className="absolute top-4 left-4 z-50">
        <div className="flex space-x-2">
          <button
            onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'zh' })}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover-lift ${
              state.language === 'zh' 
                ? 'bg-blue-600 text-white shadow-lg crypto-glow-blue' 
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover-glow'
            }`}
          >
            中文
          </button>
          <button
            onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: 'en' })}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 hover-lift ${
              state.language === 'en' 
                ? 'bg-blue-600 text-white shadow-lg crypto-glow-blue' 
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover-glow'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 pt-20">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="chainy-title text-6xl font-black mb-4 text-gradient animate-gradient-text animate-float">
            CHAINY
          </h1>
          <p className="text-xl text-gray-300 flex items-center justify-center gap-2 animate-slide-in-up">
            {t.subtitle}
            <span className="text-2xl animate-bounce">🚀</span>
          </p>
        </div>

        {/* User Profile */}
        {isAuthenticated && user && (
          <div className="flex justify-center mb-8 animate-slide-in-up">
            <div className="glass-effect rounded-2xl p-6 crypto-glow hover-lift">
              <div className="flex items-center space-x-4">
                <img
                  src={user.picture || 'https://via.placeholder.com/60'}
                  alt={user.name || 'User'}
                  className="w-15 h-15 rounded-full border-2 border-blue-400 shadow-lg"
                />
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-white">{user.name || 'User'}</h3>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-300 hover:text-white transition-colors duration-200"
                    title={t.logout}
                  >
                    {t.logout}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* URL Shortener Section */}
        <div className="max-w-4xl mx-auto">
          <div className="glass-effect rounded-3xl p-8 crypto-glow hover-lift animate-slide-in-up">
            <h2 className="text-3xl font-bold text-center mb-8 text-gradient-gold">
              {t.urlShortener}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label htmlFor="url" className="block text-sm font-medium text-gray-300 mb-2">
                  {t.targetUrl}
                </label>
                <input
                  id="url"
                  type="url"
                  value={state.url}
                  onChange={(e) => dispatch({ type: 'SET_URL', payload: e.target.value })}
                  placeholder={t.placeholder}
                  className={`w-full px-4 py-3 rounded-xl bg-white/10 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    !isValidUrlValue && state.url 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  required
                />
                {!isValidUrlValue && state.url && (
                  <span className="text-red-400 text-sm mt-1 block">{t.invalidUrl}</span>
                )}
              </div>

              {isAuthenticated && (
                <div className="form-group">
                  <label htmlFor="customCode" className="block text-sm font-medium text-gray-300 mb-2">
                    {t.customCode}
                  </label>
                  <input
                    id="customCode"
                    type="text"
                    value={state.customCode}
                    onChange={(e) => dispatch({ type: 'SET_CUSTOM_CODE', payload: e.target.value })}
                    placeholder={t.customCodePlaceholder}
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      !isValidCustomCodeValue && state.customCode 
                        ? 'border-red-500 bg-red-500/10' 
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  />
                  <p className="text-sm text-gray-400 mt-2">{t.customCodeHelp}</p>
                  {!isValidCustomCodeValue && state.customCode && (
                    <span className="text-red-400 text-sm mt-1 block">{t.invalidCustomCode}</span>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={state.isLoading || !isValidUrlValue || (state.customCode && !isValidCustomCodeValue)}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover-lift crypto-glow-blue animate-crypto-pulse"
              >
                {state.isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size={20} />
                    <span>{t.generating}</span>
                  </div>
                ) : (
                  t.generateShortUrl
                )}
              </button>
            </form>

            {/* Error Display */}
            {state.error && (
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-red-400 text-center">{state.error}</p>
                {(state.error.includes('Failed to fetch') || state.error.includes('Failed to retrieve')) && (
                  <button
                    onClick={() => fetchLinksList()}
                    disabled={isLoadingLinks}
                    className="mt-3 w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors duration-200"
                  >
                    {t.retry}
                  </button>
                )}
              </div>
            )}

            {/* Result Display */}
            {state.result && (
              <div className="mt-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl crypto-glow-emerald">
                <div className="text-center">
                  <p className="text-green-400 font-semibold mb-2">Short URL:</p>
                  <p className="text-white font-mono text-lg break-all">{state.result.shortUrl}</p>
                  <button
                    onClick={() => copyToClipboard(state.result.shortUrl)}
                    className="mt-4 py-2 px-6 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
                    disabled={state.copied}
                  >
                    {state.copied ? t.copied : t.copyLink}
                  </button>
                </div>
              </div>
            )}

            {/* Login Prompt */}
            {!isAuthenticated && (
              <div className="mt-8 text-center">
                <p className="text-gray-300 mb-4">{t.loginPrompt}</p>
                <button
                  onClick={handleGoogleResponse}
                  disabled={state.isLoggingIn}
                  className="py-3 px-6 bg-white text-gray-900 rounded-xl hover:bg-gray-100 disabled:opacity-50 transition-all duration-200 hover-lift font-semibold"
                >
                  {state.isLoggingIn ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size={16} />
                      <span>{t.signingIn}</span>
                    </div>
                  ) : (
                    t.signInWithGoogle
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* My Short Links */}
        {isAuthenticated && (
          <div className="max-w-4xl mx-auto mt-12">
            <div className="glass-effect rounded-3xl p-8 crypto-glow hover-lift animate-slide-in-up">
              <button
                onClick={toggleLinksList}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 hover-lift crypto-glow-purple"
              >
                <div className="flex items-center justify-center space-x-2">
                  <span>{t.myShortLinks}</span>
                  <span className="text-lg">
                    {showLinksList ? '▲' : '▼'}
                  </span>
                </div>
              </button>

              {showLinksList && (
                <div className="mt-8">
                  <h3 className="text-2xl font-bold text-center mb-6 text-gradient-gold">
                    {t.myLinks}
                  </h3>

                  {isLoadingLinks ? (
                    <div className="text-center py-8">
                      <LoadingSpinner size={32} />
                      <p className="text-gray-300 mt-4">{t.loading}</p>
                    </div>
                  ) : linksList.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-400 text-lg">{t.noLinks}</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {linksList.map((link) => (
                        <div key={link.id} className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-200 hover-lift">
                          <div className="flex flex-col space-y-4">
                            <div className="flex-1">
                              <h4 className="text-white font-semibold text-lg mb-2">
                                {link.title || link.target}
                              </h4>
                              <p className="text-blue-400 font-mono text-sm break-all mb-2">
                                {link.shortUrl}
                              </p>
                              <p className="text-gray-400 text-sm break-all">
                                {link.target}
                              </p>
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => copyLink(link)}
                                className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                                disabled={state.copiedLinks.has(link.id)}
                              >
                                {state.copiedLinks.has(link.id) ? t.copied : t.copyLink}
                              </button>
                              <button
                                onClick={() => deleteLink(link.id)}
                                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
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
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-16 py-8 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-gray-400 mb-2">{t.poweredBy}</p>
          <a 
            href="https://github.com/ChuLiYu" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 transition-colors duration-200 font-medium"
          >
            {t.github}
          </a>
        </div>
      </footer>

      {/* Service Status Components */}
      <ServiceStatusDisplay
        serviceStatus={state.serviceStatus}
        showModal={state.showServiceStatusModal}
        onRetry={handleServiceStatusRetry}
        onDismiss={handleServiceStatusDismiss}
      />
      <ServiceStatusBanner serviceStatus={state.serviceStatus} />
    </div>
  );
}

export default App;
