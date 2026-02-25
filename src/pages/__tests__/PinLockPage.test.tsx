import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import PinLockPage from '@/pages/PinLockPage'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { hashPIN } from '@/lib/crypto'

async function setupWithPIN(pin: string) {
  const pinHash = await hashPIN(pin)
  useSettingsStore.setState({
    settings: {
      pinEnabled: true,
      pinHash,
      biometricEnabled: false,
      lockAfterMinutes: 15,
      autoBackupEnabled: false,
      autoBackupFrequency: 'weekly',
      autoBackupDestination: 'local',
      maxBackupVersions: 5,
      driveConnected: false,
      darkMode: 'system',
      language: 'vi',
      notificationsEnabled: false,
      reminderLeadDays: 3,
    },
    isLoaded: true,
  })
  useAuthStore.setState({
    isAuthenticated: true,
    isPinLocked: true,
    userProfile: { id: 'current-user', displayName: 'Test User', updatedAt: '' },
    googleAccessToken: null,
  })
}

// Render without using renderWithProviders to preserve custom store state
function renderPage() {
  return render(
    <MemoryRouter>
      <PinLockPage />
    </MemoryRouter>
  )
}

function clickDigits(digits: string) {
  for (const d of digits) {
    const btn = screen.getByRole('button', { name: d })
    fireEvent.click(btn)
  }
}

describe('PinLockPage — rendering', () => {
  beforeEach(async () => {
    await setupWithPIN('123456')
  })

  it('shows the username and PIN instruction', () => {
    renderPage()
    expect(screen.getByText(/Xin chào/)).toBeInTheDocument()
    expect(screen.getByText('Nhập mã PIN để mở khóa')).toBeInTheDocument()
  })

  it('renders all digit buttons 0-9', () => {
    renderPage()
    for (const d of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      expect(screen.getByRole('button', { name: d })).toBeInTheDocument()
    }
  })
})

describe('PinLockPage — wrong PIN', () => {
  beforeEach(async () => {
    await setupWithPIN('123456')
  })

  it('shows error message on wrong PIN', async () => {
    renderPage()
    clickDigits('000000')
    expect(await screen.findByText(/Mã PIN sai/)).toBeInTheDocument()
  })

  it('shows remaining attempts count after wrong PIN', async () => {
    renderPage()
    clickDigits('000000')
    expect(await screen.findByText(/Còn 4 lần thử/)).toBeInTheDocument()
  })
})

describe('PinLockPage — lockout after 5 failed attempts', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    await setupWithPIN('123456')
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows lockout message after 5 failed attempts', async () => {
    vi.useRealTimers() // need real timers for async PIN verification
    await setupWithPIN('123456')
    renderPage()

    for (let i = 0; i < 5; i++) {
      clickDigits('000000')
      await screen.findByText(/Mã PIN sai|Quá nhiều lần thử/)
    }

    expect(await screen.findByText('Quá nhiều lần thử sai. Chờ 30 giây.')).toBeInTheDocument()
  })

  it('disables digit buttons during lockout', async () => {
    vi.useRealTimers()
    await setupWithPIN('123456')
    renderPage()

    for (let i = 0; i < 5; i++) {
      clickDigits('000000')
      await screen.findByText(/Mã PIN sai|Quá nhiều lần thử/)
    }

    await screen.findByText('Quá nhiều lần thử sai. Chờ 30 giây.')
    const btn1 = screen.getByRole('button', { name: '1' })
    expect(btn1).toBeDisabled()
  })
})

describe('PinLockPage — correct PIN', () => {
  beforeEach(async () => {
    await setupWithPIN('123456')
  })

  it('sets isPinLocked to false on correct PIN', async () => {
    renderPage()
    clickDigits('123456')
    // Wait for async PIN verification
    await waitFor(() => {
      expect(useAuthStore.getState().isPinLocked).toBe(false)
    }, { timeout: 2000 })
  })
})

describe('PinLockPage — keyboard support', () => {
  beforeEach(async () => {
    await setupWithPIN('123456')
  })

  it('accepts keyboard digits and shows error on wrong PIN', async () => {
    const user = userEvent.setup()
    renderPage()
    // Type wrong PIN via keyboard
    await user.keyboard('000000')
    expect(await screen.findByText(/Mã PIN sai/)).toBeInTheDocument()
  })
})
