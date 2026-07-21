import { Card, List, Tag, Typography, Button, Space, App as AntApp, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import {
  useListDoctorAppointmentsQuery,
  useManageAppointmentMutation,
  useCancelAppointmentMutation,
} from '../../../app/api/appointmentApi.js';
import { STATUS_META, STATUS_FLOW, STATUS } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { useServerError } from '../../auth/hooks.js';
import type { Appointment, AppointmentStatus } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({
  value,
  label: STATUS_META[value]?.label ?? value,
}));

function parseAppointmentStatus(val: string | null): AppointmentStatus | undefined {
  if (!val) return undefined;
  return Object.values(STATUS).includes(val as AppointmentStatus) ? (val as AppointmentStatus) : undefined;
}

export default function DoctorSchedulePage() {
  useTitle('My schedule');
  const [searchParams, setSearchParams] = useSearchParams();
  const { message } = AntApp.useApp();
  const serverError = useServerError();

  const page = Number(searchParams.get('page')) || 1;
  const dateStr = searchParams.get('date') ?? undefined;
  const status = parseAppointmentStatus(searchParams.get('status'));

  const updateParams = (newParams: Record<string, string | number | undefined | null>) => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams(prev);
      Object.entries(newParams).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '') {
          updated.delete(key);
        } else {
          updated.set(key, String(val));
        }
      });
      return updated;
    }, { replace: true });
  };

  const { data, isLoading, error } = useListDoctorAppointmentsQuery({
    page,
    limit: 10,
    date: dateStr || undefined,
    status: status || undefined,
  });
  const [manage, { isLoading: managing }] = useManageAppointmentMutation();
  const [cancel, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const items = data?.data ?? [];

  const runAction = async (id: string, kind: string, payload?: Record<string, unknown>) => {
    try {
      if (kind === 'cancel') {
        await cancel({ id, body: payload ?? {} }).unwrap();
        message.success('Appointment cancelled');
      } else {
        await manage({ id, body: { action: kind } }).unwrap();
        message.success(`Appointment ${kind}ed`);
      }
    } catch (err: any) {
      message.error(serverError(err, `Could not ${kind} that appointment`));
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>My schedule</Title>
      <Paragraph type="secondary">Act on each appointment. Filter by date or status.</Paragraph>

      <Card loading={isLoading}>
        <Space style={{ marginBottom: 16, width: '100%', gap: 12 }} wrap>
          <DatePicker
            placeholder="Filter by date"
            style={{ width: 180 }}
            value={dateStr ? dayjs(dateStr) : null}
            onChange={(_, dateStrVal) => updateParams({ date: (dateStrVal as string) || undefined, page: 1 })}
          />
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 180 }}
            value={status}
            onChange={(v) => updateParams({ status: v || undefined, page: 1 })}
            options={STATUS_OPTIONS}
          />
        </Space>

        {error ? (
          <Paragraph type="danger">Couldn't load schedule.</Paragraph>
        ) : items.length === 0 ? (
          <EmptyState description="No appointments match your filters." />
        ) : (
          <List<Appointment>
            dataSource={items}
            pagination={{
              current: page,
              pageSize: 10,
              total: data?.total ?? items.length,
              onChange: (p) => updateParams({ page: p }),
              showSizeChanger: false,
              hideOnSinglePage: true,
            }}
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

function renderActions(
  appointment: Appointment,
  busy: boolean,
  runAction: (id: string, kind: string, payload?: Record<string, unknown>) => Promise<void>
) {
  const allowed = STATUS_FLOW[appointment.status] ?? [];
  const buttons: React.ReactNode[] = [];
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
