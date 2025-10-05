/**
 * Environment-aware logging utility for frontend
 * Provides structured logging with different output levels based on environment
 */

export const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
};

export const Environment = {
    DEVELOPMENT: 'development',
    STAGING: 'staging',
    PRODUCTION: 'production',
};

// LogContext type definition (for documentation)
// {
//   component?: string;
//   userId?: string;
//   operation?: string;
//   [key: string]: any;
// }

class FrontendLogger {
    constructor(componentName = 'unknown') {
        this.componentName = componentName;
        this.environment = this.getEnvironment();
        this.logLevel = this.getLogLevel();

        // Display ASCII art logo on first logger creation
        this.displayLogo();
    }

    displayLogo() {
        // Only display logo once per session
        if (window.chainyLogoDisplayed) return;
        window.chainyLogoDisplayed = true;

        const logo = `
%c
╔═════════════════════════════════════════════════╗
║  ██████╗██╗  ██╗ █████╗ ██╗███╗   ██╗██╗   ██╗  ║
║ ██╔════╝██║  ██║██╔══██╗██║████╗  ██║╚██╗ ██╔╝  ║
║ ██║     ███████║███████║██║██╔██╗ ██║ ╚████╔╝   ║
║ ██║     ██╔══██║██╔══██║██║██║╚██╗██║  ╚██╔╝    ║
║ ╚██████╗██║  ██║██║  ██║██║██║ ╚████║   ██║     ║
║  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝   ╚═╝     ║
║                                                 ║
║         🚀 Shorten URLs, WAGMI 🚀               ║
║                                                 ║
║       GitHub: https://github.com/ChuLiYu        ║
║     LinkedIn: https://linkedin.com/in/chuliyu   ║
╚═════════════════════════════════════════════════╝
        `;

        const style = `
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.2;
        `;

        console.log(logo, style);
    }

    getEnvironment() {
        // Check for environment variables from Vite
        const env = import.meta.env?.MODE || import.meta.env?.NODE_ENV || 'production';

        switch (env.toLowerCase()) {
            case 'dev':
            case 'development':
                return Environment.DEVELOPMENT;
            case 'staging':
            case 'stage':
                return Environment.STAGING;
            case 'prod':
            case 'production':
            default:
                return Environment.PRODUCTION;
        }
    }

    getLogLevel() {
        switch (this.environment) {
            case Environment.DEVELOPMENT:
                return LogLevel.DEBUG; // All logs in development
            case Environment.STAGING:
                return LogLevel.INFO;  // Info, warnings, and errors in staging
            case Environment.PRODUCTION:
                return LogLevel.WARN;  // Warnings and errors in production for monitoring
            default:
                return LogLevel.WARN;
        }
    }

    shouldLog(level) {
        return level <= this.logLevel;
    }

    formatMessage(level, message, context) {
        const timestamp = new Date().toISOString();
        const baseLog = {
            timestamp,
            level,
            component: this.componentName,
            environment: this.environment,
            message,
        };

        if (context) {
            return JSON.stringify({ ...baseLog, ...context });
        }

        return JSON.stringify(baseLog);
    }

    log(level, levelName, message, context) {
        if (!this.shouldLog(level)) {
            return;
        }

        const formattedMessage = this.formatMessage(levelName, message, context);

        // Use appropriate console method based on level
        switch (level) {
            case LogLevel.ERROR:
                console.error(formattedMessage);
                break;
            case LogLevel.WARN:
                console.warn(formattedMessage);
                break;
            case LogLevel.INFO:
                console.info(formattedMessage);
                break;
            case LogLevel.DEBUG:
                console.log(formattedMessage);
                break;
        }
    }

    /**
     * Log error messages
     * Always logged in all environments
     */
    error(message, context) {
        this.log(LogLevel.ERROR, 'ERROR', message, context);
    }

    /**
     * Log warning messages
     * Logged in staging and development environments
     */
    warn(message, context) {
        this.log(LogLevel.WARN, 'WARN', message, context);
    }

    /**
     * Log informational messages
     * Logged in staging and development environments
     */
    info(message, context) {
        this.log(LogLevel.INFO, 'INFO', message, context);
    }

    /**
     * Log debug messages
     * Only logged in development environment
     */
    debug(message, context) {
        this.log(LogLevel.DEBUG, 'DEBUG', message, context);
    }

    /**
     * Log Google Auth events
     * Logged in staging and development (without sensitive data)
     */
    auth(event, context) {
        this.info(`Auth Event: ${event}`, {
            ...context,
            operation: 'authentication',
            event,
        });
    }

    /**
     * Log API requests
     * Only logged in development
     */
    api(method, url, context) {
        this.debug(`API Request: ${method} ${url}`, {
            ...context,
            operation: 'api_request',
            method,
            url,
        });
    }

    /**
     * Log user interactions
     * Logged in staging and development
     */
    interaction(action, context) {
        this.info(`User Interaction: ${action}`, {
            ...context,
            operation: 'user_interaction',
            action,
        });
    }

    /**
     * Log performance metrics
     * Logged in all environments for monitoring
     */
    performance(operation, duration, context) {
        this.info(`Performance: ${operation} took ${duration}ms`, {
            ...context,
            operation: 'performance',
            duration,
        });
    }

    /**
     * Get current environment
     */
    getCurrentEnvironment() {
        return this.environment;
    }

    /**
     * Get current log level
     */
    getCurrentLogLevel() {
        return this.logLevel;
    }
}

// Create logger instances for different components
export const createLogger = (componentName) => {
    return new FrontendLogger(componentName);
};

// Default logger for backward compatibility
export const logger = createLogger('default');

// Export types for use in other files
// LogLevel and Environment are already exported above
