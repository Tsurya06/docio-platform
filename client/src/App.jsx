import ErrorBoundary from './components/common/ErrorBoundary.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

/**
 * App — the inner shell wrapping the routed tree with a single ErrorBoundary. We keep
 * ErrorBoundary outside of BrowserRouter (added in `main.jsx`) so a routing-tree crash
 * is still caught; if the boundary lived inside BrowserRouter, a render-time error in
 * <AppRoutes> would skip past it.
 *
 * Boot is split across two layers: `main.jsx` mounts the providers (Redux, AntD theme,
 * router) before this component renders; AppRoutes does the one-shot `getMe` call
 * that rehydrates the auth status from the httpOnly refresh cookie.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
