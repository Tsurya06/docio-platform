import { useEffect, useState } from 'react';
import { Form, Input, Button, App as AntApp } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLoginMutation } from '../../../app/api/authApi.js';
import { selectCurrentUser } from '../authSlice.js';
import { loginSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { usePostLoginRedirect, useServerError } from '../hooks.js';
import { PATIENT, DOCTOR, ADMIN } from '../../../constants/roles.js';
import type { LoginInput } from '../schemas.js';

export default function LoginPage() {
  const [form] = Form.useForm<LoginInput>();
  const [login, { isLoading }] = useLoginMutation();
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

  const onFinish = async (values: LoginInput) => {
    setSubmitError(null);
    try {
      const res = await login(values).unwrap();
      const role = res?.data?.user?.role;
      message.success('Welcome back');
      navigate(redirectForRole(role, redirect), { replace: true });
    } catch (err: any) {
      setSubmitError(serverError(err, 'Could not log in with those credentials'));
    }
  };

  return (
    <AuthForm
      title="Sign in to Docio"
      subtitle="Book and manage your doctor appointments in one place."
      error={submitError}
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
          <div>
            Don&rsquo;t have an account? <Link to="/register">Create one</Link>
          </div>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        validateMessages={{ default: 'Validation failed' }}
        autoComplete="on"
      >
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
          rules={[{ required: true, message: 'Password is required' }, { validator: zodValidator(loginSchema) }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Password" autoComplete="current-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Sign in
        </Button>
      </Form>
    </AuthForm>
  );
}

export function redirectForRole(role?: string | null, fallback?: string | null): string {
  if (role === PATIENT) return '/app/patient/appointments';
  if (role === DOCTOR) return '/app/doctor/dashboard';
  if (role === ADMIN) return '/app/admin/dashboard';
  return fallback ?? '/app';
}
