import { useState } from 'react';
import { Card, Table, Tag, Typography, Button, Space, App as AntApp } from 'antd';
import { useListDoctorsQuery, useManageDoctorMutation } from '../../../app/api/adminApi.js';
import { useTitle } from '../../../hooks/useTitle.js';
import { useServerError } from '../../auth/hooks.js';
import EmptyState from '../../../components/common/EmptyState.jsx';

const { Title, Paragraph } = Typography;

/**
 * AdminDoctorsPage — the doctor-approval workbench. Step 15 will add filters
 * (pending-only, by specialization) and a drawer for the full profile; here we wire
 * the basic read + the three-state action set (approve / reject / deactivate) so the
 * RTK Query mutations are exercised end-to-end. Each successful action invalidates
 * `DoctorList` + `AdminDashboard` (see `adminApi.js`), so the row + the dashboard
 * counts both refresh on next navigation.
 *
 * "Reject" here means "set isApproved=false" — a doctor who is unapproved but active
 * can still log in and manage existing appointments; they only disappear from the
 * public search until re-approved. "Deactivate" flips `isActive=false` and denies
 * login entirely — a stronger lever reserved for serious issues.
 */
export default function AdminDoctorsPage() {
  useTitle('Doctors');
  const { message } = AntApp.useApp();
  const serverError = useServerError();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, refetch } = useListDoctorsQuery({ page, limit: 10 });
  const [manage, { isLoading: acting }] = useManageDoctorMutation();

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const handleAction = async (id, action) => {
    try {
      await manage({ id, body: { action } }).unwrap();
      message.success(`Doctor ${action}d`);
    } catch (err) {
      message.error(serverError(err, `Couldn't ${action} that doctor`));
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Doctors</Title>
      <Paragraph type="secondary">Approve new doctors, reject spam, or deactivate abusive accounts.</Paragraph>

      <Card>
        <Table
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
