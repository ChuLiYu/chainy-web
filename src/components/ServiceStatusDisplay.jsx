/**
 * Service Status Display Component
 * 
 * 顯示服務狀態的 React 組件
 */

import React from 'react';
import { createLogger } from '../utils/logger.js';

// Initialize logger for service status component
const logger = createLogger('ServiceStatusDisplay');

/**
 * 服務狀態顯示組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.serviceStatus - 服務狀態物件
 * @param {string} props.language - 語言代碼
 * @param {Function} props.onRetry - 重試回調函數
 * @param {Function} props.onDismiss - 關閉回調函數
 * @returns {JSX.Element} 服務狀態顯示組件
 */
export function ServiceStatusDisplay({
    serviceStatus,
    language = 'zh',
    onRetry,
    onDismiss
}) {
    if (!serviceStatus) return null;

    const isChinese = language === 'zh';

    // 根據狀態類型選擇樣式
    const getStatusStyles = (type) => {
        switch (type) {
            case 'emergency':
                return {
                    container: 'bg-red-50 border-red-200',
                    icon: 'text-red-500',
                    title: 'text-red-800',
                    message: 'text-red-700',
                    button: 'bg-red-600 hover:bg-red-700 text-white'
                };
            case 'maintenance':
                return {
                    container: 'bg-yellow-50 border-yellow-200',
                    icon: 'text-yellow-500',
                    title: 'text-yellow-800',
                    message: 'text-yellow-700',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                };
            case 'unavailable':
            case 'network':
            default:
                return {
                    container: 'bg-blue-50 border-blue-200',
                    icon: 'text-blue-500',
                    title: 'text-blue-800',
                    message: 'text-blue-700',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
        }
    };

    const styles = getStatusStyles(serviceStatus.type);

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4`}>
            <div className={`max-w-md w-full bg-white rounded-lg shadow-xl border-2 ${styles.container}`}>
                {/* 標題區域 */}
                <div className="p-6 text-center">
                    <div className={`text-4xl mb-4 ${styles.icon}`}>
                        {serviceStatus.type === 'emergency' && '🚨'}
                        {serviceStatus.type === 'maintenance' && '⏸️'}
                        {(serviceStatus.type === 'unavailable' || serviceStatus.type === 'network') && '🔧'}
                    </div>

                    <h2 className={`text-xl font-bold mb-4 ${styles.title}`}>
                        {serviceStatus.title}
                    </h2>

                    <div className={`text-sm mb-6 ${styles.message}`}>
                        {serviceStatus.message.split('\n').map((line, index) => (
                            <div key={index} className="mb-2">
                                {line}
                            </div>
                        ))}
                    </div>

                    {serviceStatus.suggestion && (
                        <div className={`text-xs ${styles.message} mb-6`}>
                            {serviceStatus.suggestion}
                        </div>
                    )}
                </div>

                {/* 按鈕區域 */}
                <div className="px-6 pb-6 flex gap-3">
                    {serviceStatus.canRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${styles.button}`}
                        >
                            {isChinese ? '重試' : 'Retry'}
                        </button>
                    )}

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="flex-1 px-4 py-2 rounded-md font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                        >
                            {isChinese ? '關閉' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * 簡化的服務狀態橫幅組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.serviceStatus - 服務狀態物件
 * @param {string} props.language - 語言代碼
 * @param {Function} props.onRetry - 重試回調函數
 * @param {Function} props.onDismiss - 關閉回調函數
 * @returns {JSX.Element} 服務狀態橫幅組件
 */
export function ServiceStatusBanner({
    serviceStatus,
    language = 'zh',
    onRetry,
    onDismiss
}) {
    if (!serviceStatus) return null;

    const isChinese = language === 'zh';

    // 根據狀態類型選擇樣式
    const getBannerStyles = (type) => {
        switch (type) {
            case 'emergency':
                return {
                    container: 'bg-red-100 border-red-300',
                    text: 'text-red-800',
                    button: 'bg-red-600 hover:bg-red-700 text-white'
                };
            case 'maintenance':
                return {
                    container: 'bg-yellow-100 border-yellow-300',
                    text: 'text-yellow-800',
                    button: 'bg-yellow-600 hover:bg-yellow-700 text-white'
                };
            case 'unavailable':
            case 'network':
            default:
                return {
                    container: 'bg-blue-100 border-blue-300',
                    text: 'text-blue-800',
                    button: 'bg-blue-600 hover:bg-blue-700 text-white'
                };
        }
    };

    const styles = getBannerStyles(serviceStatus.type);

    return (
        <div className={`border-l-4 p-4 mb-4 ${styles.container}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <div className="text-lg mr-3">
                        {serviceStatus.type === 'emergency' && '🚨'}
                        {serviceStatus.type === 'maintenance' && '⏸️'}
                        {(serviceStatus.type === 'unavailable' || serviceStatus.type === 'network') && '🔧'}
                    </div>

                    <div>
                        <div className={`font-semibold ${styles.text}`}>
                            {serviceStatus.title}
                        </div>
                        <div className={`text-sm ${styles.text}`}>
                            {serviceStatus.message.split('\n')[0]}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {serviceStatus.canRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${styles.button}`}
                        >
                            {isChinese ? '重試' : 'Retry'}
                        </button>
                    )}

                    {onDismiss && (
                        <button
                            onClick={onDismiss}
                            className="px-3 py-1 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors"
                        >
                            {isChinese ? '關閉' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * 服務狀態指示器組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.serviceStatus - 服務狀態物件
 * @param {string} props.language - 語言代碼
 * @returns {JSX.Element} 服務狀態指示器組件
 */
export function ServiceStatusIndicator({ serviceStatus, language = 'zh' }) {
    if (!serviceStatus) return null;

    const isChinese = language === 'zh';

    const getIndicatorStyles = (type) => {
        switch (type) {
            case 'emergency':
                return {
                    dot: 'bg-red-500',
                    text: 'text-red-600',
                    label: isChinese ? '緊急停止' : 'Emergency Stop'
                };
            case 'maintenance':
                return {
                    dot: 'bg-yellow-500',
                    text: 'text-yellow-600',
                    label: isChinese ? '維護中' : 'Maintenance'
                };
            case 'unavailable':
            case 'network':
            default:
                return {
                    dot: 'bg-blue-500',
                    text: 'text-blue-600',
                    label: isChinese ? '服務異常' : 'Service Issue'
                };
        }
    };

    const styles = getIndicatorStyles(serviceStatus.type);

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
            <span className={`text-xs font-medium ${styles.text}`}>
                {styles.label}
            </span>
        </div>
    );
}
