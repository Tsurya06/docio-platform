import { Card, Input, Table, Typography, Button, DatePicker, Select, Space, Avatar, Tag, theme } from 'antd';
import { SearchOutlined, UserOutlined, StarFilled } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useSearchDoctorsQuery } from '../../../app/api/doctorApi.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { formatINR } from '../../../utils/currency.js';
import { SPECIALIZATION_OPTIONS, DOCTOR_SORT_OPTIONS, DOCTOR_SORT } from '../../../constants/doctorConstants.js';
import type { PublicDoctorProfile } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function PatientFindADoctorPage() {
  useTitle('Find a doctor');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = theme.useToken();

  const page = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') ?? '';
  const dateStr = searchParams.get('date') ?? undefined;
  const specialization = searchParams.get('specialization') ?? undefined;
  const sort = searchParams.get('sort') ?? DOCTOR_SORT.RATING;

  const debouncedSearch = useDebounce(search, 300);

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

  const { data, isLoading } = useSearchDoctorsQuery({
    search: debouncedSearch || undefined,
    specialization: specialization || undefined,
    date: dateStr || undefined,
    sort,
    order: sort === DOCTOR_SORT.FEE ? 'asc' : 'desc',
    page,
    limit: 10,
  });

  const items: PublicDoctorProfile[] = data?.data ?? [];
  const total = data?.total ?? items.length;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>Find a doctor</Title>
      <Paragraph type="secondary">Search by doctor name, specialization, qualification, or available date.</Paragraph>

      <Card>
        <Space style={{ marginBottom: 16, width: '100%', gap: 12 }} wrap>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="Search name, specialization, or bio..."
            value={search}
            onChange={(e) => updateParams({ search: e.target.value, page: 1 })}
            style={{ width: 260 }}
          />
          <DatePicker
            placeholder="Filter by availability date"
            style={{ width: 200 }}
            value={dateStr ? dayjs(dateStr) : null}
            onChange={(_, dateStrVal) => updateParams({ date: (dateStrVal as string) || undefined, page: 1 })}
          />
          <Select
            allowClear
            placeholder="All specializations"
            style={{ width: 180 }}
            value={specialization}
            onChange={(v) => updateParams({ specialization: v || undefined, page: 1 })}
            options={SPECIALIZATION_OPTIONS}
          />
          <Select
            placeholder="Sort by"
            style={{ width: 180 }}
            value={sort}
            onChange={(v) => updateParams({ sort: v, page: 1 })}
            options={DOCTOR_SORT_OPTIONS}
          />
        </Space>

        <Table<PublicDoctorProfile>
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
          locale={{ emptyText: <EmptyState description="No doctors match your search filters." /> }}
          columns={[
            {
              title: 'Doctor',
              dataIndex: 'user',
              render: (_, d) => {
                const name = d.user ? `Dr. ${d.user.firstName} ${d.user.lastName ?? ''}`.trim() : 'Dr. Specialist';
                return (
                  <Space align="center" size={12}>
                    <Avatar icon={<UserOutlined />} src={d.user?.avatar || d.avatar} size="large" />
                    <div>
                      <div style={{ fontWeight: 600 }}>{name}</div>
                      <div style={{ color: token.colorTextDescription, fontSize: 12 }}>
                        {d.specialization}
                      </div>
                    </div>
                  </Space>
                );
              },
            },
            {
              title: 'Qualifications',
              dataIndex: 'qualifications',
              render: (q) => (Array.isArray(q) && q.length ? q.join(', ') : '—'),
            },
            {
              title: 'Rating',
              dataIndex: 'rating',
              render: (v) => (
                <Tag color="gold" icon={<StarFilled />}>
                  {v ? Number(v).toFixed(1) : 'New'}
                </Tag>
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
                <Button type="primary" size="small" onClick={() => navigate(`/app/patient/find-a-doctor/${d._id}`)}>
                  View & Book
                </Button>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
