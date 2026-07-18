import { useEffect } from 'react';
import {
  Card, Form, Input, InputNumber, Select, TimePicker, Checkbox, Button, Space, Tag, Typography, Alert, App as AntApp, Row, Col,
} from 'antd';
import dayjs from 'dayjs';
import {
  useGetMyDoctorProfileQuery,
  useUpdateMyDoctorProfileMutation,
  useUpdateMyAvailabilityMutation,
} from '../../../app/api/doctorApi.js';
import { profileUpdateSchema, availabilitySchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import { useTitle } from '../../../hooks/useTitle.js';
import { useServerError } from '../../auth/hooks.js';

const { Title, Paragraph } = Typography;

const WEEKDAY_OPTIONS = [
  { label: 'Mon', value: 'Mon' },
  { label: 'Tue', value: 'Tue' },
  { label: 'Wed', value: 'Wed' },
  { label: 'Thu', value: 'Thu' },
  { label: 'Fri', value: 'Fri' },
  { label: 'Sat', value: 'Sat' },
  { label: 'Sun', value: 'Sun' },
];

/**
 * DoctorProfilePage (Step 14) — two-card editor replacing the Step 12 read-only view.
 * "Public profile" (specialization, bio, qualifications, consultationFee) patches against
 * `/doctors/me`; "Availability" (working days, working hours, slot length) PUTs against
 * `/doctors/me/availability`. We keep two separate Forms because the endpoints differ
 * in semantics — PATCH (partial) vs PUT (full replacement) — and conflating them into
 * one Save button would force us to handle "availability succeeded but profile failed"
 * partial-success UX in the form. Two forms keep success atomic.
 *
 * The availability PUT *requires* every field (it's full replacement by design — see
 * the backend's `updateAvailabilityByUserId`), so the second form is always a full
 * submit even if the doctor only changed the slot length.
 *
 * Backend contract notes (caught during Step 16 verification):
 *   - Weekday enum values are capitalized ('Mon', 'Tue', ...) — see `WORKING_DAY_VALUES`.
 *   - Fee field name is `consultationFee`, not `fee`.
 *   - slotDuration is clamped to [15, 120], not [5, 240].
 */
export default function DoctorProfilePage() {
  useTitle('My profile');
  const [profileForm] = Form.useForm();
  const [availForm] = Form.useForm();
  const { message } = AntApp.useApp();
  const serverError = useServerError();

  const { data, isLoading, error } = useGetMyDoctorProfileQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateMyDoctorProfileMutation();
  const [updateAvailability, { isLoading: savingAvail }] = useUpdateMyAvailabilityMutation();
  const profile = data?.data?.doctor;

  useEffect(() => {
    if (!profile) return;
    profileForm.setFieldsValue({
      specialization: profile.specialization ?? '',
      bio: profile.bio ?? '',
      qualifications: profile.qualifications ?? [],
      consultationFee: profile.consultationFee ?? undefined,
    });
    availForm.setFieldsValue({
      workingDays: profile.workingDays ?? [],
      'workingHours.start': profile.workingHours?.start ? dayjs(profile.workingHours.start, 'HH:mm') : null,
      'workingHours.end': profile.workingHours?.end ? dayjs(profile.workingHours.end, 'HH:mm') : null,
      slotDuration: profile.slotDuration ?? 30,
    });
  }, [profile, profileForm, availForm]);

  const submitProfile = async (values) => {
    try {
      await updateProfile({
        specialization: values.specialization?.trim() || undefined,
        bio: values.bio || undefined,
        qualifications: values.qualifications ?? [],
        consultationFee: typeof values.consultationFee === 'number' ? values.consultationFee : undefined,
      }).unwrap();
      message.success('Profile saved');
    } catch (err) {
      message.error(serverError(err, 'Could not save profile'));
    }
  };

  const submitAvailability = async (values) => {
    try {
      await updateAvailability({
        workingDays: values.workingDays ?? [],
        workingHours: {
          start: values['workingHours.start']?.format('HH:mm'),
          end: values['workingHours.end']?.format('HH:mm'),
        },
        slotDuration: values.slotDuration,
      }).unwrap();
      message.success('Availability saved');
    } catch (err) {
      message.error(serverError(err, 'Could not save availability'));
    }
  };

  if (error) return <Alert type="error" message="Couldn't load your profile" />;
  if (isLoading) return <Card loading />;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>My provider profile</Title>
      <Paragraph type="secondary">What patients see when they find you, plus your working hours.</Paragraph>

      {!profile?.isApproved ? (
        <Alert
          type="warning"
          showIcon
          message="Profile is awaiting admin approval"
          description="Patients cannot book with you yet. Update your profile and availability in the meantime — once approved, your calendar will be live."
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Card title="Public profile" style={{ marginBottom: 16 }}>
        <Form form={profileForm} layout="vertical" onFinish={submitProfile}>
          <Form.Item
            name="specialization"
            label="Specialization"
            rules={[
              { max: 100, message: 'Keep under 100 characters' },
              { min: 2, message: 'At least 2 characters' },
              { validator: zodValidator(profileUpdateSchema) },
            ]}
          >
            <Input placeholder="e.g. Pediatric cardiologist" />
          </Form.Item>
          <Form.Item name="qualifications" label="Qualifications">
            <Select mode="tags" placeholder="Type and press Enter — e.g. MD, FAAP" tokenSeparators={[',']} />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={4} placeholder="Brief introduction patients will see on your profile." />
          </Form.Item>
          <Form.Item name="consultationFee" label="Consultation fee (INR)" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber min={0} max={100000} style={{ width: '100%' }} prefix="₹" />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={savingProfile}>Save profile</Button>
          </Space>
        </Form>
      </Card>

      <Card title="Availability">
        <Form form={availForm} layout="vertical" onFinish={submitAvailability}>
          <Form.Item name="workingDays" label="Working days" rules={[{ required: true, message: 'Pick at least one day' }]}>
            <Checkbox.Group options={WEEKDAY_OPTIONS} />
          </Form.Item>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="workingHours.start" label="Day starts at" rules={[{ required: true, message: 'Pick a start time' }]}>
                <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="workingHours.end"
                label="Day ends at"
                dependencies={['workingHours.start']}
                rules={[
                  { required: true, message: 'Pick an end time' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const start = getFieldValue('workingHours.start');
                      if (!value || !start || value.isAfter(start)) return Promise.resolve();
                      return Promise.reject(new Error('End must be later than start'));
                    },
                  }),
                ]}
              >
                <TimePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="slotDuration" label="Slot length (minutes)" rules={[{ required: true, message: 'Required' }, { type: 'number', min: 15, max: 120, message: '15–120 minutes' }]}>
            <InputNumber min={15} max={120} style={{ width: '100%' }} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={savingAvail}>Save availability</Button>
          </Space>
        </Form>
        {profile && profile.isApproved ? <Tag color="success" style={{ marginTop: 8 }}>Approved</Tag> : null}
      </Card>
    </div>
  );
}
