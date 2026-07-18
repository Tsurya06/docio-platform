import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import { store } from './app/store.js';
import App from './App.jsx';
import { ThemeProvider, useTheme } from './app/theme/ThemeProvider.jsx';

/**
 * AntD 5 uses a ConfigProvider for theme + locale. We pin the AntD modal/message/notification
 * context via <AntApp> so child components can use `App.useApp()` for static-style APIs
 * (message.success, etc.) without losing theme overrides.
 *
 * The ConfigProvider lives *inside* <ThemeProvider> so it can read the current `mode` and swap
 * `theme.algorithm` between `defaultAlgorithm` (light) and `darkAlgorithm`. Every token-based
 * style below (`token.colorBgContainer`, etc.) then follows automatically — dark mode is the
 * algorithm flip plus the token sweep in the page components, nothing bespoke per component.
 */
function ThemedRoot() {
  const { isDark } = useTheme();
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: { colorPrimary: '#1677ff' },
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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <ThemedRoot />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
