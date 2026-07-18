import { Layout, Menu, Avatar, Dropdown, Button, Space, theme } from 'antd';
import { LogoutOutlined, UserOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../app/api/authApi.js';
import { clearAccessToken } from '../../app/api/baseQuery.js';
import { clearCredentials, selectCurrentUser } from '../../features/auth/authSlice.js';
import { ROLE_LABELS } from '../../constants/roles.js';
import { useTheme } from '../../app/theme/ThemeProvider.jsx';

const { Header, Sider, Content } = Layout;

/**
 * AppLayout — the single shared chrome for every authenticated page. Role-specific
 * navigation comes in through the `navItems` prop so each role section owns its own
 * menu without re-implementing the header/sider/content scaffold. The user dropdown in
 * the header carries the logout button — logout invalidates the server-side refresh
 * token (clears the httpOnly cookie) + clears the in-memory access token + flips auth
 * status to anonymous; the ProtectedRoute above then sends the user back to /login.
 *
 * Alternative: per-role layout components with full duplication. Rejected — duplication
 * would mean a copy of the logout flow and dropdown JSX in three places; the only thing
 * that actually differs between roles is the nav.
 */
export default function AppLayout({ navItems, brand = 'Docio' }) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
    } finally {
      clearAccessToken();
      // The authApi `logout` mutation's `onQueryStarted` already dispatches
      // `clearCredentials`, but if the network call hangs we want the UI released
      // immediately. Dispatching again is idempotent — both paths converge.
      dispatch(clearCredentials());
      navigate('/login', { replace: true });
    }
  };

  const selectedKey = useMemo(() => {
    const match = navItems.find((item) => location.pathname.startsWith(item.path));
    return match?.path ?? '';
  }, [navItems, location.pathname]);

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Sign out',
        onClick: handleLogout,
      },
    ],
  };

  const role = user?.role;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" width={220} style={{ background: token.colorBgContainer }}>
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: 56,
            fontWeight: 700,
            letterSpacing: 1,
            color: token.colorText,
          }}
        >
          {brand}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={navItems.map((item) => ({
            key: item.path,
            icon: item.icon,
            label: item.label,
            onClick: () => navigate(item.path),
          }))}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingInline: 24,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <div style={{ fontWeight: 600 }}>{ROLE_LABELS[role] ?? 'Account'} portal</div>
          <Space size="small">
            <Button
              type="text"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggleTheme}
            />
            <Dropdown menu={userMenu} placement="bottomRight">
              <button
                type="button"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: token.colorText,
                }}
              >
                <Avatar size="small" icon={<UserOutlined />} />
                <span>{user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : ''}</span>
              </button>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ padding: 24, background: token.colorBgLayout }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
