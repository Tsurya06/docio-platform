import { useState } from 'react';
import { Card, Table, Tag, Typography, Button, Space, App as AntApp } from 'antd';
import { useListDoctorsQuery, useManageDoctorMutation } from '../../../app/api/adminApi.js';
import { useTitle } from '../../../hooks/useTitle.js';
import { useServerError } from '../../auth/hooks.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import type { DoctorProfile } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function AdminDoctorsPage() {
  useTitle('Doctors');
  const { message } = AntApp.useApp();
  const serverError = useServerError();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useListDoctorsQuery({ page, limit: 10 });
  const [manage, { isLoading: acting }] = useManageDoctorMutation();

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleAction = async (id: string, action: 'approve' | 'reject' | 'deactivate' | 'activate') => {
    try {
      await manage({ id, body: { action } }).unwrap();
      message.success(`Doctor ${action}d`);
    } catch (err: any) {
      message.error(serverError(err, `Couldn't ${action} that doctor`));
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Doctors</Title>
      <Paragraph type="secondary">Approve new doctors, reject spam, or deactivate abusive accounts.</Paragraph>

      <Card>
        <Table<DoctorProfile>
          rowKey="_id"
          loading={isLoading}
          dataSource={items.map((d) => ({ ...d, key: d._id }))}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => setPage(p),
            showSizeChanger: false,
          }}
          locale={{
            emptyText: error ? (
              <EmptyState description="Couldn't load doctors." actionLabel="Retry" onAction={() => refetch()} />
            ) : (
              <EmptyState description="No doctors registered yet." />
            ),
          }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'user',
              render: (u) => (u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : '—'),
            },
            { title: 'Email', dataIndex: 'user', render: (u) => u?.email ?? '—' },
            { title: 'Specialization', dataIndex: 'specialization' },
            {
              title: 'Approval',
              dataIndex: 'isApproved',
              render: (v) => <Tag color={v ? 'success' : 'warning'}>{v ? 'Approved' : 'Pending'}</Tag>,
            },
            {
              title: 'Active',
              dataIndex: 'isActive',
              render: (v) => <Tag color={v ? 'processing' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag>,
            },
            {
              title: '',
              render: (_, d) => (
                <Space>
                  {!d.isApproved ? (
                    <Button type="link" size="small" loading={acting} onClick={() => handleAction(d._id, 'approve')}>
                      Approve
                    </Button>
                  ) : null}
                  {d.isApproved ? (
                    <Button type="link" size="small" loading={acting} onClick={() => handleAction(d._id, 'reject')}>
                      Unapprove
                    </Button>
                  ) : null}
                  {d.isActive ? (
                    <Button type="link" danger size="small" loading={acting} onClick={() => handleAction(d._id, 'deactivate')}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button type="link" size="small" loading={acting} onClick={() => handleAction(d._id, 'activate')}>
                      Activate
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
