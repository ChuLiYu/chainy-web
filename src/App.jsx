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

// Debug: Test if App component is loading
logger.debug('App component is loading...');

// Debug: Test basic rendering
logger.debug('About to render App component');
import {
  authenticateWithGoogle
} from './utils/googleAuth.js';

const API_ENDPOINT = import.meta.env.VITE_CHAINY_API ?? 'https://9qwxcajqf9.execute-api.ap-northeast-1.amazonaws.com';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? 'YOUR_GOOGLE_CLIENT_ID_HERE';

// 調試：檢查環境變數載入
logger.debug('=== ENVIRONMENT VARIABLES DEBUG ===');
logger.debug('VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
logger.debug('VITE_CHAINY_API:', import.meta.env.VITE_CHAINY_API);
logger.debug('VITE_GOOGLE_REDIRECT_URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
logger.debug('GOOGLE_CLIENT_ID (resolved):', GOOGLE_CLIENT_ID);
logger.debug('All import.meta.env:', import.meta.env);
logger.debug('=== END DEBUG ===');
const PKCE_VERIFIER_PREFIX = 'google_pkce_verifier';

// 安全的重定向 URI 選擇函數
function getSecureRedirectUri() {
  logger.debug('=== REDIRECT URI DEBUG ===');
  logger.debug('Current origin:', window.location.origin);
  logger.debug('VITE_GOOGLE_REDIRECT_URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);

  // 1. 優先使用環境變數
  if (import.meta.env.VITE_GOOGLE_REDIRECT_URI) {
    logger.debug('Using environment variable redirect URI:', import.meta.env.VITE_GOOGLE_REDIRECT_URI);
    return import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  }

  // 2. 根據當前域名自動選擇
  const currentOrigin = window.location.origin;
  if (currentOrigin === 'https://chainy.luichu.dev') {
    logger.debug('Using production redirect URI:', 'https://chainy.luichu.dev');
    return 'https://chainy.luichu.dev';
  } else if (currentOrigin === 'http://localhost:3000' || currentOrigin === 'http://127.0.0.1:3000') {
    logger.debug('Using local development redirect URI:', 'http://localhost:3000');
    return 'http://localhost:3000';
  }

  // 3. 默認使用當前域名
  logger.debug('Using current origin as redirect URI:', currentOrigin);
  logger.debug('=== END REDIRECT URI DEBUG ===');
  return currentOrigin;
}

const GOOGLE_REDIRECT_URI = getSecureRedirectUri();

// Language translations
const translations = {
  zh: {
    title: 'CHAINY',
    slogan: '秒縮網址，WAGMI 🚀',
    subtitle: '短網址生成器',
    inputLabel: '目標網址',
    inputPlaceholder: 'https://your-website.com',
    validLabel: '✓ 有效',
    buttonGenerate: '生成短網址',
    buttonGenerating: '生成中...',
    successLabel: '生成成功',
    buttonCopy: '複製',
    buttonCopied: '已複製',
    buttonTest: '測試',
    buttonShowLinks: '我的短網址',
    buttonHideLinks: '隱藏列表',
    linksListTitle: '我的短網址',
    noLinks: '還沒有短網址',
    loginPrompt: '💡 登入後可自訂短網址代碼和管理連結',
    loginButton: '登入',
    logoutButton: '登出',
    logoutHint: '點擊登出',
    googleLoginButton: '使用 Google 登入',
    googleRedirectButton: '使用 Google 登入',
    customCodeLabel: '自訂代號（選填）',
    customCodePlaceholder: '例如: my-custom-link',
    customCodeHelper: '留空則自動生成隨機代號。格式：4-32個字母、數字、連字符或底線',
    customCodeValid: '✓ 格式正確',
    customCodeInvalid: '✗ 格式錯誤',
    customCodeError: '自訂代號格式不正確，請使用4-32個字母、數字、連字符或底線',
    noteLabel: '備注標題（選填）',
    notePlaceholder: '例如: 我的重要連結',
    noteHelper: '為這個短網址添加一個易記的標題，方便在列表中識別',
    copyError: '複製失敗，請手動複製',
    jwtMissing: '未收到有效的JWT token',
    googleLoginFailed: 'Google登錄失敗',
    loading: '載入中...',
    loggingIn: '登入中...',
    loadingLinks: '載入連結中...',
    retryButton: '重試',
    retryPrompt: '載入失敗，請重試',
    clicksLabel: '點擊',
    createdLabel: '創建時間',
    deleteButton: '刪除',
    deleteConfirm: '確定要刪除此短網址嗎？此操作無法復原。',
    footer: 'Powered by Chainy'
  },
  en: {
    title: 'CHAINY',
    slogan: 'Instant Links, WAGMI 🚀',
    subtitle: 'URL Shortener',
    inputLabel: 'Target URL',
    inputPlaceholder: 'https://your-website.com',
    validLabel: '✓ Valid',
    buttonGenerate: 'Generate Short URL',
    buttonGenerating: 'Generating...',
    successLabel: 'Success',
    buttonCopy: 'Copy',
    buttonCopied: 'Copied',
    buttonTest: 'Test',
    buttonShowLinks: 'My Links',
    buttonHideLinks: 'Hide List',
    linksListTitle: 'My Short Links',
    noLinks: 'No links yet',
    loginPrompt: '💡 Login to customize short codes and manage links',
    loginButton: 'Login',
    logoutButton: 'Logout',
    logoutHint: 'Click to sign out',
    googleLoginButton: 'Sign in with Google',
    googleRedirectButton: 'Sign in with Google ',
    customCodeLabel: 'Custom Code (optional)',
    customCodePlaceholder: 'e.g. my-custom-link',
    customCodeHelper: 'Leave blank to auto-generate a random code. Use 4-32 letters, numbers, hyphen or underscore.',
    customCodeValid: '✓ Format valid',
    customCodeInvalid: '✗ Invalid format',
    customCodeError: 'Custom code format is invalid. Use 4-32 letters, numbers, hyphen or underscore.',
    noteLabel: 'Note Title (optional)',
    notePlaceholder: 'e.g. My Important Link',
    noteHelper: 'Add a memorable title for this short URL to easily identify it in your list',
    copyError: 'Copy failed. Please copy manually.',
    jwtMissing: 'Missing valid JWT token.',
    googleLoginFailed: 'Google sign-in failed',
    loading: 'Loading...',
    loggingIn: 'Signing in...',
    loadingLinks: 'Loading links...',
    retryButton: 'Retry',
    retryPrompt: 'Loading failed, please retry',
    clicksLabel: 'Clicks',
    createdLabel: 'Created',
    deleteButton: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this short link? This action cannot be undone.',
    footer: 'Powered by Chainy'
  }
};

function App() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [language, setLanguage] = useState('en'); // Default to English
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [_user, setUser] = useState(null);
  const [showLinksList, setShowLinksList] = useState(false);
  const [linksList, setLinksList] = useState([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [_retryCount, setRetryCount] = useState(0);
  const [googleAuthReady, setGoogleAuthReady] = useState(false);
  const [copiedLinks, setCopiedLinks] = useState(new Set());
  const [customCode, setCustomCode] = useState('');
  const [isValidCustomCode, setIsValidCustomCode] = useState(false);
  const [note, setNote] = useState('');
  const [serviceStatus, setServiceStatus] = useState(null);
  const [showServiceStatusModal, setShowServiceStatusModal] = useState(false);

  const t = translations[language]; // Get current language translations

  // Define resolveShortUrl early to avoid initialization issues
  const resolveShortUrl = (link) => {
    if (!link) return '';

    // Prioritize backend-provided short_url
    const candidates = [link.short_url, link.shortUrl];
    const valid = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    if (valid) {
      return valid;
    }

    // Fallback: construct short URL using custom domain
    const base = 'https://chainy.luichu.dev';
    if (link.code) {
      return `${base}/${link.code}`;
    }

    return base;
  };

  // Define fetchLinksList early to avoid initialization issues
  const fetchLinksList = useCallback(async (retryAttempt = 0) => {
    if (!isAuthenticated) return;

    setIsLoadingLinks(true);
    setError('');

    try {
      const currentUser = getCurrentUser();

      if (!currentUser?.userId) {
        throw new Error('User profile is missing. Please login again.');
      }

      const options = createAuthenticatedRequest({
        method: 'GET',
      });
      const response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links`, options, language);

      if (handleAuthError(response)) {
        setIsAuthenticated(false);
        setUser(null);
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

      // Additional client-side sorting
      const sortedLinks = normalizedLinks.sort((a, b) => {
        // Sort by creation date (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setLinksList(sortedLinks);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      logger.error('Error fetching links:', err);

      // 檢查是否為服務狀態錯誤
      if (err.isServiceDown && err.serviceStatus) {
        setServiceStatus(err.serviceStatus);
        setShowServiceStatusModal(true);
        return;
      }

      // Retry logic for network errors
      if (retryAttempt < 2 && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed to fetch'))) {
        logger.debug(`Retrying fetchLinksList, attempt ${retryAttempt + 1}`);
        setTimeout(() => {
          fetchLinksList(retryAttempt + 1);
        }, 1000 * (retryAttempt + 1)); // Exponential backoff
        return;
      }

      setError(err.message || 'Failed to retrieve links');
      setRetryCount(retryAttempt);
    } finally {
      setIsLoadingLinks(false);
    }
  }, [isAuthenticated, language]);

  // Define Google login handlers early to avoid initialization issues
  const handleGoogleLogin = useCallback(async (googleResponse) => {
    setError('');
    setIsLoggingIn(true);

    try {
      // Determine token type based on the response
      const tokenType = googleResponse.tokenType || (googleResponse.credential && googleResponse.credential.startsWith('4/') ? 'code' : 'id_token');

      logger.debug('Google login response received', {
        tokenType,
        credentialLength: googleResponse.credential?.length,
        credentialPrefix: googleResponse.credential?.substring(0, 50),
        fullResponse: googleResponse
      });

      const redirectUri = tokenType === 'code' ? (GOOGLE_REDIRECT_URI || window.location.origin) : undefined;
      let codeVerifier;

      if (tokenType === 'code') {
        const stateKey = googleResponse.state && googleResponse.state.startsWith('google_auth')
          ? googleResponse.state
          : 'google_auth';
        const storageKey = `${PKCE_VERIFIER_PREFIX}_${stateKey}`;
        codeVerifier = sessionStorage.getItem(storageKey);
        logger.debug('Retrieved PKCE verifier', { storageKey, hasVerifier: !!codeVerifier });

        if (!codeVerifier) {
          throw new Error('Missing PKCE verifier for OAuth code exchange');
        }

        sessionStorage.removeItem(storageKey);
      }

      const authResult = await authenticateWithGoogle(googleResponse.credential, API_ENDPOINT, {
        tokenTypeHint: tokenType,
        redirectUri,
        codeVerifier,
      });

      if (authResult.jwt) {
        localStorage.setItem('chainy_jwt_token', authResult.jwt);
        localStorage.setItem('chainy_user_profile', JSON.stringify(authResult.user));
        setIsAuthenticated(true);
        setUser(authResult.user);
        setShowLinksList(true);
        await fetchLinksList();
      } else {
        throw new Error(t.jwtMissing);
      }
    } catch (error) {
      // 檢查是否為服務狀態錯誤
      if (error.isServiceDown && error.serviceStatus) {
        setServiceStatus(error.serviceStatus);
        setShowServiceStatusModal(true);
        setIsLoggingIn(false);
        return;
      }

      setError(error.message || t.googleLoginFailed);
    } finally {
      setIsLoggingIn(false);
    }
  }, [fetchLinksList, t.googleLoginFailed, t.jwtMissing]);

  const handleGoogleResponse = useCallback(() => {
    logger.debug('Google login button clicked - redirecting to OAuth 2.0 flow');

    // 直接執行 OAuth 重定向，不依賴其他函數
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
  }, [GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, logger, setError]);

  // 設置全局Google登錄處理器
  useEffect(() => {
    window.handleGoogleLogin = handleGoogleLogin;
    window.handleGoogleResponse = handleGoogleResponse;
  }, [handleGoogleLogin, handleGoogleResponse]);

  useEffect(() => {
    const urlPattern = /^https?:\/\/.+/;
    setIsValidUrl(urlPattern.test(url));
  }, [url]);

  // 監聽登入狀態變化，載入短網址列表
  useEffect(() => {
    if (isAuthenticated) {
      logger.debug('User authenticated, fetching links list');
      fetchLinksList();
    }
  }, [isAuthenticated, fetchLinksList]);

  useEffect(() => {
    // 驗證自訂代號：只允許字母、數字、連字符、底線，長度4-32字符
    const customCodePattern = /^[a-zA-Z0-9_-]{4,32}$/;
    setIsValidCustomCode(customCodePattern.test(customCode));
  }, [customCode]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  // Check authentication status on component mount
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

  // Pure OAuth 2.0 implementation - no GSI needed
  useEffect(() => {
    logger.debug('=== PURE OAUTH 2.0 INITIALIZATION ===');
    logger.debug('Initializing pure OAuth 2.0 flow...');
    logger.debug('GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
    logger.debug('GOOGLE_REDIRECT_URI:', GOOGLE_REDIRECT_URI);
    logger.debug('Current origin:', window.location.origin);

    // Set googleAuthReady immediately since we don't need to wait for GSI script
    setGoogleAuthReady(true);
    logger.debug('Pure OAuth 2.0 ready');
  }, []);

  // 檢查是否有來自獨立登入頁面的登入資訊
  useEffect(() => {
    const checkGoogleLogin = () => {
      const credential = localStorage.getItem('google_auth_credential');
      const timestamp = localStorage.getItem('google_auth_timestamp');

      if (credential && timestamp) {
        // 檢查 credential 是否在 5 分鐘內獲取
        const credentialAge = Date.now() - parseInt(timestamp);
        if (credentialAge < 300000) { // 5分鐘
          logger.debug('Found Google auth credential from login page');

          // 清除 localStorage
          localStorage.removeItem('google_auth_credential');
          localStorage.removeItem('google_auth_timestamp');

          // 處理登入
          handleGoogleLogin({ credential });
        } else {
          // 過期的 credential，清除
          localStorage.removeItem('google_auth_credential');
          localStorage.removeItem('google_auth_timestamp');
        }
      }
    };

    // 頁面載入時檢查
    checkGoogleLogin();

    // 監聽 storage 變化
    const handleStorageChange = (e) => {
      if (e.key === 'google_auth_credential') {
        checkGoogleLogin();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [handleGoogleLogin]);

  // Handle OAuth code returned on redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

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
          
          const requestBody = {
            googleToken: code,
            provider: 'google',
            tokenType: 'code',
            redirectUri: GOOGLE_REDIRECT_URI,
            codeVerifier: null // PKCE not implemented yet
          };
          
          logger.debug('Request body:', requestBody);
          logger.debug('Request URL:', `${API_ENDPOINT}/auth/google`);
          
          // Exchange code for token via backend
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
          
          // Store user info
          setUser(data.user);
          setIsAuthenticated(true);
          
          // Clear URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
        } catch (err) {
          logger.error('OAuth callback error:', err);
          setError('登入失敗: ' + err.message);
        } finally {
          setIsLoggingIn(false);
        }
      };

      handleOAuthCallback();

      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, [API_ENDPOINT, GOOGLE_REDIRECT_URI, logger, setIsAuthenticated, setIsLoggingIn, setError, setUser]);

  // Pure OAuth 2.0 - no GSI elements needed

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidUrl) return;

    // 如果已登入且填寫了自訂代號，需要驗證代號格式
    if (isAuthenticated && customCode && !isValidCustomCode) {
      setError(t.customCodeError);
      return;
    }

    setError('');
    setResult(null);
    setIsLoading(true);

    try {
      let response;

      if (isAuthenticated) {
        // Use authenticated request with custom code and note support
        const requestBody = { target: url };
        if (customCode && isValidCustomCode) {
          requestBody.code = customCode;
        }
        if (note && note.trim()) {
          requestBody.note = note.trim();
        }

        logger.debug('Request body', { requestBody });
        logger.debug('Custom code', { customCode });
        logger.debug('Is valid custom code', { isValidCustomCode });

        const options = createAuthenticatedRequest({
          method: 'POST',
          body: JSON.stringify(requestBody),
        });
        logger.debug('Request options', { options });
        response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links`, options, language);

        if (handleAuthError(response)) {
          setIsAuthenticated(false);
          setUser(null);
          throw new Error('Authentication expired. Please login again.');
        }
      } else {
        // Use anonymous endpoint for unauthenticated users
        response = await fetchWithServiceStatusCheck(`${API_ENDPOINT}/links/anonymous`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: url }),
        }, language);
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to create short URL');
      }

      const data = await response.json();
      const shortUrl = resolveShortUrl({ ...data, short_url: data.short_url });
      setResult({ ...data, shortUrl });
      setUrl('');
      setCustomCode(''); // Clear custom code
      setNote(''); // Clear note

      if (isAuthenticated) {
        setLinksList(prev => {
          const newLink = {
            code: data.code,
            target: data.target,
            shortUrl,
            short_url: shortUrl,
            clicks: data.clicks ?? 0,
            created_at: data.created_at,
            pinned: Boolean(data.pinned),
            owner: data.owner,
          };

          const filtered = prev.filter(link => link.code !== data.code);
          const updated = [newLink, ...filtered];

          return updated.sort((a, b) => {
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        });
      }
    } catch (err) {
      // 檢查是否為服務狀態錯誤
      if (err.isServiceDown && err.serviceStatus) {
        setServiceStatus(err.serviceStatus);
        setShowServiceStatusModal(true);
        return;
      }

      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.shortUrl);
    setCopied(true);
  };

  // 服務狀態處理函數
  const handleServiceStatusRetry = () => {
    setShowServiceStatusModal(false);
    setServiceStatus(null);
    // 重新嘗試當前操作
    if (isAuthenticated && showLinksList) {
      fetchLinksList();
    }
  };

  const handleServiceStatusDismiss = () => {
    setShowServiceStatusModal(false);
    setServiceStatus(null);
  };

  const base64UrlEncode = (buffer) => btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const generateRandomString = (length) => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => charset[byte % charset.length]).join('');
  };

  const createPkcePair = async () => {
    const verifier = generateRandomString(128);
    const digest = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
    const challenge = base64UrlEncode(digest);
    return { verifier, challenge };
  };

  // Loading animation component
  const LoadingSpinner = ({ size = 20, color = 'rgba(59, 130, 246, 0.8)' }) => (
    <div
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${color}20`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}
    />
  );

  // Skeleton loading component for links
  const SkeletonLink = () => (
    <div
      style={{
        padding: '16px',
        backgroundColor: 'rgba(2, 6, 23, 0.6)',
        borderRadius: '12px',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        marginBottom: '12px',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}
    >
      <div
        style={{
          height: '20px',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderRadius: '4px',
          marginBottom: '8px',
          width: '60%'
        }}
      />
      <div
        style={{
          height: '16px',
          backgroundColor: 'rgba(59, 130, 246, 0.15)',
          borderRadius: '4px',
          width: '40%'
        }}
      />
    </div>
  );

  const handleToggleLinksList = () => {
    if (!isAuthenticated) return;

    if (!showLinksList) {
      fetchLinksList();
    }

    setShowLinksList(prev => !prev);
  };

  const renderLinksContent = () => {
    if (isLoadingLinks) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '20px',
          color: 'rgba(203, 213, 225, 0.8)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '20px'
          }}>
            <LoadingSpinner size={24} />
            <span style={{ fontSize: '0.9rem' }}>{t.loadingLinks}</span>
          </div>

          {/* Skeleton loading for links */}
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <SkeletonLink />
            <SkeletonLink />
            <SkeletonLink />
          </div>
        </div>
      );
    }

    if (linksList.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: 'rgba(203, 213, 225, 0.8)'
        }}>
          {t.noLinks}
        </div>
      );
    }

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {linksList.map((link) => (
          <div
            key={link.code}
            style={{
              backgroundColor: 'rgba(2, 6, 23, 0.8)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              transition: 'all 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(51, 65, 85, 0.5)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div style={{ flex: 1 }}>
                {/* Show note as title if available */}
                {link.note && (
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#a855f7',
                    fontWeight: '600',
                    marginBottom: '8px',
                    wordBreak: 'break-word'
                  }}>
                    📝 {link.note}
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <a
                    href={resolveShortUrl(link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: '0.875rem',
                      color: '#60a5fa',
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                      textDecoration: 'none',
                      flex: 1,
                      transition: 'color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#60a5fa';
                    }}
                  >
                    {resolveShortUrl(link)}
                  </a>
                  <button
                    onClick={() => handleCopyLink(link)}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '6px',
                      padding: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '32px',
                      height: '32px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                    }}
                    title={copiedLinks.has(link.code) ? t.buttonCopied : t.buttonCopy}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={copiedLinks.has(link.code) ? '#10b981' : '#60a5fa'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {copiedLinks.has(link.code) ? (
                        <path d="M20 6L9 17l-5-5" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: 'rgba(203, 213, 225, 0.8)',
                  wordBreak: 'break-all'
                }}>
                  → {link.target}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: 'rgba(148, 163, 184, 0.8)'
            }}>
              <div>
                {`${t.clicksLabel}: ${link.clicks || 0} | ${t.createdLabel}: ${new Date(link.created_at).toLocaleDateString()}`}
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleCopyLink(link)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: copiedLinks.has(link.code) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)',
                    border: `1px solid ${copiedLinks.has(link.code) ? 'rgba(16, 185, 129, 0.5)' : 'rgba(16, 185, 129, 0.3)'}`,
                    borderRadius: '6px',
                    color: '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(16, 185, 129, 0.25)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = copiedLinks.has(link.code) ? 'rgba(16, 185, 129, 0.25)' : 'rgba(16, 185, 129, 0.15)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  {copiedLinks.has(link.code) ? `✓ ${t.buttonCopied}` : t.buttonCopy}
                </button>
                <button
                  onClick={() => handleDeleteLink(link.code)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.25)';
                    e.target.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                    e.target.style.transform = 'scale(1)';
                  }}
                >
                  🗑️ {t.deleteButton}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };




  const handleCopyLink = async (link) => {
    const shortUrl = resolveShortUrl(link);
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedLinks(prev => new Set([...prev, link.code]));

      // Clear the copied state after 2 seconds
      setTimeout(() => {
        setCopiedLinks(prev => {
          const newSet = new Set(prev);
          newSet.delete(link.code);
          return newSet;
        });
      }, 2000);
    } catch (err) {
      logger.error('Failed to copy:', err);
      setError(t.copyError);
    }
  };

  const handleDeleteLink = async (code) => {
    if (!isAuthenticated) return;

    if (!confirm(t.deleteConfirm)) {
      return;
    }

    try {
      const options = createAuthenticatedRequest({
        method: 'DELETE',
      });
      const response = await fetch(`${API_ENDPOINT}/links/${code}`, options);

      if (handleAuthError(response)) {
        setIsAuthenticated(false);
        setUser(null);
        throw new Error('Authentication expired. Please login again.');
      }

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to delete link');
      }

      // Remove the link from the local state
      setLinksList(prev => prev.filter(link => link.code !== code));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 25%, #312e81 50%, #1e1b4b 75%, #0f172a 100%)',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '48px 16px',
        position: 'relative'
      }}
    >
      {/* Background gradient orbs */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '300px',
            height: '300px',
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            borderRadius: '9999px',
            filter: 'blur(80px)',
            animation: 'float 6s ease-in-out infinite'
          }}
        ></div>
        <div
          style={{
            position: 'absolute',
            top: '10%',
            right: '10%',
            width: '300px',
            height: '300px',
            backgroundColor: 'rgba(168, 85, 247, 0.15)',
            borderRadius: '9999px',
            filter: 'blur(80px)',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '-3s'
          }}
        ></div>
      </div>

      {/* Top left controls - Google Avatar */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Google Avatar - Only show when authenticated */}
        {isAuthenticated && _user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              borderRadius: '16px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => {
              // 點擊頭像可以登出 - 清除所有狀態回到初始狀態
              setIsAuthenticated(false);
              setUser(null);
              setShowLinksList(false);
              setLinksList([]);
              setCopiedLinks(new Set());
              setCustomCode('');
              setIsValidCustomCode(false);
              setNote('');
              setError('');
              setResult(null);
              setCopied(false);
              setIsLoggingIn(false);
              clearToken();
              clearUserProfile();

              // 清除 localStorage 中的其他相關資料
              localStorage.removeItem('chainy_jwt_token');
              localStorage.removeItem('chainy_user_profile');
              localStorage.removeItem('chainy_links_list');
              localStorage.removeItem('chainy_custom_code');
              localStorage.removeItem('chainy_note');

              // 清除 sessionStorage 中的相關資料
              sessionStorage.clear();

              logger.info('User logged out successfully, all state cleared');
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.3)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <img
              src={_user.picture || 'https://via.placeholder.com/40'}
              alt={_user.name || 'User'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: '2px solid rgba(96, 165, 250, 0.3)'
              }}
            />
            <div>
              <div style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: 'white',
                marginBottom: '2px'
              }}>
                {_user.name || 'User'}
              </div>
              <div style={{
                fontSize: '0.75rem',
                color: 'rgba(148, 163, 184, 0.8)'
              }}>
                {t.logoutHint}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Top right controls */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {/* Language toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            borderRadius: '12px',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(20px)'
          }}
        >
          <button
            onClick={() => setLanguage('zh')}
            style={{
              padding: '6px 12px',
              backgroundColor: language === 'zh' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: language === 'zh' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            中文
          </button>
          <span style={{ color: '#64748b', fontSize: '0.75rem' }}>|</span>
          <button
            onClick={() => setLanguage('en')}
            style={{
              padding: '6px 12px',
              backgroundColor: language === 'en' ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              border: 'none',
              borderRadius: '8px',
              color: language === 'en' ? '#60a5fa' : '#94a3b8',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            EN
          </button>
        </div>
      </div>

      {/* Main content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '700px',
          margin: '0 auto',
          padding: '120px 24px 0 24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        {/* Title section */}
        <div
          style={{
            textAlign: 'center',
            marginBottom: '40px',
            animation: 'slideInUp 0.8s ease-out forwards'
          }}
        >
          <h1
            className="chainy-title"
            style={{
              fontSize: '6rem',
              fontWeight: '900',
              marginBottom: '20px',
              letterSpacing: '-0.05em',
              background: 'linear-gradient(to right, #60a5fa, #a855f7, #ec4899, #a855f7, #60a5fa)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradient 3s ease infinite',
              textShadow: '0 0 40px rgba(168, 85, 247, 0.5)',
              lineHeight: '0.9'
            }}
          >
            {t.title}
          </h1>
          <p style={{
            fontSize: '1.75rem',
            color: 'white',
            marginBottom: '12px',
            fontWeight: '600',
            textShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
            letterSpacing: '0.05em'
          }}>{t.slogan}</p>
          <p style={{
            color: 'rgba(203, 213, 225, 0.8)',
            fontSize: '1rem',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            fontWeight: '500'
          }}>{t.subtitle}</p>
        </div>

        {/* Main card */}
        <div
          style={{
            position: 'relative',
            borderRadius: '24px',
            padding: '36px',
            backgroundColor: 'rgba(15, 23, 42, 0.72)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(96, 165, 250, 0.22)',
            boxShadow: '0 30px 60px -20px rgba(15, 23, 42, 0.6)',
            animation: 'slideInUp 0.8s ease-out 0.2s forwards',
            transition: 'all 0.5s ease',
            width: '100%',
            maxWidth: '640px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.2)';
            e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(168, 85, 247, 0.1)';
          }}
        >
          {/* Top decorative line */}
          <div
            className="absolute top-0 left-1/4 right-1/4"
            style={{
              height: '1px',
              background: 'linear-gradient(to right, transparent, #60a5fa, #a855f7, transparent)'
            }}
          ></div>


          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* Input field section */}
            <div>
              <div style={{
                marginTop: '24px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <label style={{
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: 'rgba(203, 213, 225, 0.9)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em'
                }}>
                  {t.inputLabel}
                </label>
                {isValidUrl && url && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#10b981',
                    fontFamily: 'monospace',
                    fontWeight: 'bold'
                  }}>{t.validLabel}</span>
                )}
              </div>

              <input
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={t.inputPlaceholder}
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(2, 6, 23, 0.9)',
                  border: '2px solid rgba(96, 165, 250, 0.3)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  fontSize: '16px',
                  color: 'white',
                  outline: 'none',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                onMouseEnter={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                    e.target.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (document.activeElement !== e.target) {
                    e.target.style.borderColor = 'rgba(51, 65, 85, 0.5)';
                    e.target.style.transform = 'translateY(0)';
                  }
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#a855f7';
                  e.target.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.15), 0 10px 25px rgba(168, 85, 247, 0.2)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(51, 65, 85, 0.5)';
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              />
            </div>

            {/* Custom Code Input - Only show when authenticated */}
            {isAuthenticated && (
              <div>
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'rgba(203, 213, 225, 0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    {t.customCodeLabel}
                  </label>
                  {customCode && isValidCustomCode && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#10b981',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}>{t.customCodeValid}</span>
                  )}
                  {customCode && !isValidCustomCode && (
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#ef4444',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}>{t.customCodeInvalid}</span>
                  )}
                </div>

                <input
                  type="text"
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder={t.customCodePlaceholder}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                    border: `2px solid ${customCode && !isValidCustomCode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(96, 165, 250, 0.3)'}`,
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = customCode && !isValidCustomCode ? 'rgba(239, 68, 68, 0.7)' : 'rgba(168, 85, 247, 0.5)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = customCode && !isValidCustomCode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(51, 65, 85, 0.5)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = customCode && !isValidCustomCode ? '#ef4444' : '#a855f7';
                    e.target.style.boxShadow = customCode && !isValidCustomCode
                      ? '0 0 0 4px rgba(239, 68, 68, 0.15), 0 10px 25px rgba(239, 68, 68, 0.2)'
                      : '0 0 0 4px rgba(168, 85, 247, 0.15), 0 10px 25px rgba(168, 85, 247, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = customCode && !isValidCustomCode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(51, 65, 85, 0.5)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />

                <div style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  color: 'rgba(148, 163, 184, 0.8)',
                  fontStyle: 'italic'
                }}>
                  {t.customCodeHelper}
                </div>
              </div>
            )}

            {/* Note Input - Only show when authenticated */}
            {isAuthenticated && (
              <div>
                <div style={{
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <label style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: 'rgba(203, 213, 225, 0.9)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    {t.noteLabel}
                  </label>
                </div>

                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t.notePlaceholder}
                  style={{
                    width: '100%',
                    backgroundColor: 'rgba(2, 6, 23, 0.9)',
                    border: '2px solid rgba(96, 165, 250, 0.3)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    color: 'white',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  onMouseEnter={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                      e.target.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (document.activeElement !== e.target) {
                      e.target.style.borderColor = 'rgba(51, 65, 85, 0.5)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#a855f7';
                    e.target.style.boxShadow = '0 0 0 4px rgba(168, 85, 247, 0.15), 0 10px 25px rgba(168, 85, 247, 0.2)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = 'rgba(51, 65, 85, 0.5)';
                    e.target.style.boxShadow = 'none';
                    e.target.style.transform = 'translateY(0)';
                  }}
                />

                <div style={{
                  marginTop: '8px',
                  fontSize: '0.75rem',
                  color: 'rgba(148, 163, 184, 0.8)',
                  fontStyle: 'italic'
                }}>
                  {t.noteHelper}
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !isValidUrl}
              style={{
                width: '100%',
                background: 'linear-gradient(to right, #1e40af, #7c3aed, #be185d, #7c3aed, #1e40af)',
                backgroundSize: '300% auto',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: 'none',
                cursor: isLoading || !isValidUrl ? 'not-allowed' : 'pointer',
                opacity: isLoading || !isValidUrl ? '0.4' : '1',
                transition: 'all 0.3s ease',
                position: 'relative',
                overflow: 'hidden',
                animation: 'gradient 3s ease infinite'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && isValidUrl) {
                  e.target.style.transform = 'scale(1.02)';
                  e.target.style.boxShadow = '0 10px 40px rgba(168, 85, 247, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.boxShadow = 'none';
              }}
              onMouseDown={(e) => {
                if (!isLoading && isValidUrl) {
                  e.target.style.transform = 'scale(0.98)';
                }
              }}
              onMouseUp={(e) => {
                if (!isLoading && isValidUrl) {
                  e.target.style.transform = 'scale(1.02)';
                }
              }}
            >
              {isLoading ? t.buttonGenerating : t.buttonGenerate}
            </button>

            {/* Error message */}
            {error && (
              <div
                style={{
                  borderRadius: '12px',
                  padding: '16px',
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  animation: 'fadeIn 0.6s ease-out forwards'
                }}
              >
                <p style={{
                  color: 'rgb(248, 113, 113)',
                  fontSize: '0.875rem',
                  margin: '0 0 12px 0'
                }}>{error}</p>

                {/* Retry button for link loading errors */}
                {error.includes('Failed to fetch') || error.includes('Failed to retrieve') ? (
                  <button
                    onClick={() => fetchLinksList()}
                    disabled={isLoadingLinks}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '8px',
                      color: 'rgb(59, 130, 246)',
                      fontSize: '0.875rem',
                      cursor: isLoadingLinks ? 'not-allowed' : 'pointer',
                      opacity: isLoadingLinks ? 0.6 : 1,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoadingLinks) {
                        e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoadingLinks) {
                        e.target.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      }
                    }}
                  >
                    {isLoadingLinks ? (
                      <>
                        <LoadingSpinner size={14} color="rgb(59, 130, 246)" />
                        <span>{t.loadingLinks}</span>
                      </>
                    ) : (
                      <>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
                        </svg>
                        <span>{t.retryButton}</span>
                      </>
                    )}
                  </button>
                ) : null}
              </div>
            )}
          </form>

          {/* Google登錄按鈕 - 只在未登入時顯示 */}
          {!isAuthenticated && googleAuthReady && (
            <div
              style={{
                marginTop: '24px',
                padding: '20px',
                backgroundColor: 'rgba(2, 6, 23, 0.6)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                textAlign: 'center'
              }}
            >
              <p style={{
                color: 'rgba(203, 213, 225, 0.8)',
                fontSize: '0.875rem',
                margin: '0 0 16px 0',
                fontWeight: '500'
              }}>
                {t.loginPrompt}
              </p>

              {/* Google Sign-In Button - 重定向登入 */}
              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <button
                  onClick={handleGoogleResponse}
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
                    transition: 'all 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    opacity: isLoggingIn ? 0.7 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoggingIn) {
                      e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                      e.target.style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoggingIn) {
                      e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                      e.target.style.transform = 'translateY(0)';
                    }
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <LoadingSpinner size={16} color="#9ca3af" />
                      <span>{t.loggingIn}</span>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      {t.googleRedirectButton}
                    </>
                  )}
                </button>
              </div>
              <p style={{
                color: 'rgba(148, 163, 184, 0.7)',
                fontSize: '0.75rem',
                margin: '12px 0 0 0'
              }}>
              </p>
            </div>
          )}

          {/* Result display */}
          {result && (
            <div
              style={{
                marginTop: '32px',
                paddingTop: '32px',
                borderTop: '1px solid rgba(51, 65, 85, 0.5)',
                animation: 'fadeIn 0.6s ease-out forwards'
              }}
            >
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '9999px',
                      backgroundColor: '#10b981',
                      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                    }}
                  ></div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>{t.successLabel}</span>
                </div>

                <div
                  style={{
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    backgroundColor: 'rgba(2, 6, 23, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }}
                >
                  <a
                    href={result.shortUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#60a5fa',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem',
                      wordBreak: 'break-all',
                      transition: 'color 0.2s ease',
                      textDecoration: 'none',
                      flex: 1
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.color = '#93c5fd';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.color = '#60a5fa';
                    }}
                  >
                    {result.shortUrl}
                  </a>
                  <button
                    onClick={handleCopy}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '6px',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: '36px',
                      height: '36px'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = 'rgba(96, 165, 250, 0.1)';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.borderColor = 'rgba(96, 165, 250, 0.3)';
                    }}
                    title={copied ? t.buttonCopied : t.buttonCopy}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={copied ? '#10b981' : '#60a5fa'}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {copied ? (
                        <path d="M20 6L9 17l-5-5" />
                      ) : (
                        <>
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px'
              }}>
                <button
                  onClick={handleCopy}
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.backgroundColor = '#10b981';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.backgroundColor = '#059669';
                  }}
                  onMouseDown={(e) => {
                    e.target.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                >
                  {copied ? t.buttonCopied : t.buttonCopy}
                </button>

                <a
                  href={result.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    textAlign: 'center',
                    textDecoration: 'none',
                    color: 'white',
                    display: 'block',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                    e.target.style.backgroundColor = 'rgb(51, 65, 85)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'scale(1)';
                    e.target.style.backgroundColor = 'rgb(30, 41, 59)';
                  }}
                  onMouseDown={(e) => {
                    e.target.style.transform = 'scale(0.95)';
                  }}
                  onMouseUp={(e) => {
                    e.target.style.transform = 'scale(1.05)';
                  }}
                >
                  {t.buttonTest}
                </a>
              </div>
            </div>
          )}
        </div>

        {isAuthenticated && (
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              marginTop: '36px',
              borderRadius: '24px',
              backgroundColor: 'rgba(15, 23, 42, 0.72)',
              border: '1px solid rgba(96, 165, 250, 0.22)',
              backdropFilter: 'blur(24px)',
              boxShadow: showLinksList
                ? '0 28px 60px -20px rgba(99, 102, 241, 0.35)'
                : '0 18px 40px -18px rgba(15, 23, 42, 0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            <button
              type="button"
              onClick={handleToggleLinksList}
              aria-expanded={showLinksList}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '4px'
                }}>
                  {t.linksListTitle}
                </div>
                <div style={{
                  fontSize: '0.8125rem',
                  color: 'rgba(226, 232, 240, 0.75)'
                }}>
                  {showLinksList
                    ? t.buttonHideLinks
                    : `${t.buttonShowLinks}${linksList.length > 0 ? ` · ${linksList.length}` : ''}`}
                </div>
              </div>
              <span
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'rgba(255, 255, 255, 0.85)',
                  transform: showLinksList ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s ease'
                }}
              >
                ⌃
              </span>
            </button>

            <div
              style={{
                maxHeight: showLinksList ? '1000px' : '0px',
                transition: 'max-height 0.4s ease',
                overflow: 'hidden',
                padding: showLinksList ? '0 24px 24px 24px' : '0 24px',
                opacity: showLinksList ? 1 : 0,
                pointerEvents: showLinksList ? 'auto' : 'none'
              }}
            >
              {showLinksList ? renderLinksContent() : null}
            </div>
          </div>
        )}


        {/* Footer */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '24px',
            color: 'rgb(71, 85, 105)',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            animation: 'slideInUp 0.8s ease-out 0.4s forwards',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span>{t.footer}</span>
          <a
            href="https://github.com/ChuLiYu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              color: 'rgb(71, 85, 105)',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
              padding: '2px 4px',
              borderRadius: '4px',
              marginLeft: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.color = '#333';
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.color = 'rgb(71, 85, 105)';
              e.target.style.backgroundColor = 'transparent';
            }}
            title="View on GitHub"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              style={{
                marginRight: '4px'
              }}
            >
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>

        {/* Google Auth Test Component - 暫時禁用 */}
        {/* <SimpleTest />
        <GoogleAuthTest /> */}
      </div>

      {/* 服務狀態顯示組件 */}
      {showServiceStatusModal && serviceStatus && (
        <ServiceStatusDisplay
          serviceStatus={serviceStatus}
          language={language}
          onRetry={handleServiceStatusRetry}
          onDismiss={handleServiceStatusDismiss}
        />
      )}
    </div>
  );
}

export default App;
