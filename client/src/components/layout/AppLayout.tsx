import { useState, useMemo } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Avatar, Dropdown, Space } from 'antd';
import {
  LogoutOutlined,
  UserOutlined,
  MoonOutlined,
  SunOutlined,
  MenuOutlined,
  CloseOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useLogoutMutation } from '../../app/api/authApi.js';
import { clearAccessToken } from '../../app/api/baseQuery.js';
import { clearCredentials, selectCurrentUser } from '../../features/auth/authSlice.js';
import { ROLE_LABELS } from '../../constants/roles.js';
import { useTheme } from '../../app/theme/ThemeProvider.js';
import type { NavItem, UserRole } from '../../types/index.js';
import './layout.css';

interface Props {
  navItems: NavItem[];
  brand?: string;
}

/**
 * AppLayout — the single shared chrome for every authenticated page.
 * Redesigned to be modern, ultra-responsive, and pixel-perfect.
 */
export default function AppLayout({ navItems, brand = 'Docio' }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();
  const { isDark, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

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

  const handleNavClick = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className={`portal-layout-container ${isDark ? 'layout-dark' : 'layout-light'}`}>
      {/* Mobile Drawer Backdrop */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 95,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Redesigned Sidebar Sider */}
      <aside className={`portal-sider ${menuOpen ? 'open' : ''}`}>
        <div className="portal-sider-header">
          <a href="/app" className="portal-brand" onClick={(e) => { e.preventDefault(); navigate('/app'); }}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#2563eb" />
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
            <span style={{ background: 'linear-gradient(to right, var(--portal-accent), #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{brand}</span>
          </a>
        </div>

        <ul className="portal-nav-list">
          {navItems.map((item) => {
            const isActive = selectedKey === item.path;
            return (
              <li key={item.path} className="portal-nav-item">
                <button
                  type="button"
                  className={`portal-nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.path)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Right Shell container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header bar */}
        <header className="portal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="portal-menu-toggle"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <CloseOutlined style={{ fontSize: 18 }} /> : <MenuOutlined style={{ fontSize: 18 }} />}
            </button>
            <span className="portal-header-title">
              {role ? (ROLE_LABELS[role] ?? 'Account') : 'Account'} portal
            </span>
          </div>

          <Space size="middle">
            <button
              type="button"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              onClick={toggleTheme}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--portal-text-secondary)',
                fontSize: 16,
                padding: 6,
                borderRadius: '50%',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--portal-nav-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              {isDark ? <SunOutlined /> : <MoonOutlined />}
            </button>

            <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
              <button type="button" className="portal-user-menu-trigger">
                <Avatar size="small" icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                <span className="portal-user-name" style={{ display: 'inline-block', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user ? `${user.firstName} ${user.lastName ?? ''}`.trim() : ''}
                </span>
                {role && <span className="portal-role-tag">{role}</span>}
                <DownOutlined style={{ fontSize: 10, color: 'var(--portal-text-secondary)' }} />
              </button>
            </Dropdown>
          </Space>
        </header>

        {/* Content area */}
        <main className="portal-main">
          <div className="portal-content">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
