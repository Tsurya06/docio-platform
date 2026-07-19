import { Layout, Menu, Avatar, Dropdown, Button, Space, theme } from 'antd';
import { LogoutOutlined, UserOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutMutation } from '../../app/api/authApi.js';
import { clearAccessToken } from '../../app/api/baseQuery.js';
import { clearCredentials, selectCurrentUser } from '../../features/auth/authSlice.js';
import { ROLE_LABELS } from '../../constants/roles.js';
import { useTheme } from '../../app/theme/ThemeProvider.js';
import type { NavItem, UserRole } from '../../types/index.js';

const { Header, Sider, Content } = Layout;

interface Props {
  navItems: NavItem[];
  brand?: string;
}

/**
 * AppLayout — the single shared chrome for every authenticated page.
 */
export default function AppLayout({ navItems, brand = 'Docio' }: Props) {
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const { isDark, toggleTheme } = useTheme();

  const handleLogout = async (): Promise<void> => {
    try {
      await logout().unwrap();
    } finally {
      clearAccessToken();
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

  const role = user?.role as UserRole | undefined;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth={0} width={220} style={{ background: token.colorBgContainer }}>
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
          <div style={{ fontWeight: 600 }}>{role ? (ROLE_LABELS[role] ?? 'Account') : 'Account'} portal</div>
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
