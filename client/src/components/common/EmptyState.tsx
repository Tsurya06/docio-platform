import { Empty, Button } from 'antd';

interface Props {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * EmptyState — small wrapper around AntD's `Empty` that adds a primary action slot.
 */
export default function EmptyState({ description = 'Nothing here yet.', actionLabel, onAction }: Props) {
  return (
    <Empty
      description={description}
      className="docio-empty"
      {...({
        extra: actionLabel && onAction ? (
          <Button type="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null
      } as any)}
    />
  );
}
