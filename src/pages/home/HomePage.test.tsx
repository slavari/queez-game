import { render, screen } from '@testing-library/react'

import { HomePage } from '@/pages/home/HomePage'

describe('HomePage', () => {
  it('clearly presents the project as a foundation, not a working room flow', () => {
    render(<HomePage />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Одна компания.')
    expect(screen.getByText(/комнаты и голосование ещё не реализованы/i)).toBeInTheDocument()
  })
})
