import { Card, Table, Tag, Typography, Button, Space, App as AntApp, Select, Input } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { useListDoctorsQuery, useManageDoctorMutation } from '../../../app/api/adminApi.js';
import { useTitle } from '../../../hooks/useTitle.js';
import { useServerError } from '../../auth/hooks.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import type { DoctorProfile } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function AdminDoctorsPage() {
  useTitle('Doctors');
  const [searchParams, setSearchParams] = useSearchParams();
  const { message } = AntApp.useApp();
  const serverError = useServerError();

  const page = Number(searchParams.get('page')) || 1;
  const isApproved = searchParams.get('isApproved') ?? undefined;
  const isActive = searchParams.get('isActive') ?? undefined;
  const specialization = searchParams.get('specialization') ?? '';
  const debouncedSpec = useDebounce(specialization, 300);

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

  const { data, isLoading, error, refetch } = useListDoctorsQuery({
    page,
    limit: 10,
    isApproved: isApproved || undefined,
    isActive: isActive || undefined,
    specialization: debouncedSpec || undefined,
  });
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
        <Space style={{ marginBottom: 16, width: '100%', gap: 12 }} wrap>
          <Select
            allowClear
            placeholder="Filter by approval"
            style={{ width: 160 }}
            value={isApproved}
            onChange={(v) => updateParams({ isApproved: v || undefined, page: 1 })}
            options={[
              { value: 'true', label: 'Approved' },
              { value: 'false', label: 'Pending' },
            ]}
          />
          <Select
            allowClear
            placeholder="Filter by status"
            style={{ width: 160 }}
            value={isActive}
            onChange={(v) => updateParams({ isActive: v || undefined, page: 1 })}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ]}
          />
          <Input
            allowClear
            placeholder="Search by specialization"
            style={{ width: 240 }}
            value={specialization}
            onChange={(e) => updateParams({ specialization: e.target.value, page: 1 })}
          />
        </Space>
        <Table<DoctorProfile>
          rowKey="_id"
          loading={isLoading}
          dataSource={items.map((d) => ({ ...d, key: d._id }))}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => updateParams({ page: p }),
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
