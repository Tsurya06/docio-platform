import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { store } from './app/store.js';
import App from './App.jsx';
import { ThemeProvider, useTheme } from './app/theme/ThemeProvider.js';

// Unregister any legacy service workers from other projects on localhost
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister().then((success) => {
        if (success) {
          console.log('[Docio] Legacy Service Worker unregistered successfully.');
          window.location.reload();
        }
      });
    }
  });
}

function ThemedRoot() {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          borderRadius: 8,
          colorBgLayout: isDark ? '#09090b' : '#f8fafc',
          colorBgContainer: isDark ? '#0f0f12' : '#ffffff',
          colorBorderSecondary: isDark ? '#27272a' : '#e2e8f0',
        },
        components: {
          Card: {
            boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
            boxShadowSecondary: isDark 
              ? '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)'
              : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
          },
          Button: {
            controlHeight: 38,
            borderRadius: 6,
          },
          Table: {
            borderRadius: 8,
          }
        }
      }}
    >
      <AntApp>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
