import { type ReactNode } from 'react';
import { Result, Button } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { selectCurrentUser } from '../../features/auth/authSlice.js';
import { ROLE_LABELS } from '../../constants/roles.js';
import type { UserRole } from '../../types/index.js';

interface Props {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * RoleGuard — UX-side gate for "logically two roles but same route" screens.
 */
export default function RoleGuard({ roles, children }: Props) {
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const role = user?.role;
  if (role && roles.includes(role)) return <>{children}</>;

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
