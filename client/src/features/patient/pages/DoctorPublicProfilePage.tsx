import { useMemo, useState } from 'react';
import {
  Card, Typography, Tag, DatePicker, Button, Space, Modal, Form, Input, Alert, Skeleton, Empty, theme,
} from 'antd';
import { App as AntApp } from 'antd';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPublicDoctorQuery, useGetDoctorAvailabilityQuery } from '../../../app/api/doctorApi.js';
import { useCreateAppointmentMutation } from '../../../app/api/appointmentApi.js';
import { bookingSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import { useTitle } from '../../../hooks/useTitle.js';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { useServerError } from '../../auth/hooks.js';
import { formatINR } from '../../../utils/currency.js';
import type { BookingInput } from '../schemas.js';

const { Title, Paragraph } = Typography;

export default function DoctorPublicProfilePage() {
  useTitle('Doctor profile');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = AntApp.useApp();
  const { token } = theme.useToken();
  const serverError = useServerError();

  const { data, isLoading, error } = useGetPublicDoctorQuery(id ?? '');
  const doctor = data?.data?.doctor;

  const [selectedDate, setSelectedDate] = useState(() => dayjs().format('YYYY-MM-DD'));
  const [activeSlot, setActiveSlot] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const {
    data: availData,
    isLoading: availLoading,
    error: availError,
  } = useGetDoctorAvailabilityQuery(
    { id: id ?? '', date: selectedDate },
    { skip: !id || !selectedDate },
  );

  const slots = useMemo(() => {
    const list = availData?.data?.availability?.slots ?? [];
    if (list.length === 0) return [];
    return [...list].map(s => typeof s === 'string' ? s : (s as any).startTime).sort();
  }, [availData]);

  const [create, { isLoading: booking }] = useCreateAppointmentMutation();

  const openBooking = (slot: string) => {
    setActiveSlot(slot);
    setModalOpen(true);
  };

  const onConfirm = async (values: BookingInput) => {
    if (!doctor?._id || !selectedDate || !activeSlot) return;
    try {
      await create({
        doctorId: doctor._id,
        appointmentDate: selectedDate,
        startTime: activeSlot,
        reason: values.reason,
      }).unwrap();
      message.success('Appointment booked — see it in your list');
      setModalOpen(false);
      navigate('/app/patient/appointments');
    } catch (err: any) {
      message.error(serverError(err, 'That slot may have just been booked — please try another'));
    }
  };

  if (isLoading) {
    return <Skeleton active paragraph={{ rows: 6 }} />;
  }
  if (error) {
    return <Alert type="error" showIcon message="Couldn't load this doctor" description={serverError(error)} />;
  }
  if (!doctor) {
    return <EmptyState description="No such doctor." actionLabel="Back to search" onAction={() => navigate(-1)} />;
  }

  return (
    <div>
      <Space style={{ marginBottom: 8, color: token.colorTextSecondary, cursor: 'pointer' }} onClick={() => navigate(-1)}>
        ← Back to search
      </Space>

      <Card>
        <Title level={3} style={{ marginTop: 0 }}>
          Dr. {doctor.user?.firstName} {doctor.user?.lastName} ({doctor.specialization})
        </Title>
        <Paragraph>
          {doctor.bio || 'No bio on file.'}
        </Paragraph>
        <Space wrap>
          {doctor.qualifications?.length
            ? doctor.qualifications.map((q: string) => <Tag key={q}>{q}</Tag>)
            : <Tag>No qualifications listed</Tag>}
        </Space>
        <Paragraph style={{ marginTop: 16 }}>
          Fee <strong>{formatINR(doctor.consultationFee)}</strong>
          {' · '}Slot length <strong>{doctor.slotDuration ?? '—'} min</strong>
          {' · '}Working days <strong>{doctor.workingDays?.join(', ') || '—'}</strong>
        </Paragraph>
      </Card>

      <Card title="Book a slot" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8 }}>Date</label>
            <DatePicker
              allowClear={false}
              value={dayjs(selectedDate)}
              disabledDate={(d) => d.isBefore(dayjs().startOf('day'))}
              onChange={(d) => {
                if (!d) return;
                setActiveSlot(null);
                setSelectedDate(d.format('YYYY-MM-DD'));
              }}
            />
          </div>

          {availLoading ? (
            <Skeleton.Avatar active shape="square" style={{ width: '100%', height: 80 }} />
          ) : availError ? (
            <Alert type="warning" showIcon message="Couldn't load availability for that day" />
          ) : slots.length === 0 ? (
            <Empty description="No open slots that day — pick another date." />
          ) : (
            <Space wrap>
              {slots.map((s) => (
                <Button key={s} onClick={() => openBooking(s)}>
                  {s}
                </Button>
              ))}
            </Space>
          )}
        </Space>
      </Card>

      <Modal
        title="Confirm booking"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form layout="vertical" onFinish={onConfirm} initialValues={{ reason: '' }}>
          <Paragraph>
            {doctor.specialization} — <strong>{selectedDate} at {activeSlot}</strong>
          </Paragraph>
          <Form.Item
            name="reason"
            label="Reason for visit"
            rules={[
              { required: true, message: 'Please describe your reason for the visit' },
              { min: 5, message: 'At least 5 characters' },
              { max: 500, message: 'Keep this under 500 characters' },
              { validator: zodValidator(bookingSchema) },
            ]}
          >
            <Input.TextArea rows={3} placeholder="Tell the doctor what's going on — symptoms, history, etc." />
          </Form.Item>
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={booking}>
              Book appointment
            </Button>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
