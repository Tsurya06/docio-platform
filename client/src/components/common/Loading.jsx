import { Spin } from 'antd';

/**
 * Centered spinner — used by ProtectedRoute while auth status is `unknown` (post-reload
 * rehydration race) and anywhere a page needs to wait on a single critical query
 * before continuing. For parallel queries prefer AntD's `Skeleton` per-panel so the
 * user sees structure instead of a blank canvas.
 *
 * Alternative: AntD's `Spin tip="Loading..."`. We deliberately avoid the `tip` here —
 * it tends to wrap awkwardly once `Spin` is sized up, and users interpret a centered
 * spinner with no text as "this is still working" without further comment.
 */
export default function Loading({ label = 'Loading…' }) {
  return (
    <div style={{ minHeight: '100%', display: 'grid', placeItems: 'center', gap: 12 }}>
      <Spin tip={label} size="large">
        <span style={{ padding: '1rem', display: 'inline-block' }} />
      </Spin>
    </div>
  );
}
