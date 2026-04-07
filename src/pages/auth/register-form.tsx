import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import authService from '@/services/auth.service'
import { ROUTES } from '@/routes'

export function RegisterForm() {
  const navigate = useNavigate()
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
      toast.error('Password confirmation does not match')
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
        toast.success('Registration successful. Please login.')
        navigate(ROUTES.login)
        return
      }

      toast.error(response.message || 'Registration failed')
    } catch {
      toast.error('Registration failed')
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
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
                <p className="text-slate-500 dark:text-slate-400">Register to access Ship ERP</p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="passwordConfirmation">Confirm password</Label>
                <Input
                  id="passwordConfirmation"
                  type="password"
                  value={form.passwordConfirmation}
                  onChange={(e) => updateField('passwordConfirmation', e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-11">
                Register
              </Button>

              <div className="text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link to={ROUTES.login} className="text-blue-600 dark:text-blue-400 underline underline-offset-4">
                  Login
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}