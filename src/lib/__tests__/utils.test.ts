import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  cn,
  generateId,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  daysSince,
  getContactDisplayName,
  getInitials,
  formatFileSize,
  now,
  todayISO,
  debounce,
  downloadJSON,
} from '@/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar')
  })

  it('resolves Tailwind conflicts', () => {
    // tailwind-merge should remove duplicate utilities
    expect(cn('p-4', 'p-6')).toBe('p-6')
  })

  it('ignores falsy values', () => {
    expect(cn('foo', false && 'bar', undefined, null, '')).toBe('foo')
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique IDs on successive calls', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})

describe('formatDate', () => {
  it('formats valid ISO date as dd/MM/yyyy', () => {
    expect(formatDate('2026-02-24')).toBe('24/02/2026')
  })

  it('returns empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('')
  })

  it('returns the original string for invalid date', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })

  it('accepts custom pattern', () => {
    expect(formatDate('2026-02-24', 'yyyy/MM/dd')).toBe('2026/02/24')
  })
})

describe('formatDateTime', () => {
  it('formats ISO datetime with time', () => {
    const result = formatDateTime('2026-02-24T14:30:00.000Z')
    // Time will depend on locale timezone — just check the date portion
    expect(result).toContain('24/02/2026')
  })

  it('returns empty for undefined', () => {
    expect(formatDateTime(undefined)).toBe('')
  })
})

describe('formatRelativeTime', () => {
  it('returns a non-empty string for a valid date', () => {
    const result = formatRelativeTime(new Date(Date.now() - 60000).toISOString())
    expect(result.length).toBeGreaterThan(0)
  })

  it('returns empty for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('')
  })
})

describe('daysSince', () => {
  it('returns 0 for today', () => {
    expect(daysSince(new Date().toISOString())).toBe(0)
  })

  it('returns approximately 1 for yesterday', () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString()
    expect(daysSince(yesterday)).toBe(1)
  })

  it('returns null for undefined', () => {
    expect(daysSince(undefined)).toBeNull()
  })
})

describe('getContactDisplayName', () => {
  it('concatenates firstName and lastName', () => {
    expect(getContactDisplayName({ firstName: 'Văn', lastName: 'Nguyễn' })).toBe('Văn Nguyễn')
  })

  it('trims leading/trailing whitespace from the combined name', () => {
    // The function concatenates and then trims — leading/trailing spaces are removed
    const result = getContactDisplayName({ firstName: '  An', lastName: 'Lê  ' })
    expect(result.startsWith(' ')).toBe(false)
    expect(result.endsWith(' ')).toBe(false)
  })
})

describe('getInitials', () => {
  it('returns up to 2 initials uppercased', () => {
    expect(getInitials('Nguyễn Văn An')).toBe('NV')
  })

  it('handles single word', () => {
    expect(getInitials('Admin')).toBe('A')
  })

  it('handles empty string', () => {
    expect(getInitials('')).toBe('')
  })
})

describe('formatFileSize', () => {
  it('formats bytes', () => {
    expect(formatFileSize(500)).toBe('500 B')
  })

  it('formats kilobytes', () => {
    expect(formatFileSize(1500)).toBe('1.5 KB')
  })

  it('formats megabytes', () => {
    expect(formatFileSize(2500000)).toBe('2.4 MB')
  })
})

describe('now', () => {
  it('returns a valid ISO string', () => {
    const result = now()
    expect(() => new Date(result)).not.toThrow()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('todayISO', () => {
  it('returns yyyy-MM-dd format', () => {
    const result = todayISO()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays function execution', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(300)
    expect(fn).toHaveBeenCalledOnce()
  })

  it('resets timer on repeated calls', () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)
    debounced()
    vi.advanceTimersByTime(200)
    debounced()
    vi.advanceTimersByTime(200)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledOnce()
  })
})

describe('downloadJSON', () => {
  it('calls URL.createObjectURL and triggers a download', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test')
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.fn()
    const appendChild = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as unknown as Node)
    const removeChild = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as unknown as Node)

    // Mock createElement to return an element with a click spy
    const mockLink = { href: '', download: '', click } as unknown as HTMLAnchorElement
    vi.spyOn(document, 'createElement').mockReturnValueOnce(mockLink)

    downloadJSON({ test: 1 }, 'test.json')

    expect(createObjectURL).toHaveBeenCalled()
    expect(click).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:test')

    createObjectURL.mockRestore()
    revokeObjectURL.mockRestore()
    appendChild.mockRestore()
    removeChild.mockRestore()
  })
})
