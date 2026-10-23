import { fireEvent, render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/HomePage'

const navigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

describe('HomePage', () => {
  it('explains the project and presents both lobby actions', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pick the game everyone wants to play.',
    )
    expect(screen.getByRole('button', { name: /create a lobby/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a lobby/i })).toBeInTheDocument()
    expect(screen.queryByText('Game Pick')).not.toBeInTheDocument()
    expect(screen.queryByText('Choose together. Play sooner.')).not.toBeInTheDocument()
  })

  it('starts the real lobby creation flow by requesting a Steam profile', () => {
    render(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: /create a lobby/i }))

    expect(screen.getByRole('heading', { name: /connect your steam profile/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/steam profile url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /load steam profile/i })).toBeInTheDocument()
  })

  it('asks for an invite before joining a lobby', () => {
    render(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: /join a lobby/i }))

    expect(screen.getByLabelText(/invite link or room id/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /connect your steam profile/i })).toBeInTheDocument()
  })
})
