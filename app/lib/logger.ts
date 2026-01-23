// app/lib/logger.ts
// Centralized logging with Pino for production-ready logging
// Replaces console.log throughout the application

import pino from 'pino'

// Determine log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

// Create base logger configuration
const baseConfig: pino.LoggerOptions = {
  level: LOG_LEVEL,
  // Add timestamp in ISO format
  timestamp: pino.stdTimeFunctions.isoTime,
  // Base context for all logs
  base: {
    env: process.env.NODE_ENV,
    service: 'frost-solutions',
  },
  // Format error objects properly
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      hostname: bindings.hostname,
    }),
  },
  // Redact sensitive fields
  redact: {
    paths: [
      'password',
      'token',
      'accessToken',
      'refreshToken',
      'secret',
      'apiKey',
      'authorization',
      'cookie',
      'pnr',
      'personnummer',
      'personalIdentityNo',
      '*.password',
      '*.token',
      '*.secret',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
}

// Create the logger
// In development, use pino-pretty for readable output
// In production, use JSON format for log aggregation services
const logger = process.env.NODE_ENV === 'development'
  ? pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    })
  : pino(baseConfig)

// Export named loggers for different modules
export const createLogger = (module: string) => logger.child({ module })

// Pre-configured loggers for common modules
export const apiLogger = createLogger('api')
export const authLogger = createLogger('auth')
export const dbLogger = createLogger('db')
export const ocrLogger = createLogger('ocr')
export const syncLogger = createLogger('sync')
export const payrollLogger = createLogger('payroll')
export const rotLogger = createLogger('rot')
export const aiLogger = createLogger('ai')
export const stripeLogger = createLogger('stripe')
export const integrationLogger = createLogger('integration')

// Default export for general use
export default logger

// Helper type for structured logging
export interface LogContext {
  tenantId?: string
  userId?: string
  requestId?: string
  action?: string
  duration?: number
  [key: string]: unknown
}

/**
 * Log an API request with timing
 * Usage: const end = logRequest(req); ... end({ status: 200 })
 */
export function logRequest(
  method: string,
  path: string,
  context?: LogContext
): (result: { status: number; error?: string }) => void {
  const startTime = Date.now()
  const requestId = Math.random().toString(36).substring(7)
  
  apiLogger.info({ requestId, method, path, ...context }, `→ ${method} ${path}`)
  
  return (result) => {
    const duration = Date.now() - startTime
    const level = result.status >= 400 ? 'error' : 'info'
    
    apiLogger[level](
      { requestId, method, path, ...result, duration, ...context },
      `← ${method} ${path} ${result.status} (${duration}ms)`
    )
  }
}

/**
 * Wrap an async function with automatic error logging
 */
export async function withLogging<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: LogContext
): Promise<T> {
  const startTime = Date.now()
  
  try {
    const result = await fn()
    const duration = Date.now() - startTime
    logger.debug({ operation, duration, ...context }, `${operation} completed`)
    return result
  } catch (error) {
    const duration = Date.now() - startTime
    logger.error(
      { operation, duration, error, ...context },
      `${operation} failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
    throw error
  }
}
