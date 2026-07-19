import { useState } from 'react';
import { Card, Table, Tag, Typography, Select, Space } from 'antd';
import { useListAppointmentsQuery } from '../../../app/api/adminApi.js';
import { STATUS_META, STATUS } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import type { Appointment, AppointmentStatus } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

const STATUS_OPTIONS = Object.values(STATUS).map((value) => ({
  value,
  label: STATUS_META[value]?.label ?? value,
}));

export default function AdminAppointmentsPage() {
  useTitle('Appointments');
  const [page, setPage] = useState(1);
  const [statuses, setStatuses] = useState<AppointmentStatus[] | undefined>(undefined);

  const { data, isLoading, error, refetch } = useListAppointmentsQuery({
    page,
    limit: 20,
    status: statuses,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

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
              setStatuses(v?.length ? (v as AppointmentStatus[]) : undefined);
            }}
            options={STATUS_OPTIONS}
          />
        </Space>
        <Table<Appointment>
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
              render: (_, a) => {
                const p = a.patient;
                if (!p) return '—';
                return `${p.firstName} ${p.lastName ?? ''}`.trim() || '—';
              },
            },
            {
              title: 'Doctor',
              key: 'doctor',
              render: (_, a) => {
                const d = a.doctor;
                if (!d) return '—';
                return `Dr. ${d.firstName} ${d.lastName ?? ''}`.trim() || '—';
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
              render: (v: AppointmentStatus) => <Tag color={STATUS_META[v]?.badge}>{STATUS_META[v]?.label ?? v}</Tag>,
            },
          ]}
        />
      </Card>
    </div>
  );
}
