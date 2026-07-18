import { Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import { ROLE_LABELS } from '../../constants/roles.js';

/**
 * RoleGuard — UX-side gate for "logically two roles but same route" screens. If the
 * signed-in user's role isn't in `roles`, we render a 403 card explaining where they
 * should be heading instead. The server still enforces `requireRole` on the underlying
 * API; this UI just short-circuits the empty page-loads-of-loader-errors experience.
 *
 * Alternative: redirect to the user's own landing page immediately. Rejected — silent
 * redirects make it hard for a user to understand why a bookmarked URL "doesn't work";
 * a card telling them "this page is for <role>" is more honest.
 */
export default function RoleGuard({ roles, children }) {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const role = user?.role;
  if (role && roles.includes(role)) return children;

  const allowedLabel = roles.map((r) => ROLE_LABELS[r] ?? r).join(' or ');
  return (
    <Result
      status="403"
      title="You can't view this page"
      subTitle={`This page is available to ${allowedLabel} accounts only.`}
      extra={[
        <Button type="primary" key="home" onClick={() => navigate('/app')}>
          Go to my dashboard
        </Button>,
      ]}
    />
  );
}
