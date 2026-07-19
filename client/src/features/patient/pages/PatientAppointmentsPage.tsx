import { useState } from 'react';
import { Card, Row, Col, Statistic, Tag, Typography, Button, Modal, Form, Input, App as AntApp } from 'antd';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  useListMyAppointmentsQuery,
  useCancelAppointmentMutation,
} from '../../../app/api/appointmentApi.js';
import { selectCurrentUser } from '../../auth/authSlice.js';
import { STATUS_META, ACTIVE_STATUSES } from '../../../constants/appointmentStatus.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { useServerError } from '../../auth/hooks.js';
import type { Appointment } from '../../../types/index.js';
import type { CancelInput } from '../schemas.js';

const { Title, Paragraph } = Typography;

export default function PatientAppointmentsPage() {
  useTitle('My appointments');
  const user = useSelector(selectCurrentUser);
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const serverError = useServerError();
  const { data, isLoading, error } = useListMyAppointmentsQuery({ limit: 200 });
  const [cancel, { isLoading: cancelling }] = useCancelAppointmentMutation();

  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null);
  const [cancelForm] = Form.useForm<CancelInput>();

  const items = data?.data ?? [];
  const total = data?.total ?? items.length;
  const upcoming = items.filter((a) => ACTIVE_STATUSES.includes(a.status));

  const submitCancel = async () => {
    if (!cancelTarget) return;
    try {
      const values = await cancelForm.validateFields();
      await cancel({
        id: cancelTarget._id,
        body: { cancelReason: values.cancelReason || undefined },
      }).unwrap();
      message.success('Appointment cancelled');
      setCancelTarget(null);
      cancelForm.resetFields();
    } catch (err: any) {
      if (err?.errorFields) return;
      message.error(serverError(err, 'Could not cancel — try again'));
    }
  };

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>
        Welcome, {user?.firstName ?? 'patient'}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        Your appointments in one place.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Total" value={total} />
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card>
            <Statistic title="Upcoming" value={upcoming.length} />
          </Card>
        </Col>
      </Row>

      <Card
        title="All appointments"
        extra={
          <Button type="primary" onClick={() => navigate('/app/patient/find-a-doctor')}>
            Book an appointment
          </Button>
        }
        loading={isLoading}
      >
        {error ? (
          <Paragraph type="danger">Couldn't load appointments. Try refreshing.</Paragraph>
        ) : items.length === 0 ? (
          <EmptyState
            description="No appointments yet."
            actionLabel="Find a doctor"
            onAction={() => navigate('/app/patient/find-a-doctor')}
          />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((a) => {
              const active = ACTIVE_STATUSES.includes(a.status);
              return (
                <li
                  key={a._id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '12px 0',
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong>
                      {a.appointmentDate} · {a.startTime}–{a.endTime}
                    </strong>
                    <div style={{ color: 'rgba(0,0,0,0.55)' }}>
                      {a.reason || '(no reason given)'}
                    </div>
                  </div>
                  <Tag color={STATUS_META[a.status]?.badge}>
                    {STATUS_META[a.status]?.label ?? a.status}
                  </Tag>
                  {active ? (
                    <Button
                      danger
                      size="small"
                      onClick={() => {
                        setCancelTarget(a);
                        cancelForm.resetFields();
                      }}
                    >
                      Cancel
                    </Button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        title="Cancel this appointment?"
        open={Boolean(cancelTarget)}
        onCancel={() => setCancelTarget(null)}
        onOk={submitCancel}
        okText="Yes, cancel it"
        okButtonProps={{ danger: true, loading: cancelling }}
        destroyOnClose
      >
        <Paragraph>
          {cancelTarget
            ? `${cancelTarget.appointmentDate} · ${cancelTarget.startTime}–${cancelTarget.endTime}`
            : ''}
        </Paragraph>
        <Form form={cancelForm} layout="vertical" initialValues={{ cancelReason: '' }}>
          <Form.Item
            name="cancelReason"
            label="Reason (optional)"
            rules={[{ max: 500, message: 'Keep under 500 characters' }]}
          >
            <Input.TextArea rows={3} placeholder="Help the doctor's office know why (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
