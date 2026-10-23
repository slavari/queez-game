import { fireEvent, render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/HomePage'

describe('HomePage', () => {
  it('explains the project and presents both lobby actions', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Во что играем сегодня?')
    expect(screen.getByRole('button', { name: /создать лобби/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /присоединиться к лобби/i })).toBeInTheDocument()
  })

  it('does not pretend that lobby creation is already implemented', () => {
    render(<HomePage />)

    fireEvent.click(screen.getByRole('button', { name: /создать лобби/i }))

    expect(screen.getByText(/создание лобби появится на следующем этапе/i)).toBeInTheDocument()
  })
})
