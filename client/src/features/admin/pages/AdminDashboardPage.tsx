import { Card, Row, Col, Statistic, Typography, Alert, Progress, theme } from 'antd';
import { useGetDashboardQuery } from '../../../app/api/adminApi.js';
import { useTitle } from '../../../hooks/useTitle.js';

const { Title, Paragraph } = Typography;

export default function AdminDashboardPage() {
  useTitle('Admin dashboard');
  const { data, isLoading, error } = useGetDashboardQuery();

  const agg = (data?.data?.dashboard ?? {}) as any;
  const users = agg.users ?? { byRole: {}, total: 0 };
  const doctors = agg.doctors ?? { total: 0, approved: 0, unapproved: 0 };
  const patients = agg.patients ?? { total: 0 };
  const appointments = agg.appointments ?? { total: 0, byStatus: {} };
  const revenue = agg.revenue ?? { total: 0 };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Admin dashboard
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Platform-wide view at a glance.
      </Paragraph>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Couldn't load dashboard data"
          description="The admin aggregations may be unavailable. Try refreshing."
          style={{ marginBottom: 16 }}
        />
      ) : null}

      {doctors.unapproved > 0 ? (
        <Alert
          type="info"
          showIcon
          message={`${doctors.unapproved} doctor${doctors.unapproved === 1 ? '' : 's'} awaiting approval`}
          description="Open the Doctors tab to review new doctor profiles."
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Users" value={users.total ?? 0} />
            <Breakdown values={users.byRole} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Doctors" value={doctors.total ?? 0} />
            <Progress
              percent={doctors.total ? Math.round((doctors.approved / doctors.total) * 100) : 0}
              size="small"
              format={() => `${doctors.approved ?? 0} approved · ${doctors.unapproved ?? 0} pending`}
            />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Patients" value={patients.total ?? 0} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Appointments" value={appointments.total ?? 0} />
            <Breakdown values={appointments.byStatus} />
          </Card>
        </Col>
      </Row>

      <Card title="Revenue" loading={isLoading}>
        <Statistic value={revenue.total ?? 0} prefix="₹" precision={2} />
        <Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
          Sum of completed appointments marked as paid.
        </Paragraph>
      </Card>
    </div>
  );
}

interface BreakdownProps {
  values?: Record<string, number>;
}

function Breakdown({ values = {} }: BreakdownProps) {
  const { token } = theme.useToken();
  const entries = Object.entries(values).filter(([, v]) => typeof v === 'number' && v > 0);
  if (entries.length === 0) return null;
  return (
    <div style={{ marginTop: 8, fontSize: 12, color: token.colorTextSecondary }}>
      {entries.map(([k, v]) => (
        <div key={k}>
          {k}: {v}
        </div>
      ))}
    </div>
  );
}
