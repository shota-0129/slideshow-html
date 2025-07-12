import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PresentationViewer } from '@/components/presentation-viewer'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('PresentationViewer', () => {
  const defaultProps = {
    slug: 'test-presentation',
    currentPage: 1,
    totalPages: 3,
    slideContent: '<html><body><h1>Test Slide</h1></body></html>',
  }

  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render presentation title and navigation', () => {
    render(<PresentationViewer {...defaultProps} />)
    
    expect(screen.getByText('Test Presentation')).toBeInTheDocument()
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
    expect(screen.getByText('前へ')).toBeInTheDocument()
    expect(screen.getByText('次へ')).toBeInTheDocument()
  })

  it('should disable previous button on first page', () => {
    render(<PresentationViewer {...defaultProps} currentPage={1} />)
    
    const prevButton = screen.getByText('前へ').closest('button')
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(<PresentationViewer {...defaultProps} currentPage={3} />)
    
    const nextButton = screen.getByText('次へ').closest('button')
    expect(nextButton).toBeDisabled()
  })

  it('should render slide content in iframe', () => {
    render(<PresentationViewer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Slide 1')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('srcDoc', defaultProps.slideContent)
  })

  it('should have full-screen button that opens in new tab', () => {
    render(<PresentationViewer {...defaultProps} />)
    
    const fullScreenLink = screen.getByTitle('全画面で表示').closest('a')
    expect(fullScreenLink).toHaveAttribute('href', '/presentations/test-presentation/1/full-screen')
    expect(fullScreenLink).toHaveAttribute('target', '_blank')
    expect(fullScreenLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('should have home button linking to homepage', () => {
    render(<PresentationViewer {...defaultProps} />)
    
    const homeLink = screen.getByTitle('ホームに戻る').closest('a')
    expect(homeLink).toHaveAttribute('href', '/')
  })

  describe('keyboard navigation', () => {
    it('should navigate to next slide with right arrow key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} />)
      
      await user.keyboard('{ArrowRight}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2')
    })

    it('should navigate to next slide with down arrow key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} />)
      
      await user.keyboard('{ArrowDown}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2')
    })

    it('should navigate to next slide with enter key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} />)
      
      await user.keyboard('{Enter}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2')
    })

    it('should navigate to next slide with space key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} />)
      
      await user.keyboard(' ')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2')
    })

    it('should navigate to previous slide with left arrow key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} currentPage={2} />)
      
      await user.keyboard('{ArrowLeft}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/1')
    })

    it('should navigate to previous slide with up arrow key', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} currentPage={2} />)
      
      await user.keyboard('{ArrowUp}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/1')
    })

    it('should not navigate beyond first page', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} currentPage={1} />)
      
      await user.keyboard('{ArrowLeft}')
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should not navigate beyond last page', async () => {
      const user = userEvent.setup()
      render(<PresentationViewer {...defaultProps} currentPage={3} />)
      
      await user.keyboard('{ArrowRight}')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('responsive scaling', () => {
    it('should set up ResizeObserver for responsive scaling', () => {
      render(<PresentationViewer {...defaultProps} />)
      
      expect(global.ResizeObserver).toHaveBeenCalled()
    })
  })

  describe('accessibility', () => {
    it('should have proper ARIA attributes for disabled buttons', () => {
      render(<PresentationViewer {...defaultProps} currentPage={1} />)
      
      const prevLink = screen.getByText('前へ').closest('a')
      expect(prevLink).toHaveAttribute('aria-disabled', 'true')
    })

    it('should have proper iframe title', () => {
      render(<PresentationViewer {...defaultProps} />)
      
      const iframe = screen.getByTitle('Slide 1')
      expect(iframe).toBeInTheDocument()
    })
  })
})