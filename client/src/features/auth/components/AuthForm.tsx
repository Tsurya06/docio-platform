import { type ReactNode } from 'react';
import { useTheme } from '../../../app/theme/ThemeProvider.js';
import { SafetyCertificateOutlined } from '@ant-design/icons';
import '../auth.css';

interface Props {
  title: string;
  subtitle?: string | null;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * AuthForm — presentational wrapper for the four auth pages.
 * Redesigned to support a modern split-screen design.
 */
export default function AuthForm({ title, subtitle, error, children, footer }: Props) {
  const { isDark } = useTheme();

  return (
    <div className={`auth-page-container ${isDark ? 'auth-dark' : 'auth-light'}`}>
      {/* Left side: branding showcase */}
      <div className="auth-side-showcase">
        <div className="auth-logo-text">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <path
              d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"
              stroke="url(#logo-grad)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 6v12M6 12h12"
              stroke="url(#logo-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span style={{ background: 'linear-gradient(to right, var(--auth-accent), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Docio</span>
        </div>

        <div className="auth-showcase-content">
          <h2 className="auth-showcase-title">Connecting care, simplified.</h2>
          <p className="auth-showcase-desc">
            Access your personalized portal to consult with leading medical practitioners, schedule consultations, and manage your health information.
          </p>

          {/* Premium trust testimonial card */}
          <div className="auth-showcase-testimonial">
            <div className="auth-testimonial-stars">★★★★★</div>
            <p className="auth-testimonial-quote">
              &ldquo;Docio has completely transformed how I manage my appointments. The platform is secure, incredibly fast, and very easy to navigate.&rdquo;
            </p>
            <div className="auth-testimonial-author">
              <div className="auth-avatar">SJ</div>
              <div>
                <div className="auth-author-name">Sarah Jenkins</div>
                <div className="auth-author-role">Patient since 2024</div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-showcase-footer">
          <span>&copy; {new Date().getFullYear()} Docio Inc.</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <SafetyCertificateOutlined style={{ color: 'var(--auth-accent)' }} /> Secure Health Portal
          </span>
        </div>
      </div>

      {/* Right side: login card */}
      <div className="auth-form-container">
        <div className="auth-form-box">
          <header className="auth-header">
            <h1 className="auth-title">{title}</h1>
            {subtitle ? <p className="auth-subtitle">{subtitle}</p> : null}
          </header>

          {error ? <AlertError error={error} /> : null}

          {children}

          {footer ? <div className="auth-footer-links">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}

interface AlertErrorProps {
  error: string;
}

function AlertError({ error }: AlertErrorProps) {
  return (
    <div role="alert" className="auth-error-alert">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{error}</span>
    </div>
  );
}

