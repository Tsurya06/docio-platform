import { useEffect, useState } from 'react';
import { Form, Input, Button, Result, App as AntApp } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../../../app/api/authApi.js';
import { resetPasswordSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { useServerError } from '../hooks.js';
import type { ResetPasswordInput } from '../schemas.js';

export default function ResetPasswordPage() {
  const [form] = Form.useForm<ResetPasswordInput>();
  const [reset, { isLoading }] = useResetPasswordMutation();
  const { message } = AntApp.useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [done, setDone] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const serverError = useServerError();

  const missingToken = !token;

  const onFinish = async (values: ResetPasswordInput) => {
    setSubmitError(null);
    try {
      await reset({ token, newPassword: values.newPassword }).unwrap();
      message.success('Password reset — please sign in');
      setDone(true);
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err: any) {
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
          rules={[{ validator: zodValidator(resetPasswordSchema) }]}
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
