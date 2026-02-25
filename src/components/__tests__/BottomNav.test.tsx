import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders } from '@/test/helpers/render-helpers'
import { BottomNav } from '@/components/layout/BottomNav'

describe('BottomNav', () => {
  it('renders all 5 navigation items', () => {
    renderWithProviders(<BottomNav />)
    expect(screen.getByText('Trang chủ')).toBeInTheDocument()
    expect(screen.getByText('Liên hệ')).toBeInTheDocument()
    expect(screen.getByText('Sự kiện')).toBeInTheDocument()
    expect(screen.getByText('Cài đặt')).toBeInTheDocument()
  })

  it('links Trang chủ to /', () => {
    renderWithProviders(<BottomNav />)
    const homeLink = screen.getByRole('link', { name: /Trang chủ/ })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('links Liên hệ to /contacts', () => {
    renderWithProviders(<BottomNav />)
    const link = screen.getByRole('link', { name: /Liên hệ/ })
    expect(link).toHaveAttribute('href', '/contacts')
  })

  it('links Sự kiện to /events', () => {
    renderWithProviders(<BottomNav />)
    const link = screen.getByRole('link', { name: /Sự kiện/ })
    expect(link).toHaveAttribute('href', '/events')
  })

  it('links Cài đặt to /settings', () => {
    renderWithProviders(<BottomNav />)
    const link = screen.getByRole('link', { name: /Cài đặt/ })
    expect(link).toHaveAttribute('href', '/settings')
  })

  it('has a Plus/Add button linking to /contacts/new', () => {
    renderWithProviders(<BottomNav />)
    const links = screen.getAllByRole('link')
    const addLink = links.find(l => l.getAttribute('href') === '/contacts/new')
    expect(addLink).toBeDefined()
  })
})
