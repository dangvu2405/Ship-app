import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import authService from '@/services/auth.service'
import { ROUTES } from '@/routes'
import { notifyErrorOnce } from '@/utils/errorToast'
import { useTranslation } from '@/hooks/useTranslation'

export function RegisterForm() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    passwordConfirmation: '',
  })

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    if (form.password !== form.passwordConfirmation) {
      toast.error(t('auth.registerPasswordMismatch'))
      return
    }

    try {
      setIsSubmitting(true)
      const response = await authService.register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      })

      if (response.success) {
        toast.success(t('auth.registerSuccess'))
        navigate(ROUTES.login)
        return
      }

      toast.error(response.message || t('auth.registerFailed'))
    } catch (error) {
      notifyErrorOnce('auth-register', error, { fallbackMessage: t('auth.registerFailed') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="w-full max-w-md">
        <Card className="overflow-hidden shadow-xl border-slate-200 dark:border-slate-700">
          <CardContent className="p-8 md:p-10 bg-white dark:bg-slate-800">
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col items-center text-center mb-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('auth.registerTitle')}</h1>
                <p className="text-slate-500 dark:text-slate-400">{t('auth.registerSubtitle')}</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">{t('users.username')}</Label>
                <Input
                  id="username"
                  name="username"
                  autoComplete="username"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  placeholder={t('auth.registerUsernamePlaceholder')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder={t('auth.emailPlaceholder')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  name="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  placeholder={t('auth.registerPasswordPlaceholder')}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="passwordConfirmation">{t('auth.confirmPassword')}</Label>
                <Input
                  id="passwordConfirmation"
                  name="password-confirmation"
                  type="password"
                  autoComplete="new-password"
                  value={form.passwordConfirmation}
                  onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                  placeholder={t('auth.registerPasswordConfirmPlaceholder')}
                  required
                />
              </div>

              <Button type="submit" loading={isSubmitting} className="w-full h-11">
                {t('auth.register')}
              </Button>

              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to={ROUTES.login} className="text-blue-600 dark:text-blue-400 underline underline-offset-4">
                  {t('auth.login')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
