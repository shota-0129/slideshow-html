// Manual mock for puppeteer to prevent initialization issues
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue({
    setExtraHTTPHeaders: jest.fn(),
    setViewport: jest.fn(),
    setDefaultTimeout: jest.fn(),
    goto: jest.fn(),
    screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
    close: jest.fn(),
  }),
  close: jest.fn(),
}

const puppeteer = {
  launch: jest.fn().mockResolvedValue(mockBrowser),
  default: {
    launch: jest.fn().mockResolvedValue(mockBrowser),
  },
}

module.exports = puppeteer