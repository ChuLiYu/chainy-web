/**
 * Google OAuth 2.0 Authentication Utility (Responsive)
 * 
 * Provides responsive Google sign-in integration following Google's best practices
 * for mobile and desktop experiences.
 */

import { createLogger } from './logger.js';

// Initialize logger for Google Auth utilities
const logger = createLogger('googleAuth');

// Google OAuth 2.0 configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

/**
 * Detect device type for optimal UX mode selection
 */
function getDeviceType() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTablet = /iPad|Android/i.test(navigator.userAgent) && window.innerWidth >= 768;
    const isDesktop = !isMobile && !isTablet;

    return { isMobile, isTablet, isDesktop };
}

/**
 * Get optimal UX mode based on device type
 */
function getOptimalUxMode() {
    const { isMobile, isTablet } = getDeviceType();
    // Mobile and tablet use redirect to avoid popup blockers
    // Desktop uses popup for better UX
    return (isMobile || isTablet) ? 'redirect' : 'popup';
}


/**
 * Initialize Google OAuth 2.0 with responsive configuration
 */
export function initializeGoogleAuth() {
    return new Promise((resolve, reject) => {
        logger.debug('Initializing Responsive Google Auth');
        logger.debug('GOOGLE_CLIENT_ID', { clientId: GOOGLE_CLIENT_ID });

        // 檢查Client ID是否有效
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.length < 10) {
            logger.error('Invalid Google Client ID', { clientId: GOOGLE_CLIENT_ID });
            reject(new Error('Invalid Google Client ID'));
            return;
        }

        // 檢查是否已經初始化
        if (window.googleAuthInitialized) {
            logger.debug('Google Auth already initialized, skipping');
            resolve();
            return;
        }

        if (window.google && window.google.accounts) {
            logger.debug('Google already loaded');
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;

        script.onload = () => {
            logger.debug('Google script loaded');
            if (window.google && window.google.accounts) {
                const uxMode = getOptimalUxMode();
                const deviceType = getDeviceType();

                logger.debug('Device type and UX mode', { deviceType, uxMode });

                const config = {
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false,
                    cancel_on_tap_outside: true
                };

                try {
                    window.google.accounts.id.initialize(config);
                    logger.debug('Google accounts initialized with responsive config');
                } catch (error) {
                    logger.error('Failed to initialize Google accounts', { error: error.message });
                    reject(error);
                    return;
                }

                // Prepare Sign-In Button as fallback
                setTimeout(() => {
                    const container = document.getElementById('google-signin-button');
                    if (container) {
                        try {
                            window.google.accounts.id.renderButton(container, {
                                theme: 'outline',
                                size: 'large',
                                text: 'signin_with',
                                shape: 'rectangular',
                                width: 300,
                                logo_alignment: 'left'
                            });
                            logger.debug('Google Sign-In Button rendered');
                        } catch (error) {
                            logger.warn('Failed to render Google Sign-In Button', { error: error.message });
                        }
                    }
                }, 100);

                resolve();
            } else {
                logger.error('Failed to load Google OAuth library');
                reject(new Error('Failed to load Google OAuth library'));
            }
        };
        script.onerror = () => {
            logger.error('Failed to load Google OAuth script');
            reject(new Error('Failed to load Google OAuth script'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Handle the Google sign-in response
 * @param {Object} response - Google OAuth response
 */
function handleGoogleResponse(response) {
    logger.debug('Google login response', { response });

    // The React App component handles the sign-in logic.
    if (window.handleGoogleLogin) {
        window.handleGoogleLogin(response);
    }
}

/**
 * Trigger Google sign-in using responsive UX mode
 */
export function triggerGoogleLogin() {
    logger.debug('triggerGoogleLogin called');
    logger.debug('GOOGLE_CLIENT_ID', { clientId: GOOGLE_CLIENT_ID });

    if (!GOOGLE_CLIENT_ID) {
        logger.error('Google Client ID not configured');
        return;
    }

    try {
        // Check if Google Identity Services is loaded
        if (!window.google || !window.google.accounts) {
            logger.error('Google Identity Services not loaded');
            alert('Google 登錄服務未載入。請重新整理頁面後重試。');
            return;
        }

        const uxMode = getOptimalUxMode();
        const deviceType = getDeviceType();

        logger.debug('Device type and UX mode', { deviceType, uxMode });

        // Initialize with responsive configuration
        const config = {
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true
        };

        window.google.accounts.id.initialize(config);

        if (uxMode === 'popup') {
            // Try One Tap for desktop
            window.google.accounts.id.prompt((notification) => {
                logger.debug('One Tap notification', { notification });

                if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                    logger.debug('One Tap not displayed, clicking Sign-In Button');

                    // Fallback to clicking the rendered button
                    const buttonContainer = document.getElementById('google-signin-button');
                    if (buttonContainer && buttonContainer.querySelector('div[role="button"]')) {
                        buttonContainer.querySelector('div[role="button"]').click();
                    } else {
                        logger.warn('Google Sign-In Button not found');
                        alert('Google 登錄按鈕未找到。請重新整理頁面。');
                    }
                }
            });
        } else {
            // For mobile/tablet, trigger redirect directly
            logger.debug('Triggering redirect for mobile/tablet');
            window.google.accounts.id.prompt();
        }

    } catch (error) {
        logger.error('Error with Google Identity Services', { error: error.message });
        alert('Google 登錄服務錯誤。請檢查設定。');
    }
}

/**
 * Exchange OAuth code for ID token
 */

/**
 * Authenticate against the backend with the Google ID token
 * @param {string} googleToken - Google ID Token
 * @param {string} apiEndpoint - API endpoint
 * @returns {Promise<Object>} Authentication result
 */
export async function authenticateWithGoogle(googleToken, apiEndpoint, options = {}) {
    try {
        logger.debug('Authenticating with Google token/code', { tokenPrefix: googleToken.substring(0, 20) + '...' });

        const { tokenTypeHint, redirectUri, codeVerifier } = options;

        const response = await fetch(`${apiEndpoint}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                googleToken,
                provider: 'google',
                tokenType: tokenTypeHint || 'id_token', // Google Identity Services always returns ID tokens
                redirectUri,
                ...(codeVerifier ? { codeVerifier } : {})
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            logger.error('Backend authentication failed', { error: error.message });
            throw new Error(error.message || 'Google authentication failed');
        }

        const data = await response.json();
        logger.debug('Authentication successful', { data });
        return data;
    } catch (error) {
        logger.error('Google auth error', { error: error.message });
        throw error;
    }
}

/**
 * Check whether Google OAuth is available
 * @returns {boolean} Whether it is available
 */
export function isGoogleAuthAvailable() {
    return !!GOOGLE_CLIENT_ID && !!window.google && !!window.google.accounts;
}

/**
 * Sign out of the Google account
 */
export function signOutGoogle() {
    if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
    }
}

/**
 * Render the Google sign-in button markup
 * @param {string} elementId - Button container element ID
 */
export function createGoogleButton(elementId) {
    const container = document.getElementById(elementId);
    if (!container) return;

    container.innerHTML = `
    <div id="g_id_onload"
         data-client_id="${GOOGLE_CLIENT_ID}"
         data-callback="handleGoogleResponse"
         data-auto_prompt="false">
    </div>
    <div class="g_id_signin"
         data-type="standard"
         data-size="large"
         data-theme="outline"
         data-text="sign_in_with"
         data-shape="rectangular"
         data-logo_alignment="left">
    </div>
  `;
}
