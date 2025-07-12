# Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability, please follow these steps:

### 🚨 Do NOT create a public GitHub issue for security vulnerabilities

Instead, please report security vulnerabilities privately:

1. **Email**: Send details to [security@example.com] (replace with actual email)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
3. **Include**: 
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### What to expect

- **Acknowledgment**: We'll acknowledge receipt within 48 hours
- **Assessment**: Initial assessment within 5 business days
- **Updates**: Regular updates on our progress
- **Resolution**: We aim to resolve critical issues within 30 days

### Security Features

This application implements multiple security layers:

#### Input Validation & Sanitization
- **Path Traversal Protection**: All file paths are validated and sanitized
- **HTML Sanitization**: User content is sanitized to prevent XSS attacks
- **Input Size Limits**: File size and content length restrictions

#### API Security
- **Rate Limiting**: API endpoints are protected against abuse
- **Request Validation**: All API parameters are strictly validated
- **Timeout Protection**: Prevents resource exhaustion attacks

#### Browser Security
- **Content Security Policy (CSP)**: Strict CSP headers prevent XSS
- **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- **Iframe Sandboxing**: Presentation content is sandboxed

#### Server Security
- **Puppeteer Sandboxing**: Browser processes run in secure sandbox
- **Error Handling**: Production errors don't leak sensitive information
- **Resource Limits**: Memory and CPU usage limits prevent DoS

### Security Best Practices for Users

#### For Developers
- Keep dependencies updated (`npm audit` regularly)
- Use environment variables for sensitive configuration
- Enable all security features in production
- Monitor logs for suspicious activity

#### For Content Creators
- Only use trusted HTML content
- Avoid inline JavaScript in presentations
- Test presentations in a safe environment first
- Keep file sizes reasonable

#### For Deployment
- Use HTTPS in production
- Configure proper firewall rules
- Enable security monitoring
- Regular security updates

### Known Security Considerations

#### HTML Content
- This application displays HTML content in iframes
- Content is sanitized but complex HTML may still pose risks
- Always review HTML content before deployment

#### Puppeteer Usage
- Puppeteer runs headless Chrome for thumbnail generation
- Proper sandboxing is implemented but resource usage should be monitored
- Consider using pre-generated thumbnails in high-traffic scenarios

#### Static vs Dynamic Deployment
- **Static Export**: Highest security (no server-side code)
- **Server-Side Rendering**: More features but requires proper security configuration
- **Development Mode**: Should never be used in production

### Security Checklist for Production

- [ ] Environment variables properly configured
- [ ] Rate limiting enabled
- [ ] HTML sanitization enabled
- [ ] CSP headers configured
- [ ] HTTPS enabled
- [ ] Security monitoring in place
- [ ] Regular dependency updates scheduled
- [ ] Error logging configured (without sensitive data)
- [ ] Backup and recovery plan in place

### Responsible Disclosure

We believe in responsible disclosure and will:

- Work with security researchers to understand and fix issues
- Provide credit to researchers who report vulnerabilities responsibly
- Maintain transparency about security issues after they're resolved
- Share lessons learned with the community

### Security Updates

Security updates will be:

- Released as soon as possible after verification
- Clearly marked in release notes
- Accompanied by migration guides if needed
- Announced through our security mailing list

Thank you for helping keep HTML Slideshow Viewer secure! 🔒