/**
 * Service Status Utility
 * 
 * 檢查後端服務狀態並提供友好的錯誤訊息
 */

import { createLogger } from './logger.js';

// Initialize logger for service status utilities
const logger = createLogger('serviceStatus');

/**
 * 檢查 API 回應是否為服務暫停狀態
 * @param {Response} response - Fetch response
 * @returns {Object|null} 服務狀態資訊或 null
 */
export function checkServiceStatus(response) {
    // 檢查 503 狀態碼 (服務不可用)
    if (response.status === 503) {
        try {
            // 嘗試解析回應內容
            return response.json().then(data => {
                if (data.status === 'paused' || data.status === 'emergency_stop') {
                    return {
                        isServiceDown: true,
                        status: data.status,
                        reason: data.reason || '服務維護中',
                        timestamp: data.timestamp || '未知時間',
                        message: data.message || '服務暫時停止服務'
                    };
                }
                return null;
            }).catch(() => {
                // 如果無法解析 JSON，返回基本狀態
                return {
                    isServiceDown: true,
                    status: 'unknown',
                    reason: '服務維護中',
                    timestamp: '未知時間',
                    message: '服務暫時停止服務'
                };
            });
        } catch (error) {
            logger.warn('Failed to parse service status response', { error: error.message });
            return {
                isServiceDown: true,
                status: 'unknown',
                reason: '服務維護中',
                timestamp: '未知時間',
                message: '服務暫時停止服務'
            };
        }
    }

    return null;
}

/**
 * 檢查網路錯誤是否為服務不可用
 * @param {Error} error - 錯誤物件
 * @returns {boolean} 是否為服務不可用錯誤
 */
export function isServiceUnavailableError(error) {
    if (!error) return false;

    const message = error.message.toLowerCase();
    const serviceUnavailablePatterns = [
        'service temporarily unavailable',
        'service maintenance',
        'service paused',
        'emergency stop',
        '503',
        'service unavailable'
    ];

    return serviceUnavailablePatterns.some(pattern => message.includes(pattern));
}

/**
 * 獲取服務狀態的友好錯誤訊息
 * @param {Object} serviceStatus - 服務狀態物件
 * @param {string} language - 語言代碼 ('zh' 或 'en')
 * @returns {Object} 包含標題、訊息和建議的物件
 */
export function getServiceStatusMessage(serviceStatus, language = 'zh') {
    const isChinese = language === 'zh';

    if (!serviceStatus || !serviceStatus.isServiceDown) {
        return null;
    }

    const { status, reason, timestamp } = serviceStatus;

    if (status === 'emergency_stop') {
        return {
            title: isChinese ? '🚨 服務緊急停止' : '🚨 Service Emergency Stop',
            message: isChinese
                ? `服務因緊急情況暫時停止。\n原因：${reason}\n時間：${timestamp}`
                : `Service temporarily stopped due to emergency.\nReason: ${reason}\nTime: ${timestamp}`,
            suggestion: isChinese
                ? '我們正在處理緊急情況，請稍後再試。如有緊急需求，請聯繫管理員。'
                : 'We are handling the emergency situation. Please try again later. For urgent needs, please contact the administrator.',
            type: 'emergency',
            canRetry: false
        };
    }

    if (status === 'paused') {
        return {
            title: isChinese ? '⏸️ 服務維護中' : '⏸️ Service Maintenance',
            message: isChinese
                ? `服務正在進行維護。\n原因：${reason}\n時間：${timestamp}`
                : `Service is under maintenance.\nReason: ${reason}\nTime: ${timestamp}`,
            suggestion: isChinese
                ? '我們正在進行系統維護，預計很快恢復。請稍後再試。'
                : 'We are performing system maintenance and expect to resume soon. Please try again later.',
            type: 'maintenance',
            canRetry: true
        };
    }

    // 預設服務不可用訊息
    return {
        title: isChinese ? '🔧 服務暫時不可用' : '🔧 Service Temporarily Unavailable',
        message: isChinese
            ? `服務暫時不可用。\n原因：${reason}\n時間：${timestamp}`
            : `Service is temporarily unavailable.\nReason: ${reason}\nTime: ${timestamp}`,
        suggestion: isChinese
            ? '請稍後再試，或聯繫技術支援。'
            : 'Please try again later or contact technical support.',
        type: 'unavailable',
        canRetry: true
    };
}

/**
 * 檢查 API 回應並返回適當的錯誤處理
 * @param {Response} response - Fetch response
 * @param {string} language - 語言代碼
 * @returns {Promise<Object|null>} 服務狀態訊息或 null
 */
export async function handleServiceStatusResponse(response, language = 'zh') {
    try {
        const serviceStatus = await checkServiceStatus(response);
        if (serviceStatus) {
            return getServiceStatusMessage(serviceStatus, language);
        }
    } catch (error) {
        logger.warn('Error handling service status response', { error: error.message });
    }

    return null;
}

/**
 * 創建服務狀態檢查的 fetch 包裝器
 * @param {string} url - API URL
 * @param {Object} options - Fetch options
 * @param {string} language - 語言代碼
 * @returns {Promise<Response>} Fetch response
 */
export async function fetchWithServiceStatusCheck(url, options = {}, language = 'zh') {
    try {
        const response = await fetch(url, options);

        // 檢查服務狀態
        const serviceStatusMessage = await handleServiceStatusResponse(response, language);
        if (serviceStatusMessage) {
            // 創建一個包含服務狀態資訊的錯誤
            const error = new Error(serviceStatusMessage.message);
            error.serviceStatus = serviceStatusMessage;
            error.isServiceDown = true;
            throw error;
        }

        return response;
    } catch (error) {
        // 如果是網路錯誤且可能是服務不可用
        if (isServiceUnavailableError(error)) {
            const serviceStatusMessage = {
                title: language === 'zh' ? '🔧 服務暫時不可用' : '🔧 Service Temporarily Unavailable',
                message: language === 'zh'
                    ? '無法連接到服務器，服務可能正在維護中。'
                    : 'Unable to connect to server. Service may be under maintenance.',
                suggestion: language === 'zh'
                    ? '請檢查網路連接或稍後再試。'
                    : 'Please check your network connection or try again later.',
                type: 'network',
                canRetry: true
            };

            error.serviceStatus = serviceStatusMessage;
            error.isServiceDown = true;
        }

        throw error;
    }
}

/**
 * 檢查服務健康狀態
 * @param {string} apiEndpoint - API 端點
 * @returns {Promise<Object>} 服務健康狀態
 */
export async function checkServiceHealth(apiEndpoint) {
    try {
        const response = await fetch(`${apiEndpoint}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            return {
                isHealthy: true,
                status: 'online',
                message: '服務正常運作'
            };
        } else if (response.status === 503) {
            const serviceStatus = await checkServiceStatus(response);
            return {
                isHealthy: false,
                status: 'maintenance',
                message: serviceStatus?.message || '服務維護中',
                serviceStatus
            };
        } else {
            return {
                isHealthy: false,
                status: 'error',
                message: `服務狀態異常 (${response.status})`
            };
        }
    } catch (error) {
        logger.error('Service health check failed', { error: error.message });
        return {
            isHealthy: false,
            status: 'offline',
            message: '無法連接到服務器'
        };
    }
}
