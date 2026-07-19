import { useState } from 'react';
import { Form, Input, Button, Result, App as AntApp } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../../app/api/authApi.js';
import { forgotPasswordSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { useServerError } from '../hooks.js';
import type { ForgotPasswordInput } from '../schemas.js';

export default function ForgotPasswordPage() {
  const [form] = Form.useForm<ForgotPasswordInput>();
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const { message } = AntApp.useApp();
  const [done, setDone] = useState(false);
  const serverError = useServerError();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onFinish = async (values: ForgotPasswordInput) => {
    setSubmitError(null);
    try {
      await forgot(values).unwrap();
      message.success('Recovery email sent (if that account exists)');
      setDone(true);
    } catch (err: any) {
      setSubmitError(serverError(err, 'Network error — please retry'));
      setDone(true);
    }
  };

  if (done) {
    return (
      <AuthForm title="Check your inbox" subtitle="If an account exists for that email, you'll get a reset link shortly.">
        <Result
          status="success"
          title="Recovery email sent"
          subTitle="The link expires in 15 minutes. If you don't see it, check the spam folder."
          extra={[
            <Link key="back" to="/login">
              <Button type="primary">Back to sign in</Button>
            </Link>,
          ]}
        />
      </AuthForm>
    );
  }

  return (
    <AuthForm
      title="Reset your password"
      subtitle="We'll send a one-time reset link to the email on file."
      error={submitError}
      footer={<Link to="/login">Back to sign in</Link>}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} validateMessages={{ default: 'Validation failed' }}>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email' }, { validator: zodValidator(forgotPasswordSchema) }]}
        >
          <Input prefix={<MailOutlined />} placeholder="you@example.com" autoComplete="email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block loading={isLoading}>
          Send reset link
        </Button>
      </Form>
    </AuthForm>
  );
}
