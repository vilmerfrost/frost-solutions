// app/lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
 [key: string]: unknown;
}

/**
 * Structured logger for production-ready logging
 * Logs to console in dev, can be extended for production services
 */
export class Logger {
 constructor(private readonly context: string) {}

 private log(level: LogLevel, message: string, meta?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = {
   timestamp,
   level,
   context: this.context,
   message,
   ...meta,
  };

  // In production, output structured JSON logs (can be collected by hosting provider)
  if (process.env.NODE_ENV === 'production') {
   // Structured JSON output - collected by Vercel/hosting logs
   console.log(JSON.stringify(logEntry));
  } else {
   // Pretty print in development
   const emoji = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
   }[level];
   console.log(`${emoji} [${this.context}] ${message}`, meta || '');
  }
 }

 debug(message: string, meta?: LogContext) {
  this.log('debug', message, meta);
 }

 info(message: string, meta?: LogContext) {
  this.log('info', message, meta);
 }

 warn(message: string, meta?: LogContext) {
  this.log('warn', message, meta);
 }

 error(message: string, error?: Error | unknown, meta?: LogContext) {
  this.log('error', message, {
   ...meta,
   error: error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
   } : error,
  });
 }
}

/**
 * Create logger instance for a specific context
 */
export function createLogger(context: string): Logger {
 return new Logger(context);
}

