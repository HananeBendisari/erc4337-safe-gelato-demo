/**
 * Professional logging service for ERC-4337 Safe Gelato Demo
 * Structured logging with different levels and formatting
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private currentLevel: LogLevel = LogLevel.INFO;
  private enableColors: boolean = true;

  constructor(level: LogLevel = LogLevel.INFO, colors: boolean = true) {
    this.currentLevel = level;
    this.enableColors = colors;
  }

  setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  setColors(enabled: boolean): void {
    this.enableColors = enabled;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.currentLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const timestamp = entry.timestamp.toISOString();
    const levelName = LogLevel[entry.level];
    
    let message = `[${timestamp}] ${levelName}: ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      message += `\n  Context: ${JSON.stringify(entry.context, null, 2)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return this.enableColors ? this.colorize(message, entry.level) : message;
  }

  private colorize(message: string, level: LogLevel): string {
    const colors = {
      [LogLevel.ERROR]: '\x1b[31m', // Red
      [LogLevel.WARN]: '\x1b[33m',  // Yellow
      [LogLevel.INFO]: '\x1b[36m',  // Cyan
      [LogLevel.DEBUG]: '\x1b[37m', // White
    };
    
    const reset = '\x1b[0m';
    return `${colors[level]}${message}${reset}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error,
    };

    console.log(this.formatMessage(entry));
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  // Convenience methods for common patterns
  success(message: string, context?: Record<string, any>): void {
    this.info(`SUCCESS: ${message}`, context);
  }

  failure(message: string, context?: Record<string, any>, error?: Error): void {
    this.error(`ERROR: ${message}`, context, error);
  }

  progress(message: string, context?: Record<string, any>): void {
    this.info(`🔄 ${message}`, context);
  }

  network(message: string, context?: Record<string, any>): void {
    this.info(`🌐 ${message}`, context);
  }

  contract(message: string, context?: Record<string, any>): void {
    this.info(`📋 ${message}`, context);
  }

  transaction(message: string, context?: Record<string, any>): void {
    this.info(`💰 ${message}`, context);
  }

  // Create child logger with additional context
  child(additionalContext: Record<string, any>): ChildLogger {
    return new ChildLogger(this, additionalContext);
  }
}

class ChildLogger {
  constructor(
    private parent: Logger,
    private additionalContext: Record<string, any>
  ) {}

  private mergeContext(context?: Record<string, any>): Record<string, any> {
    return { ...this.additionalContext, ...context };
  }

  error(message: string, context?: Record<string, any>, error?: Error): void {
    this.parent.error(message, this.mergeContext(context), error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.parent.warn(message, this.mergeContext(context));
  }

  info(message: string, context?: Record<string, any>): void {
    this.parent.info(message, this.mergeContext(context));
  }

  debug(message: string, context?: Record<string, any>): void {
    this.parent.debug(message, this.mergeContext(context));
  }

  success(message: string, context?: Record<string, any>): void {
    this.parent.success(message, this.mergeContext(context));
  }

  failure(message: string, context?: Record<string, any>, error?: Error): void {
    this.parent.failure(message, this.mergeContext(context), error);
  }

  progress(message: string, context?: Record<string, any>): void {
    this.parent.progress(message, this.mergeContext(context));
  }

  network(message: string, context?: Record<string, any>): void {
    this.parent.network(message, this.mergeContext(context));
  }

  contract(message: string, context?: Record<string, any>): void {
    this.parent.contract(message, this.mergeContext(context));
  }

  transaction(message: string, context?: Record<string, any>): void {
    this.parent.transaction(message, this.mergeContext(context));
  }
}

// Default logger instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  process.stdout.isTTY // Enable colors only if outputting to terminal
);

// Convenience function to create contextual loggers
export function createLogger(context: Record<string, any>): ChildLogger {
  return logger.child(context);
}

export { Logger };