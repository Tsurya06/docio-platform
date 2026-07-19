import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd';
import { logger } from '../../utils/logger.js';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * ErrorBoundary — class-based because React error boundaries still require a class
 * `componentDidCatch`. Catches render-time exceptions anywhere below and shows a
 * recovery card rather than the white-screen-of-death.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }): void {
    logger.error('react render error', {
      message: error?.message,
      stack: error?.stack,
      componentStack: info?.componentStack,
    });
  }

  handleReset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
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
