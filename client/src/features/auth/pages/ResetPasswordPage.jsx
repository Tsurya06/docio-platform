import { useEffect, useState } from 'react';
import { Form, Input, Button, Result, App as AntApp } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../../app/api/authApi.js';
import { resetPasswordSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { useServerError } from '../hooks.js';

/**
 * ResetPasswordPage — reads `?token=...` from the URL, presents a new-password form,
 * and posts `{ token, newPassword }` to `/auth/reset-password`. On success the server
 * revokes all of the user's existing refresh tokens; we bounce to /login so the user
 * signs in fresh (no silent restore — that's by design: revoking the family assumes the
 * reset flow itself may have been intercepted, so don't trust any prior session).
 *
 * Alternative: stay logged in after reset. Rejected — the backend wipes the whole token
 * family on reset for security; the client honoring that means a forced re-auth, which
 * is the right default after a credential change.
 */
export default function ResetPasswordPage() {
  const [form] = Form.useForm();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const serverError = useServerError();

  // If there's no token in the URL at all, the link was truncated; show that error up
  // front instead of letting the user fill out a form that's guaranteed to 400.
  const missingToken = !token;

  const onFinish = async (values) => {
    setSubmitError(null);
    try {
      await reset({ token, newPassword: values.newPassword }).unwrap();
      message.success('Password reset — please sign in');
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      setSubmitError(serverError(err, 'That reset link is invalid or has expired'));
    }
  };

  if (missingToken) {
    return (
      <AuthForm title="Reset link is incomplete">
        <Result
          status="warning"
          title="No reset token found"
          subTitle="Click the link in your email again — it may have been truncated when copied."
          extra={[
            <Link key="back" to="/forgot-password">
              <Button type="primary">Request a new link</Button>
            </Link>,
          ]}
        />
      </AuthForm>
    );
  }

  if (done) {
    return (
      <AuthForm title="Password reset">
        <Result
          status="success"
          title="Password updated"
          subTitle="Redirecting to sign in…"
        />
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Choose a new password"
      subtitle="Pick something you don't use anywhere else."
      error={submitError}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        validateMessages={{ default: 'Validation failed' }}
        initialValues={{ token }}
      >
        <Form.Item name="token" hidden>
          <Input />
        </Form.Item>
        <Form.Item
          name="newPassword"
          label="New password"
          rules={[
            { required: true, message: 'New password is required' },
            { min: 8, message: 'At least 8 characters' },
            { validator: zodValidator(resetPasswordSchema) },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="At least 8 characters" autoComplete="new-password" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Confirm password"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Repeat new password" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Reset password
        </Button>
      </Form>
    </AuthForm>
  );
}
