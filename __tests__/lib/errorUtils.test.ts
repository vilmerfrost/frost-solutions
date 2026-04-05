/**
 * Tests for errorUtils
 * Run with: npm test
 */

import { extractErrorMessage, logError } from '@/lib/errorUtils'

describe('extractErrorMessage', () => {
  it('should handle string errors', () => {
    expect(extractErrorMessage('Test error')).toBe('Test error')
  })

  it('should handle Error objects', () => {
    const error = new Error('Test error')
    expect(extractErrorMessage(error)).toBe('Test error')
  })

  it('should handle Supabase-style errors', () => {
    const error = {
      message: 'Test message',
      details: 'Detailed info',
      hint: 'Hint text',
      code: '42703',
    }
    expect(extractErrorMessage(error)).toBe('Test message')
  })

  it('should handle errors with only details', () => {
    const error = { details: 'Detailed info' }
    expect(extractErrorMessage(error)).toBe('Detailed info')
  })

  it('should handle errors with only code', () => {
    const error = { code: '42703' }
    expect(extractErrorMessage(error)).toBe('Kolumn saknas i databasen')
  })

  it('should handle empty objects', () => {
    expect(extractErrorMessage({})).toBe('Okänt fel')
  })

  it('should handle null/undefined', () => {
    expect(extractErrorMessage(null)).toBe('Okänt fel')
    expect(extractErrorMessage(undefined)).toBe('Okänt fel')
  })
})

describe('logError', () => {
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

  afterEach(() => {
    consoleSpy.mockClear()
  })

  afterAll(() => {
    consoleSpy.mockRestore()
  })

  it('should log error with context', () => {
    const error = new Error('Test error')
    logError('TestContext', error)
    
    expect(consoleSpy).toHaveBeenCalled()
    const call = consoleSpy.mock.calls[0]
    expect(call[0]).toBe('[TestContext] Test error')
  })
})

