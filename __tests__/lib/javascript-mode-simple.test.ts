/**
 * @jest-environment node
 */

describe('JavaScript Mode Environment Variable', () => {
  const originalEnv = process.env;
  
  beforeEach(() => {
    process.env = { ...originalEnv };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });

  it('should enable JavaScript mode when ALLOW_JAVASCRIPT=true', () => {
    process.env.ALLOW_JAVASCRIPT = 'true';
    const allowJavaScript = process.env.ALLOW_JAVASCRIPT === 'true';
    expect(allowJavaScript).toBe(true);
  });

  it('should disable JavaScript mode when ALLOW_JAVASCRIPT=false', () => {
    process.env.ALLOW_JAVASCRIPT = 'false';
    const allowJavaScript = process.env.ALLOW_JAVASCRIPT === 'true';
    expect(allowJavaScript).toBe(false);
  });

  it('should disable JavaScript mode when ALLOW_JAVASCRIPT is not set', () => {
    delete process.env.ALLOW_JAVASCRIPT;
    const allowJavaScript = process.env.ALLOW_JAVASCRIPT === 'true';
    expect(allowJavaScript).toBe(false);
  });

  it('should be case sensitive (TRUE != true)', () => {
    process.env.ALLOW_JAVASCRIPT = 'TRUE';
    const allowJavaScript = process.env.ALLOW_JAVASCRIPT === 'true';
    expect(allowJavaScript).toBe(false);
  });

  it('should only accept exact "true" string', () => {
    const testValues = ['1', 'yes', 'on', 'True', 'TRUE', ''];
    
    testValues.forEach(value => {
      process.env.ALLOW_JAVASCRIPT = value;
      const allowJavaScript = process.env.ALLOW_JAVASCRIPT === 'true';
      expect(allowJavaScript).toBe(false);
    });
  });
});