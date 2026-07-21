import { Card, Table, Typography, Input, Select, Space } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { useListPatientsQuery } from '../../../app/api/adminApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import type { PatientProfile } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function AdminPatientsPage() {
  useTitle('Patients');
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') ?? '';
  const gender = searchParams.get('gender') ?? undefined;
  const debounced = useDebounce(search, 300);

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

  const { data, isLoading, error, refetch } = useListPatientsQuery({
    page,
    limit: 10,
    search: debounced || undefined,
    gender: gender || undefined,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Patients</Title>
      <Paragraph type="secondary">Every patient registered through the public sign-up form.</Paragraph>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', gap: 12 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search by patient name or email..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
            style={{ width: 260 }}
          />
          <Select
            allowClear
            placeholder="Filter by gender"
            style={{ width: 160 }}
            value={gender}
            onChange={(v) => updateParams({ gender: v || undefined, page: 1 })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
          />
        </Space>
        <Table<PatientProfile>
          rowKey="_id"
          loading={isLoading}
          dataSource={items.map((p) => ({ ...p, key: p._id }))}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => updateParams({ page: p }),
            showSizeChanger: false,
          }}
          locale={{
            emptyText: error ? (
              <EmptyState description="Couldn't load patients." actionLabel="Retry" onAction={() => refetch()} />
            ) : (
              <EmptyState description="No patients registered yet." />
            ),
          }}
          columns={[
            {
              title: 'Name',
              dataIndex: 'user',
              render: (u) => (u ? `${u.firstName} ${u.lastName ?? ''}`.trim() : '—'),
            },
            { title: 'Email', dataIndex: 'user', render: (u) => u?.email ?? '—' },
            {
              title: 'Date of birth',
              key: 'dob',
              render: (_, p) => (p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : '—'),
            },
            { title: 'Gender', key: 'gender', render: (_, p) => p.gender ?? '—' },
          ]}
        />
      </Card>
    </div>
  );
}
