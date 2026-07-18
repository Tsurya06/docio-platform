import { useState } from 'react';
import { Card, Table, Tag, Typography, Select, Space } from 'antd';
import { useListAppointmentsQuery } from '../../../app/api/adminApi.js';
import { STATUS_META, STATUS } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';

const { Title, Paragraph } = Typography;

/**
 * AdminAppointmentsPage — the appointment back-office. Filters by status (default:
 * every status, unfiltered) and paginates through the full result set. The status badge
 * uses the same color mapping as patient/doctor views so an appointment's color identity
 * is consistent across roles — an analyst grepping screenshots for "warning yellow"
 * always finds a pending appointment regardless of who took the screenshot.
 *
 * The status filter is a Select rather than tabs because admin's most common query
 * is "show me everything that's pending OR confirmed (active workload)" — multi-select
 * supports either shape without changing paradigms when the analytics asks shift.
 */
const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({
  value,
  label: STATUS_META[value]?.label ?? value,
}));

export default function AdminAppointmentsPage() {
  useTitle('Appointments');
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = useState(undefined);

  const { data, isLoading, error, refetch } = useListAppointmentsQuery({
    page,
    limit: 20,
    status: statuses,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Appointments</Title>
      <Paragraph type="secondary">Every booking on the platform — filter by status to triage.</Paragraph>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filter by status"
            style={{ minWidth: 280 }}
            value={statuses ?? []}
            onChange={(v) => {
              setPage(1);
              setStatuses(v?.length ? v : undefined);
            }}
            options={STATUS_OPTIONS}
          />
        </Space>
        <Table
          rowKey="_id"
          loading={isLoading}
          dataSource={items.map((a) => ({ ...a, key: a._id }))}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          locale={{
            emptyText: error ? (
              <EmptyState description="Couldn't load appointments." actionLabel="Retry" onAction={() => refetch()} />
            ) : (
              <EmptyState description="No appointments match the filter." />
            ),
          }}
          scroll={{ x: 720 }}
          columns={[
            {
              title: 'When',
              key: 'when',
              render: (_, a) => `${a.appointmentDate} · ${a.startTime}–${a.endTime}`,
            },
            {
              title: 'Patient',
              key: 'patient',
              render: (_, a) => a.patient?.name ?? '—',
            },
            {
              title: 'Doctor',
              key: 'doctor',
              render: (_, a) => {
                const d = a.doctor;
                if (!d) return '—';
                if (d.name) return `Dr. ${d.name}`;
                return d.specialization ?? '—';
              },
            },
            {
              title: 'Reason',
              dataIndex: 'reason',
              render: (v) => v || '—',
            },
            {
              title: 'Status',
              dataIndex: 'status',
              render: (v) => <Tag color={STATUS_META[v]?.badge}>{STATUS_META[v]?.label ?? v}</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
