import { fireEvent, render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/HomePage'

describe('HomePage', () => {
  it('explains the project and presents both lobby actions', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Pick the game everyone wants to play.',
    )
    expect(screen.getByRole('button', { name: /create a lobby/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /join a lobby/i })).toBeInTheDocument()
  })

  it('does not pretend that lobby creation is already implemented', () => {
    render(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: /create a lobby/i }))

    expect(
      screen.getByText(/lobby creation is coming in the next development stage/i),
    ).toBeInTheDocument()
  })
})
