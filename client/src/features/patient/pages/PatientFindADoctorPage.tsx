import { useState, useEffect } from 'react';
import { Card, Input, Table, Typography, Button, theme } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSearchDoctorsQuery } from '../../../app/api/doctorApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { formatINR } from '../../../utils/currency.js';
import type { DoctorProfile } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function PatientFindADoctorPage() {
  useTitle('Find a doctor');
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useSearchDoctorsQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? items.length;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Find a doctor</Title>
      <Paragraph type="secondary">Search by name, specialization, or qualification.</Paragraph>

      <Card>
        <Input
          allowClear
          prefix={<SearchOutlined />}
          placeholder="Search by specialization, bio, or qualification — e.g. “cardio”, “pediatrics”"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
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
          locale={{ emptyText: <EmptyState description="No doctors match your search." /> }}
          columns={[
            {
              title: 'Doctor',
              dataIndex: 'specialization',
              render: (_, d) => (
                <div>
                  <strong>{d.specialization}</strong>
                  <div style={{ color: token.colorTextDescription, fontSize: 12 }}>
                    {d.qualifications?.join(', ') || 'No qualifications listed'}
                  </div>
                </div>
              ),
            },
            {
              title: 'Fee',
              dataIndex: 'consultationFee',
              render: (v) => formatINR(v),
            },
            {
              title: '',
              dataIndex: 'action',
              render: (_, d) => (
                <Button type="link" onClick={() => navigate(`/app/patient/find-a-doctor/${d._id}`)}>
                  View profile
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
