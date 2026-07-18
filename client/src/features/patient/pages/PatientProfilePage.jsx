import { useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, Button, Space, Typography, App as AntApp } from 'antd';
import dayjs from 'dayjs';
import {
  useGetMyPatientProfileQuery,
  useUpdateMyPatientProfileMutation,
} from '../../../app/api/patientApi.js';
import { useTitle } from '../../../hooks/useTitle.js';
import { useServerError } from '../../auth/hooks.js';

const { Title, Paragraph } = Typography;

/**
 * PatientProfilePage (Step 13 expansion) — edit-in-place form rather than the read-only
 * Step 12 view. Uses a single `<Form>` instance; reset on save keeps the "saved" state
 * visually consistent and re-arms the dirty-check for subsequent edits.
 *
 * All fields are optional on the backend (PATCH semantics), but on submit we always
 * send the whole form. Server-side the schema strips empty strings to undefined, so
 * we treat an empty field as "clearing the value" without client-side massaging.
 */
export default function PatientProfilePage() {
  useTitle('My profile');
  const [form] = Form.useForm();
  const { data, isLoading, error } = useGetMyPatientProfileQuery();
  const [update, { isLoading: saving }] = useUpdateMyPatientProfileMutation();
  const { message } = AntApp.useApp();
  const serverError = useServerError();
  const profile = data?.data?.profile;

  // Re-hydrate the form whenever the query refetches. `useEffect` is fine here since
  // we're reflecting an external source of truth into a controlled component — but the
  // dependency array explicitly lists both `form` and `profile` so a stale-form warning
  // doesn't fire under React 18 double-invoke in dev.
  useEffect(() => {
    if (!profile) return;
    form.setFieldsValue({
      dateOfBirth: profile.dateOfBirth ? dayjs(profile.dateOfBirth) : null,
      gender: profile.gender ?? undefined,
      bloodGroup: profile.bloodGroup ?? undefined,
      phone: profile.phone ?? '',
      'address.street': profile.address?.street ?? '',
      'address.city': profile.address?.city ?? '',
      'address.state': profile.address?.state ?? '',
      'address.zip': profile.address?.zip ?? '',
      'address.country': profile.address?.country ?? '',
      'medicalHistory': profile.medicalHistory?.join(', ') ?? '',
      'allergies': profile.allergies?.join(', ') ?? '',
      'emergencyContact.name': profile.emergencyContact?.name ?? '',
      'emergencyContact.phone': profile.emergencyContact?.phone ?? '',
    });
  }, [form, profile]);

  const onFinish = async (values) => {
    const payload = {
      dateOfBirth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : '',
      gender: values.gender || '',
      bloodGroup: values.bloodGroup || '',
      phone: values.phone || '',
      address: {
        street: values['address.street'] || '',
        city: values['address.city'] || '',
        state: values['address.state'] || '',
        zip: values['address.zip'] || '',
        country: values['address.country'] || '',
      },
      medicalHistory: values.medicalHistory
        ? values.medicalHistory.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      allergies: values.allergies
        ? values.allergies.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      emergencyContact: {
        name: values['emergencyContact.name'] || '',
        phone: values['emergencyContact.phone'] || '',
      },
    };

    try {
      await update(payload).unwrap();
      message.success('Profile saved');
    } catch (err) {
      message.error(serverError(err, 'Profile save failed'));
    }
  };

  if (error) return <Paragraph type="danger">Couldn't load your profile.</Paragraph>;

  return (
    <div>
      <Title level={3} style={{ marginTop: 0 }}>My profile</Title>
      <Paragraph type="secondary">Personal + medical details visible to doctors you book with.</Paragraph>

      <Card loading={isLoading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          validateMessages={{ default: 'Validation failed' }}
        >
          <Form.Item
            name="dateOfBirth"
            label="Date of birth"
            // The picker's value is a dayjs object, but `profileUpdateSchema.dateOfBirth` validates
            // a `YYYY-MM-DD` string — that mismatch makes the generic `zodValidator` reject the
            // dayjs value as "Invalid input". We lean on the picker (valid dates only) + backend
            // string validation instead, and only guard the one thing the picker alone can't: a
            // birth date in the future.
            rules={[
              {
                validator(_, value) {
                  if (!value) return Promise.resolve();
                  return value.isAfter(dayjs().endOf('day'))
                    ? Promise.reject(new Error('Date of birth cannot be in the future'))
                    : Promise.resolve();
                },
              },
            ]}
          >
            <DatePicker style={{ width: '100%' }} disabledDate={(d) => d.isAfter(dayjs().endOf('day'))} />
          </Form.Item>
          <Form.Item name="gender" label="Gender">
            <Select
              allowClear
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
                { value: 'prefer-not-to-say', label: 'Prefer not to say' },
              ]}
            />
          </Form.Item>
          <Form.Item name="bloodGroup" label="Blood group">
            <Select
              allowClear
              options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((v) => ({ value: v, label: v }))}
            />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 555 0100" />
          </Form.Item>

          <Paragraph strong>Allergies & medical history</Paragraph>
          <Form.Item name="allergies" label="Allergies (comma separated)">
            <Input placeholder="Peanuts, latex, ibuprofen" />
          </Form.Item>
          <Form.Item name="medicalHistory" label="Medical history (comma separated)">
            <Input placeholder="Asthma, hypertension, prior surgery" />
          </Form.Item>

          <Paragraph strong>Address</Paragraph>
          <Form.Item name="address.street" label="Street"><Input /></Form.Item>
          <Form.Item name="address.city" label="City"><Input /></Form.Item>
          <Form.Item name="address.state" label="State / Province"><Input /></Form.Item>
          <Form.Item name="address.zip" label="ZIP / Postal"><Input /></Form.Item>
          <Form.Item name="address.country" label="Country"><Input /></Form.Item>

          <Paragraph strong>Emergency contact</Paragraph>
          <Form.Item name="emergencyContact.name" label="Name"><Input /></Form.Item>
          <Form.Item name="emergencyContact.phone" label="Phone"><Input /></Form.Item>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" htmlType="submit" loading={saving}>
              Save profile
            </Button>
            <Button onClick={() => form.resetFields()}>Reset</Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
}
