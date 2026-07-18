import { useState } from 'react';
import { Card, Table, Typography, Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useListPatientsQuery } from '../../../app/api/adminApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';

const { Title, Paragraph } = Typography;

/**
 * AdminPatientsPage — minimal paginated patient list. Step 15 will add per-patient
 * drilldown (with their appointments + status) and admin-side notes. Here the table
 * renders the populated `userId` for identity + the profile's `dateOfBirth` for
 * disambiguation: a patient named "John Smith" plus DOB is a specific person, where
 * "John Smith" alone is ambiguous.
 */
export default function AdminPatientsPage() {
  useTitle('Patients');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 300);
  const { data, isLoading, error, refetch } = useListPatientsQuery({ page, limit: 10, search: debounced || undefined });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Patients</Title>
      <Paragraph type="secondary">Every patient registered through the public sign-up form.</Paragraph>

      <Card>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search by name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Table
          rowKey="_id"
          loading={isLoading}
          dataSource={items.map((p) => ({ ...p, key: p._id }))}
          pagination={{
            current: page,
            pageSize: 10,
            total,
            onChange: (p) => setPage(p),
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
