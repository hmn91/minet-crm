import { type ReactElement } from 'react'
import { render, type RenderOptions } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/types'

function initStores() {
  useAuthStore.setState({
    isAuthenticated: true,
    isPinLocked: false,
    userProfile: {
      id: 'current-user',
      displayName: 'Test User',
      updatedAt: new Date().toISOString(),
    },
    googleAccessToken: null,
  })
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    isLoaded: true,
  })
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialEntries = ['/'],
    skipStoreInit = false,
    ...options
  }: RenderOptions & { initialEntries?: string[]; skipStoreInit?: boolean } = {}
) {
  if (!skipStoreInit) initStores()
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      {ui}
    </MemoryRouter>,
    options
  )
}
