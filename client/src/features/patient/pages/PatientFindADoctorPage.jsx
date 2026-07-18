import { useState, useEffect } from 'react';
import { Card, Input, Table, Typography, Button, theme } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSearchDoctorsQuery } from '../../../app/api/doctorApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { formatINR } from '../../../utils/currency.js';

const { Title, Paragraph } = Typography;

/**
 * PatientFindADoctorPage — minimal search-by-name flow using `useSearchDoctorsQuery`.
 * The text index lives on the server (`{ specialization, bio, qualifications }`); this
 * page just sends the query and renders cards into a table. Step 13 will replace the
 * table with a card grid + per-doctor "Book" CTA that opens the availability picker.
 *
 * Pagination is exposed through the AntD table's `pagination` prop, which sends
 * `{ page, pageSize }` as the new RTK Query args — the cache serializes by args, so
 * each page is fetched once and re-displayed from cache on tab-back.
 */
export default function PatientFindADoctorPage() {
  useTitle('Find a doctor');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 300);

  // Reset to page 1 whenever the search changes — otherwise the user ends up on
  // page 4 of an entirely different result set.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { data, isLoading } = useSearchDoctorsQuery({
    search: debouncedSearch || undefined,
    page,
    limit: 10,
  });

  const items = data?.data ?? [];
  const total = data?.meta?.total ?? items.length;

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
          locale={{ emptyText: <EmptyState description="No doctors match your search." /> }}
          columns={[
            {
              title: 'Doctor',
              dataIndex: 'specialization',
              render: (_, d) => (
                <div>
                  <strong>{d.specialization}</strong>
                  <div style={{ color: 'rgba(0,0,0,0.55)', fontSize: 12 }}>
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
