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

/**
 * LoginPage submits email + password to `/auth/login`. On success the RTK Query
 * `onQueryStarted` callback in `authApi.js` stashes the access token + dispatches
 * `setCredentials({ user })`, so by the time the promise resolves `currentUser` is
 * populated and we can redirect to the role-specific landing page.
 *
 * Alternative: chain a `useGetMeQuery` after login to figure out the role. Rejected —
 * the login response already carries the user, so a follow-up round-trip would be
 * wasted work and would open a brief window where the wrong page might render.
 */
export default function LoginPage() {
  const [form] = Form.useForm();
  const [login, { isLoading }] = useLoginMutation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const user = useSelector(selectCurrentUser);
  const [submitError, setSubmitError] = useState(null);
  const redirect = usePostLoginRedirect();
  const serverError = useServerError();

  // If a session already exists when /login renders (refresh while holding a valid
  // refresh cookie, or back-button into /login), bounce to the role landing page.
  useEffect(() => {
    if (!user) return;
    navigate(redirectForRole(user.role, redirect), { replace: true });
  }, [user, redirect, navigate]);

  const onFinish = async (values) => {
    setSubmitError(null);
    try {
      const res = await login(values).unwrap();
      const role = res?.data?.user?.role;
      message.success('Welcome back');
      navigate(redirectForRole(role, redirect), { replace: true });
    } catch (err) {
      setSubmitError(serverError(err, 'Could not log in with those credentials'));
    }
  };

  return (
    <AuthForm
      title="Sign in to Docio"
      subtitle="Book and manage your doctor appointments in one place."
      error={submitError}
      footer={
        <>
          Don&rsquo;t have an account? <Link to="/register">Create one</Link>
          <br />
          <Link to="/forgot-password">Forgot password?</Link>
        </>
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

export function redirectForRole(role, fallback) {
  if (role === PATIENT) return '/app/patient/appointments';
  if (role === DOCTOR) return '/app/doctor/dashboard';
  if (role === ADMIN) return '/app/admin/dashboard';
  return fallback ?? '/app';
}
