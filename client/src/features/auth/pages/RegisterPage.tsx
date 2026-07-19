import { useEffect, useState } from 'react';
import { Form, Input, Button, Select, App as AntApp } from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useRegisterMutation } from '../../../app/api/authApi.js';
import { selectCurrentUser } from '../authSlice.js';
import { registerSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { usePostLoginRedirect, useServerError } from '../hooks.js';
import { redirectForRole } from './LoginPage.js';
import { PATIENT, DOCTOR } from '../../../constants/roles.js';
import type { RegisterInput } from '../schemas.js';

export default function RegisterPage() {
  const [form] = Form.useForm<RegisterInput>();
  const [register, { isLoading }] = useRegisterMutation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const redirect = usePostLoginRedirect();
  const serverError = useServerError();

  useEffect(() => {
    if (!user) return;
    navigate(redirectForRole(user.role, redirect), { replace: true });
  }, [user, redirect, navigate]);

  const onFinish = async (values: RegisterInput) => {
    setSubmitError(null);
    try {
      const res = await register(values).unwrap();
      const role = res?.data?.user?.role;
      message.success('Account created');
      navigate(redirectForRole(role, redirect), { replace: true });
    } catch (err: any) {
      setSubmitError(serverError(err, 'Could not create that account'));
    }
  };

  return (
    <AuthForm
      title="Create your Docio account"
      subtitle="Patient and doctor accounts are free."
      error={submitError}
      footer={
        <>
          Already have an account? <Link to="/login">Sign in</Link>
        </>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        validateMessages={{ default: 'Validation failed' }}
        initialValues={{ role: PATIENT }}
      >
        <Form.Item
          name="role"
          label="I am a"
          rules={[{ required: true, message: 'Pick a role' }]}
          extra="Doctors become searchable only after an admin reviews and approves the profile."
        >
          <Select
            options={[
              { value: PATIENT, label: 'Patient' },
              { value: DOCTOR, label: 'Doctor' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="firstName"
          label="First name"
          rules={[{ required: true, message: 'First name is required' }, { max: 60, message: 'Keep names under 60 characters' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Ada" autoComplete="given-name" />
        </Form.Item>
        <Form.Item
          name="lastName"
          label="Last name"
          rules={[{ required: true, message: 'Last name is required' }, { max: 60, message: 'Keep names under 60 characters' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Lovelace" autoComplete="family-name" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Password is required' },
            { min: 8, message: 'At least 8 characters' },
            { validator: zodValidator(registerSchema) },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
        <Form.Item name="phone" label="Phone (optional)">
          <Input prefix={<PhoneOutlined />} placeholder="+1 555 0100" autoComplete="tel" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Create account
        </Button>
      </Form>
    </AuthForm>
  );
}
