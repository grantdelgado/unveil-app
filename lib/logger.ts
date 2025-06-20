/**
 * Centralized Logging System for Unveil
 *
 * Provides consistent logging patterns with semantic emoji categories,
 * structured data support, and environment-aware logging strategies.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory =
  | 'auth' // Authentication & authorization
  | 'database' // Database operations & queries
  | 'api' // API calls & responses
  | 'realtime' // Real-time subscriptions & events
  | 'media' // File uploads & media handling
  | 'sms' // SMS & messaging operations
  | 'navigation' // Routing & navigation
  | 'validation' // Form validation & data validation
  | 'performance' // Performance monitoring
  | 'error' // Error handling & boundaries
  | 'dev' // Development-only logging
  | 'system'; // System events & lifecycle

interface LogEntry {
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
}

interface LoggerConfig {
  isDevelopment: boolean;
  enableStructuredLogging: boolean;
  logLevel: LogLevel;
  enabledCategories: LogCategory[];
}

// Default configuration
const defaultConfig: LoggerConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  enableStructuredLogging: process.env.NODE_ENV === 'production',
  logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enabledCategories:
    process.env.NODE_ENV === 'development'
      ? [
          'auth',
          'database',
          'api',
          'realtime',
          'media',
          'sms',
          'navigation',
          'validation',
          'performance',
          'error',
          'dev',
          'system',
        ]
      : ['error', 'api', 'database', 'system'], // Production: only critical categories
};

// Emoji mapping for visual categorization
const categoryEmojis: Record<LogCategory, string> = {
  auth: '🔐',
  database: '🗄️',
  api: '📡',
  realtime: '⚡',
  media: '📸',
  sms: '📱',
  navigation: '🧭',
  validation: '✅',
  performance: '⚡',
  error: '❌',
  dev: '🛠️',
  system: '🔧',
};

// Log level hierarchy for filtering
const logLevels: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private config: LoggerConfig;
  private logHistory: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    // Check if log level meets minimum threshold
    if (logLevels[level] < logLevels[this.config.logLevel]) {
      return false;
    }

    // Check if category is enabled
    if (!this.config.enabledCategories.includes(category)) {
      return false;
    }

    return true;
  }

  private formatMessage(category: LogCategory, message: string): string {
    const emoji = categoryEmojis[category];
    return `${emoji} ${message}`;
  }

  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    context?: string,
  ): LogEntry {
    return {
      level,
      category,
      message,
      data,
      context,
      timestamp: new Date().toISOString(),
    };
  }

  private writeLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry.category, entry.message);

    // Store in history for debugging
    if (this.config.isDevelopment) {
      this.logHistory.push(entry);
      // Keep only last 100 entries in development
      if (this.logHistory.length > 100) {
        this.logHistory.shift();
      }
    }

    // Structured logging for production
    if (this.config.enableStructuredLogging) {
      const structuredLog: Record<string, unknown> = {
        timestamp: entry.timestamp,
        level: entry.level,
        category: entry.category,
        message: entry.message,
      };

      if (entry.data) {
        structuredLog.data = entry.data;
      }

      if (entry.context) {
        structuredLog.context = entry.context;
      }

      switch (entry.level) {
        case 'error':
          console.error(JSON.stringify(structuredLog));
          break;
        case 'warn':
          console.warn(JSON.stringify(structuredLog));
          break;
        default:
          console.log(JSON.stringify(structuredLog));
      }
    } else {
      // Development logging with emojis and formatting
      switch (entry.level) {
        case 'error':
          console.error(formattedMessage, entry.data || '');
          break;
        case 'warn':
          console.warn(formattedMessage, entry.data || '');
          break;
        default:
          console.log(formattedMessage, entry.data || '');
      }
    }
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: unknown,
    context?: string,
  ): void {
    if (!this.shouldLog(level, category)) {
      return;
    }

    const entry = this.createLogEntry(level, category, message, data, context);
    this.writeLog(entry);
  }

  // Category-specific logging methods
  auth(message: string, data?: unknown, context?: string): void {
    this.log('info', 'auth', message, data, context);
  }

  authError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'auth', message, error, context);
  }

  database(message: string, data?: unknown, context?: string): void {
    this.log('info', 'database', message, data, context);
  }

  databaseError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'database', message, error, context);
  }

  api(message: string, data?: unknown, context?: string): void {
    this.log('info', 'api', message, data, context);
  }

  apiError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'api', message, error, context);
  }

  realtime(message: string, data?: unknown, context?: string): void {
    this.log('info', 'realtime', message, data, context);
  }

  realtimeError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'realtime', message, error, context);
  }

  media(message: string, data?: unknown, context?: string): void {
    this.log('info', 'media', message, data, context);
  }

  mediaError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'media', message, error, context);
  }

  sms(message: string, data?: unknown, context?: string): void {
    this.log('info', 'sms', message, data, context);
  }

  smsError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'sms', message, error, context);
  }

  navigation(message: string, data?: unknown, context?: string): void {
    this.log('info', 'navigation', message, data, context);
  }

  navigationError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'navigation', message, error, context);
  }

  validation(message: string, data?: unknown, context?: string): void {
    this.log('info', 'validation', message, data, context);
  }

  validationError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'validation', message, error, context);
  }

  performance(message: string, data?: unknown, context?: string): void {
    this.log('info', 'performance', message, data, context);
  }

  performanceWarn(message: string, data?: unknown, context?: string): void {
    this.log('warn', 'performance', message, data, context);
  }

  error(message: string, error?: unknown, context?: string): void {
    this.log('error', 'error', message, error, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', 'system', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', 'system', message, data, context);
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', 'dev', message, data, context);
  }

  dev(message: string, data?: unknown, context?: string): void {
    this.log('info', 'dev', message, data, context);
  }

  system(message: string, data?: unknown, context?: string): void {
    this.log('info', 'system', message, data, context);
  }

  systemError(message: string, error?: unknown, context?: string): void {
    this.log('error', 'system', message, error, context);
  }

  // Utility methods
  getLogHistory(): LogEntry[] {
    return [...this.logHistory];
  }

  clearHistory(): void {
    this.logHistory = [];
  }

  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Performance timing utilities
  time(label: string): void {
    if (this.config.isDevelopment) {
      console.time(`⚡ ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.config.isDevelopment) {
      console.timeEnd(`⚡ ${label}`);
    }
  }
}

// Create singleton instance
export const logger = new Logger();

// Export for testing and advanced usage
export { Logger };

// Convenience exports for common patterns
export const logAuth = logger.auth.bind(logger);
export const logAuthError = logger.authError.bind(logger);
export const logDatabase = logger.database.bind(logger);
export const logDatabaseError = logger.databaseError.bind(logger);
export const logApi = logger.api.bind(logger);
export const logApiError = logger.apiError.bind(logger);
export const logRealtime = logger.realtime.bind(logger);
export const logRealtimeError = logger.realtimeError.bind(logger);
export const logMedia = logger.media.bind(logger);
export const logMediaError = logger.mediaError.bind(logger);
export const logSms = logger.sms.bind(logger);
export const logSmsError = logger.smsError.bind(logger);
export const logNavigation = logger.navigation.bind(logger);
export const logNavigationError = logger.navigationError.bind(logger);
export const logValidation = logger.validation.bind(logger);
export const logValidationError = logger.validationError.bind(logger);
export const logPerformance = logger.performance.bind(logger);
export const logPerformanceWarn = logger.performanceWarn.bind(logger);
export const logGenericError = logger.error.bind(logger);
export const logWarn = logger.warn.bind(logger);
export const logInfo = logger.info.bind(logger);
export const logDebug = logger.debug.bind(logger);
export const logDev = logger.dev.bind(logger);
export const logSystem = logger.system.bind(logger);
export const logSystemError = logger.systemError.bind(logger);
