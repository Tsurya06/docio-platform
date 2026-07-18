import { Component } from 'react';
import { Result, Button } from 'antd';
import { logger } from '../../utils/logger.js';

/**
 * ErrorBoundary — class-based because React error boundaries still require a class
 * `componentDidCatch`. Catches render-time exceptions anywhere below and shows a
 * recovery card rather than the white-screen-of-death. Errors are forwarded to the
 * logger singleton (which pipes to Pino on the backend in prod, console in dev); in
 * dev we also keep a local copy in `__DEV_ERROR__` so the page can be refreshed after
 * a fix without losing the trace.
 *
 * Alternative: react-error-boundary (library). Rejected — it would add a dependency
 * for ~40 lines of code; the class lifecycle is exactly what we need.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    logger.error('react render error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <Result
        status="error"
        title="Something broke while rendering this page"
        subTitle="The error has been logged. Try reloading — if it persists, sign out and back in."
        extra={[
          <Button key="reload" type="primary" onClick={() => window.location.reload()}>
            Reload page
          </Button>,
          <Button key="reset" onClick={this.handleReset}>
            Try again
          </Button>,
        ]}
      />
    );
  }
}
