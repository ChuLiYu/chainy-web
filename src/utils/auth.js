/**
 * JWT Authentication Utility
 * 
 * 為 Chainy API 提供簡單的 JWT 認證功能
 */

import { createLogger } from './logger.js';

// Initialize logger for auth utilities
const logger = createLogger('auth');

const TOKEN_STORAGE_KEY = 'chainy_jwt_token';
const USER_STORAGE_KEY = 'chainy_user_profile';

/**
 * 儲存 JWT Token 到 localStorage
 * @param {string} token - JWT token
 */
export function saveToken(token) {
    if (!token) {
        throw new Error('Token is required');
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function saveUserProfile(profile) {
    if (!profile) {
        return;
    }
    try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
        logger.warn('Failed to persist user profile', { error: error.message });
    }
}

/**
 * 從 localStorage 讀取 JWT Token
 * @returns {string|null} JWT token 或 null
 */
export function getToken() {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

/**
 * 從 localStorage 移除 JWT Token
 */
export function clearToken() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
}

export function clearUserProfile() {
    localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * 檢查是否已登入（有 token）
 * @returns {boolean} 是否已登入
 */
export function isAuthenticated() {
    const token = getToken();
    if (!token) {
        return false;
    }

    try {
        // 簡單檢查 token 是否過期
        const payload = parseJwtPayload(token);
        if (payload.exp) {
            const expirationTime = payload.exp * 1000; // 轉換為毫秒
            return Date.now() < expirationTime;
        }
        return true;
    } catch (error) {
        logger.warn('Error checking authentication', { error: error.message });
        return false;
    }
}

/**
 * 解析 JWT Token 的 payload
 * @param {string} token - JWT token
 * @returns {object} Decoded payload
 */
export function parseJwtPayload(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        throw new Error('Invalid JWT token');
    }
}

/**
 * 獲取當前用戶信息
 * @returns {object|null} 用戶信息或 null
 */
export function getCurrentUser() {
    const storedProfile = localStorage.getItem(USER_STORAGE_KEY);
    if (storedProfile) {
        try {
            return JSON.parse(storedProfile);
        } catch (error) {
            logger.warn('Failed to parse stored user profile', { error: error.message });
            localStorage.removeItem(USER_STORAGE_KEY);
        }
    }

    const token = getToken();
    if (!token || !isAuthenticated()) {
        return null;
    }

    try {
        const payload = parseJwtPayload(token);
        return {
            userId: payload.sub,
            email: payload.email,
            name: payload.name,
            role: payload.role,
        };
    } catch (error) {
        logger.warn('Error getting current user', { error: error.message });
        return null;
    }
}

/**
 * 創建帶有認證 header 的 fetch 請求選項
 * @param {object} options - Fetch options
 * @returns {object} 包含認證 header 的 fetch options
 */
export function createAuthenticatedRequest(options = {}) {
    const token = getToken();

    if (!token) {
        throw new Error('No authentication token found');
    }

    return {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };
}

/**
 * 處理 API 認證錯誤
 * @param {Response} response - Fetch response
 * @returns {boolean} 是否為認證錯誤
 */
export function handleAuthError(response) {
    if (response.status === 401 || response.status === 403) {
        clearToken();
        return true;
    }
    return false;
}

/**
 * 示範：呼叫需要認證的 API
 * @param {string} apiUrl - API endpoint URL
 * @param {string} code - Short code
 * @param {object} data - Request data
 * @returns {Promise<object>} API response
 */
export async function createShortLinkWithAuth(apiUrl, code, targetUrl) {
    try {
        const options = createAuthenticatedRequest({
            method: 'POST',
            body: JSON.stringify({
                code,
                target: targetUrl,
            }),
        });

        const response = await fetch(`${apiUrl}/links`, options);

        if (handleAuthError(response)) {
            throw new Error('Authentication required. Please login again.');
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to create short link');
        }

        return await response.json();
    } catch (error) {
        logger.error('Error creating short link', { error: error.message });
        throw error;
    }
}

/**
 * 示範：登入並儲存 token
 * 注意：實際應用中，您需要實作自己的認證伺服器來發放 JWT token
 * @param {string} authServerUrl - 認證伺服器 URL
 * @param {string} email - 使用者 email
 * @param {string} password - 使用者密碼
 * @returns {Promise<object>} 登入結果
 */
export async function login(authServerUrl, email, password) {
    try {
        const response = await fetch(`${authServerUrl}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            throw new Error('Login failed');
        }

        const data = await response.json();

        if (data.token) {
            saveToken(data.token);
            return {
                success: true,
                user: getCurrentUser(),
            };
        }

        throw new Error('No token received');
    } catch (error) {
        logger.error('Login error', { error: error.message });
        throw error;
    }
}

/**
 * 登出
 */
export function logout() {
    clearToken();
}
