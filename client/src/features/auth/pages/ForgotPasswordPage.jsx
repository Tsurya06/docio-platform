import { useState } from 'react';
import { Form, Input, Button, Result, App as AntApp } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useForgotPasswordMutation } from '../../../app/api/authApi.js';
import { forgotPasswordSchema } from '../schemas.js';
import { zodValidator } from '../../../components/common/ZodFormBridge.js';
import AuthForm from '../components/AuthForm.jsx';
import { useServerError } from '../hooks.js';

/**
 * ForgotPasswordPage — single email field. The backend always returns 200 regardless of
 * whether the email exists (so a stranger can't enumerate accounts), and the recovery
 * URL gets emailed when the address matches a real user. We mirror that contract on the
 * client by showing the same confirmation regardless of any error path.
 *
 * Why show the same confirmation even on rejection: the backend will never tell us if
 * "no such email" because that would let an attacker enumerate accounts via the UI. The
 * "if you have an account you'll get an email" copy matches the server's behavior.
 */
export default function ForgotPasswordPage() {
  const [form] = Form.useForm();
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const { message } = AntApp.useApp();
  const [done, setDone] = useState(false);
  const serverError = useServerError();
  const [submitError, setSubmitError] = useState(null);

  const onFinish = async (values) => {
    setSubmitError(null);
    try {
      await forgot(values).unwrap();
      message.success('Recovery email sent (if that account exists)');
      setDone(true);
    } catch (err) {
      // The only way we get here is a network failure; the API itself returns 200 even
      // for unknown emails, so we still show the same confirmation screen to mirror it.
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
