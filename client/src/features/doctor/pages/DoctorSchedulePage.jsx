import { Card, List, Tag, Typography, Button, Space, App as AntApp } from 'antd';
import {
  useListDoctorAppointmentsQuery,
  useManageAppointmentMutation,
  useCancelAppointmentMutation,
} from '../../../app/api/appointmentApi.js';
import { STATUS_META, STATUS_FLOW } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { useServerError } from '../../auth/hooks.js';

const { Title, Paragraph } = Typography;

/**
 * DoctorSchedulePage (Step 14) — replaces the Step 12 read-only shim with a full
 * schedule management surface. Each row's primary actions are derived from
 * `STATUS_FLOW[status]` — the legal transitions the backend will accept — so an
 * appointment that already reached terminal state (cancelled / rejected / completed)
 * shows no actions and behaves like archived history. The buttons themselves dispatch
 * against the existing `/appointments/:id/manage` endpoint; cancel forwards to the
 * `/appointments/:id/cancel` endpoint that patient's cancel also uses.
 *
 * Why we don't optimistic-update: managing an appointment has side effects: bookkeeping
 * for `totalAppointments` on completion, slot restoration on cancel, notification
 * triggers. A stale-success message after a network failure is materially worse than the
 * button being disabled for the round-trip duration.
 */
export default function DoctorSchedulePage() {
  useTitle('My schedule');
  const { message } = AntApp.useApp();
  const serverError = useServerError();
  const { data, isLoading, error } = useListDoctorAppointmentsQuery({ limit: 200 });
  const [manage, { isLoading: managing }] = useManageAppointmentMutation();
  const [cancel, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const items = data?.data ?? [];

  const runAction = async (id, kind, payload) => {
    try {
      if (kind === 'cancel') {
        await cancel({ id, body: payload ?? {} }).unwrap();
        message.success('Appointment cancelled');
      } else {
        await manage({ id, body: { action: kind } }).unwrap();
        message.success(`Appointment ${kind}ed`);
      }
    } catch (err) {
      message.error(serverError(err, `Could not ${kind} that appointment`));
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>My schedule</Title>
      <Paragraph type="secondary">Act on each appointment. Completed and cancelled rows are archived automatically.</Paragraph>

      <Card loading={isLoading}>
        {error ? (
          <Paragraph type="danger">Couldn't load schedule.</Paragraph>
        ) : items.length === 0 ? (
          <EmptyState description="No appointments yet." />
        ) : (
          <List
            dataSource={items}
            renderItem={(a) => (
              <List.Item
                actions={renderActions(a, managing || cancelling, runAction)}
              >
                <List.Item.Meta
                  avatar={<Tag color={STATUS_META[a.status]?.badge}>{STATUS_META[a.status]?.label ?? a.status}</Tag>}
                  title={`${a.appointmentDate} · ${a.startTime}–${a.endTime}`}
                  description={a.reason || '(no reason given)'}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}

function renderActions(appointment, busy, runAction) {
  const allowed = STATUS_FLOW[appointment.status] ?? [];
  const buttons = [];
  if (allowed.includes('confirmed')) {
    buttons.push(
      <Button key="confirm" type="primary" size="small" loading={busy} onClick={() => runAction(appointment._id, 'confirm')}>
        Confirm
      </Button>,
    );
  }
  if (allowed.includes('rejected')) {
    buttons.push(
      <Button key="reject" danger size="small" loading={busy} onClick={() => runAction(appointment._id, 'reject')}>
        Reject
      </Button>,
    );
  }
  if (allowed.includes('completed')) {
    buttons.push(
      <Button key="complete" size="small" loading={busy} onClick={() => runAction(appointment._id, 'complete')}>
        Complete
      </Button>,
    );
  }
  if (allowed.includes('cancelled')) {
    buttons.push(
      <Button key="cancel" size="small" loading={busy} onClick={() => runAction(appointment._id, 'cancel')}>
        Cancel
      </Button>,
    );
  }
  return buttons.length ? [<Space key="actions">{buttons}</Space>] : [];
}
