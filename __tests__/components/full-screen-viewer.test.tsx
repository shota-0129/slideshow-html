import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FullScreenViewer } from '@/components/full-screen-viewer'

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('FullScreenViewer', () => {
  const defaultProps = {
    slug: 'test-presentation',
    currentPage: 1,
    totalPages: 3,
    slideContent: '<html><body><h1>Test Slide</h1></body></html>',
  }

  beforeEach(() => {
    mockPush.mockClear()
  })

  it('should render slide content in full screen iframe', () => {
    render(<FullScreenViewer {...defaultProps} />)
    
    const iframe = screen.getByTitle('Slide 1 (Full Screen)')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('srcDoc', defaultProps.slideContent)
    expect(iframe).toHaveAttribute('sandbox', 'allow-scripts')
  })

  it('should have full screen container styling', () => {
    render(<FullScreenViewer {...defaultProps} />)
    
    const container = screen.getByTitle('次へ進む')
    expect(container).toHaveClass('w-screen', 'h-screen', 'bg-black', 'cursor-pointer')
  })

  describe('keyboard navigation', () => {
    it('should navigate to next slide with right arrow key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} />)
      
      await user.keyboard('{ArrowRight}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2/full-screen')
    })

    it('should navigate to next slide with down arrow key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} />)
      
      await user.keyboard('{ArrowDown}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2/full-screen')
    })

    it('should navigate to next slide with enter key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} />)
      
      await user.keyboard('{Enter}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2/full-screen')
    })

    it('should navigate to next slide with space key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} />)
      
      await user.keyboard(' ')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2/full-screen')
    })

    it('should navigate to previous slide with left arrow key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={2} />)
      
      await user.keyboard('{ArrowLeft}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/1/full-screen')
    })

    it('should navigate to previous slide with up arrow key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={2} />)
      
      await user.keyboard('{ArrowUp}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/1/full-screen')
    })

    it('should close full-screen when on last slide and pressing next keys', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={3} totalPages={3} />)
      
      await user.keyboard('{ArrowRight}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/3')
    })

    it('should close full-screen when on last slide and pressing down key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={3} totalPages={3} />)
      
      await user.keyboard('{ArrowDown}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/3')
    })

    it('should close full-screen when on last slide and pressing enter key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={3} totalPages={3} />)
      
      await user.keyboard('{Enter}')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/3')
    })

    it('should close full-screen when on last slide and pressing space key', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={3} totalPages={3} />)
      
      await user.keyboard(' ')
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/3')
    })

    it('should try to close browser tab with escape key', async () => {
      const user = userEvent.setup()
      const mockClose = jest.fn()
      Object.defineProperty(window, 'close', { value: mockClose })
      
      render(<FullScreenViewer {...defaultProps} />)
      
      await user.keyboard('{Escape}')
      expect(mockClose).toHaveBeenCalled()
    })

    it('should not navigate beyond first page', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={1} />)
      
      await user.keyboard('{ArrowLeft}')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('click navigation', () => {
    it('should navigate to next slide when clicking', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} />)
      
      const container = screen.getByTitle('次へ進む')
      await user.click(container)
      
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/2/full-screen')
    })

    it('should close full-screen when clicking on last slide', async () => {
      const user = userEvent.setup()
      render(<FullScreenViewer {...defaultProps} currentPage={3} totalPages={3} />)
      
      const container = screen.getByTitle('次へ進む')
      await user.click(container)
      
      expect(mockPush).toHaveBeenCalledWith('/presentations/test-presentation/3')
    })
  })

  describe('responsive scaling', () => {
    it('should set up ResizeObserver for responsive scaling', () => {
      render(<FullScreenViewer {...defaultProps} />)
      
      expect(global.ResizeObserver).toHaveBeenCalled()
    })

    it('should have fixed slide dimensions with scaling transform', () => {
      render(<FullScreenViewer {...defaultProps} />)
      
      const slideContainer = screen.getByTitle('Slide 1 (Full Screen)').parentElement
      expect(slideContainer).toHaveStyle({
        width: '1280px',
        height: '720px',
      })
    })
  })
})