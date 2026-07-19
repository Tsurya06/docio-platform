import { Spin } from 'antd';

interface Props {
  label?: string;
}

/**
 * Centered spinner — used by ProtectedRoute while auth status is `unknown`.
 */
export default function Loading({ label = 'Loading…' }: Props) {
  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', gap: 12 }}>
      <Spin tip={label} size="large">
        <span style={{ padding: '1rem', display: 'inline-block' }} />
      </Spin>
    </div>
  );
}
