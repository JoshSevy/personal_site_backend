# Security Policy

## Supported Versions

We actively support security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Email security details to: [your-email@example.com]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide an update on our progress within 7 days.

## Security Best Practices

When using this project:

- Keep your dependencies updated
- Never commit `.env` files or API keys
- Use environment variables for sensitive configuration
- Regularly review and rotate API keys and tokens
- Follow the principle of least privilege for database access

## Known Security Considerations

- This project uses Supabase for authentication and database access
- JWT tokens are used for authentication - ensure proper token validation
- Environment variables are required for Supabase credentials
- RLS (Row Level Security) policies should be configured in Supabase

