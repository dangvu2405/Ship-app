import { useState, type ComponentProps } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Divider, Flex, Form, Input, Typography, theme } from 'antd';
import { cn } from '@/lib/utils';
import authService from '@/services/auth.service';
import { ROUTES } from '@/routes';
import { notifyErrorOnce } from '@/utils/errorToast';
import { useTranslation } from '@/hooks/useTranslation';
import { strongPasswordSchema } from '@/schemas/password';

const heroImage = 'login-hero.jpeg';
const icon = 'icon.jpeg';

const inputStyle: React.CSSProperties = {
  height: 48,
  borderRadius: 6,
  background: '#f2f2f2',
  borderColor: '#e5e5e5',
  borderWidth: 0.5,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  color: '#333333',
  letterSpacing: '0.3px',
};

type RegisterValues = {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
};

export function RegisterForm({ className, ...props }: ComponentProps<'div'>) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [form] = Form.useForm<RegisterValues>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onFinish = async (values: RegisterValues) => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      const response = await authService.register({
        username: values.username.trim(),
        email: values.email.trim(),
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      if (response.success) {
        toast.success(t('auth.registerSuccess'));
        navigate(ROUTES.login);
        return;
      }
      toast.error(response.message || t('auth.registerFailed'));
    } catch (error) {
      notifyErrorOnce('auth-register', error, { fallbackMessage: t('auth.registerFailed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn('auth-screen', className)}
      style={{ background: token.colorFillAlter }}
      {...props}
    >
      <Card
        className="auth-screen__card"
        variant="borderless"
        styles={{ body: { padding: 0 } }}
        style={{ boxShadow: token.boxShadowSecondary }}
      >
        <div className="auth-screen__layout">
          <div className="auth-screen__hero">
            <img src={heroImage} alt={t('auth.heroImageAlt')} className="auth-screen__hero-image" />
          </div>

          <div className="auth-screen__panel">
            <div className="auth-screen__content">
              {/* Brand */}
              <div className="auth-screen__brand">
                <img src={icon} className="auth-screen__brand-mark" alt="Ship ERP" />
                <span className="auth-screen__brand-text">Ship ERP</span>
              </div>

              {/* Form */}
              <Form<RegisterValues>
                form={form}
                layout="vertical"
                requiredMark={false}
                onFinish={onFinish}
                style={{ marginBottom: 0 }}
              >
                <Flex vertical gap={24}>
                  <Typography.Title
                    level={4}
                    style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#1a1a1a', lineHeight: '28px' }}
                  >
                    {t('auth.registerTitle')}
                  </Typography.Title>

                  <Flex vertical gap={16}>
                    <Form.Item
                      name="username"
                      label={<span style={labelStyle}>{t('users.username')}</span>}
                      rules={[
                        { required: true, message: t('validation.required', { field: t('users.username') }) },
                        { min: 2, message: t('validation.minLength', { min: 2 }) },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        id="username"
                        autoComplete="username"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerUsernamePlaceholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      name="email"
                      label={<span style={labelStyle}>{t('auth.email')}</span>}
                      rules={[
                        { required: true, message: t('validation.required', { field: t('auth.email') }) },
                        { type: 'email', message: t('validation.email') },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input
                        id="email"
                        type="email"
                        autoComplete="email"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.emailPlaceholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={<span style={labelStyle}>{t('auth.password')}</span>}
                      rules={[
                        { required: true, message: t('validation.required', { field: t('auth.password') }) },
                        {
                          validator: async (_, value) => {
                            if (!value) return;
                            const result = strongPasswordSchema.safeParse(value);
                            if (!result.success) throw new Error(result.error.issues[0].message);
                          },
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.Password
                        id="password"
                        autoComplete="new-password"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerPasswordPlaceholder')}
                      />
                    </Form.Item>

                    <Form.Item
                      name="password_confirmation"
                      label={<span style={labelStyle}>{t('auth.confirmPassword')}</span>}
                      dependencies={['password']}
                      rules={[
                        { required: true, message: t('validation.required', { field: t('auth.confirmPassword') }) },
                        {
                          validator: async (_, value) => {
                            if (!value) return;
                            if (value !== form.getFieldValue('password')) {
                              throw new Error(t('validation.passwordMismatch'));
                            }
                          },
                        },
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.Password
                        id="passwordConfirmation"
                        autoComplete="new-password"
                        size="large"
                        style={inputStyle}
                        placeholder={t('auth.registerPasswordConfirmPlaceholder')}
                      />
                    </Form.Item>
                  </Flex>

                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={isSubmitting}
                    style={{ height: 40, borderRadius: 6, fontSize: 15, fontWeight: 700 }}
                  >
                    {t('auth.register')}
                  </Button>

                  <Divider style={{ margin: 0, borderColor: '#e5e5e5' }} />

                  <div className="auth-screen__switch-auth">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link to={ROUTES.login} className="auth-screen__link">
                      {t('auth.login')}
                    </Link>
                  </div>
                </Flex>
              </Form>
            </div>

            <Flex justify="space-between" align="center" className="auth-screen__footer">
              <span>{t('auth.agreeTerms')}</span>
              <span>© Ship ERP 2026</span>
            </Flex>
          </div>
        </div>
      </Card>
    </div>
  );
}
