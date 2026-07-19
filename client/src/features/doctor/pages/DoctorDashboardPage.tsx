import { Card, Row, Col, Statistic, Tag, Typography, Alert, List } from 'antd';
import { useSelector } from 'react-redux';
import { useGetMyDoctorProfileQuery } from '../../../app/api/doctorApi.js';
import { useListDoctorAppointmentsQuery } from '../../../app/api/appointmentApi.js';
import { selectCurrentUser } from '../../auth/authSlice.js';
import { STATUS_META } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import type { Appointment } from '../../../types/index.js';

const { Title, Paragraph } = Typography;

export default function DoctorDashboardPage() {
  useTitle('Doctor dashboard');
  const user = useSelector(selectCurrentUser);
  const { data: profileData, isLoading: profileLoading } = useGetMyDoctorProfileQuery();
  const { data, isLoading, error } = useListDoctorAppointmentsQuery({ limit: 50 });

  const profile = profileData?.data?.doctor;
  const items = data?.data ?? [];

  const today = new Date().toISOString().slice(0, 10);
  const todayAppts = items.filter((a) => a.appointmentDate === today && ['pending', 'confirmed'].includes(a.status));
  const upcoming = items.filter((a) => ['pending', 'confirmed'].includes(a.status));

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Welcome, Dr. {user?.lastName ?? 'doctor'}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Your schedule at a glance.
      </Paragraph>

      {!profileLoading && profile && !profile.isApproved ? (
        <Alert
          type="warning"
          showIcon
          message="Your profile is awaiting admin approval"
          description="You can manage existing appointments, but new patients can't book with you yet. An administrator will review your profile shortly."
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Today" value={todayAppts.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Active" value={upcoming.length} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total completed" value={(profile as any)?.totalAppointments ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Slot length" value={`${profile?.workingHours?.start ?? '—'} → ${profile?.workingHours?.end ?? '—'}`} />
          </Card>
        </Col>
      </Row>

      <Card title="Upcoming appointments" loading={isLoading}>
        {error ? (
          <Paragraph type="danger">Couldn't load appointments. Try refreshing.</Paragraph>
        ) : upcoming.length === 0 ? (
          <EmptyState description="No upcoming appointments." />
        ) : (
          <List<Appointment>
            dataSource={upcoming.slice(0, 10)}
            renderItem={(a) => (
              <List.Item
                actions={[
                  <Tag key="s" color={STATUS_META[a.status]?.badge}>
                    {STATUS_META[a.status]?.label ?? a.status}
                  </Tag>,
                ]}
              >
                <List.Item.Meta
                  title={`${a.appointmentDate} · ${a.startTime}–${a.endTime}`}
                  description={a.reason || '(no reason given)'}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}
