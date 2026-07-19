import { type ReactNode } from 'react';
import { Card, theme } from 'antd';

interface Props {
  title: string;
  subtitle?: string | null;
  error?: string | null;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * AuthForm — presentational wrapper for the four auth pages.
 */
export default function AuthForm({ title, subtitle, error, children, footer }: Props) {
  const { token } = theme.useToken();
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: token.colorBgLayout,
      }}
    >
      <Card
        style={{ width: 'min(440px, 100%)', boxShadow: token.boxShadowSecondary }}
        bordered
      >
        <h1 style={{ marginTop: 0, marginBottom: 4, fontSize: 22 }}>{title}</h1>
        {subtitle ? <p style={{ marginBottom: 16, color: token.colorTextSecondary }}>{subtitle}</p> : null}
        {error ? <AlertError error={error} /> : null}
        {children}
        {footer ? <div style={{ marginTop: 16, textAlign: 'center' }}>{footer}</div> : null}
      </Card>
    </div>
  );
}

interface AlertErrorProps {
  error: string;
}

function AlertError({ error }: AlertErrorProps) {
  const { token } = theme.useToken();
  return (
    <div
      role="alert"
      style={{
        marginTop: 4,
        marginBottom: 16,
        padding: '8px 12px',
        background: token.colorErrorBg,
        border: `1px solid ${token.colorErrorBorder}`,
        borderRadius: token.borderRadius,
        color: token.colorErrorText,
        fontSize: 13,
      }}
    >
      {error}
    </div>
  );
}
