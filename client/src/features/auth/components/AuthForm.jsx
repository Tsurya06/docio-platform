import { Card, theme } from 'antd';

/**
 * AuthForm — presentational wrapper for the four auth pages (login, register,
 * forgot-password, reset-password). Common concerns only: a centered card on a muted
 * background, a server-side error banner set when the parent's `error` prop is non-null,
 * and a footer slot for cross-links ("Already have an account? Sign in").
 *
 * Why a wrapper component (not a per-page config object): we want the field list visible
 * in JSX inside each page so a reader doesn't have to bounce between files just to
 * learn what a login form looks like. The concerns that *do* repeat — outer layout,
 * banner placement — are minimal, so the wrapper stays thin.
 *
 * Alternative: `useAuthForm()` hook. Rejected — a hook can't enforce structural layout;
 * each page would still hand-roll the card frame and toast wiring. Keeping it as a
 * component gives us exactly one place to update the auth screen UX.
 *
 * All colors derive from AntD tokens (`theme.useToken`) so the auth screens follow dark
 * mode automatically — no hardcoded `#fff2f0`/`rgba(0,0,0,...)` that would wash out.
 */
export default function AuthForm({ title, subtitle, error, children, footer }) {
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

function AlertError({ error }) {
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
