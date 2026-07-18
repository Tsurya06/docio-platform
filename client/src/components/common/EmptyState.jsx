import { Empty, Button } from 'antd';

/**
 * EmptyState — small wrapper around AntD's `Empty` that adds a primary action slot.
 * Used by listing pages (appointments, doctors, admin tables) so every "no data" view
 * has a consistent look + call to action. Pass `actionLabel` + `onAction` to render a
 * button below the message; omit them for a plain empty state.
 *
 * Why not just `Empty description="..."`: each page that shows a list also has a
 * primary "create" or "search" link we want to surface, and duplicating the button +
 * description block in four+ places is the kind of thing that drifts apart over time.
 *
 * Color note: the secondary description color uses AntD's `token.colorTextSecondary`, not a
 * hardcoded `rgba(0,0,0,...)`, so it stays readable in both light and dark mode.
 */
export default function EmptyState({ description = 'Nothing here yet.', actionLabel, onAction }) {
  return (
    <Empty
      description={description}
      className="docio-empty"
      extra={
        actionLabel && onAction ? (
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null
      }
    />
  );
}
