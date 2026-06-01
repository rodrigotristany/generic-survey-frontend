import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi } from '@/lib/auth'

const requestSchema = z.object({ email: z.string().email() })
const confirmSchema = z.object({
  email: z.string().email(),
  otp_code: z.string().length(6, '6 digits required'),
  new_password: z
    .string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Needs uppercase')
    .regex(/[a-z]/, 'Needs lowercase')
    .regex(/\d/, 'Needs digit')
    .regex(/[^A-Za-z0-9]/, 'Needs symbol'),
})

type RequestValues = z.infer<typeof requestSchema>
type ConfirmValues = z.infer<typeof confirmSchema>

export default function PasswordRecoveryPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'request' | 'confirm'>('request')
  const [sentEmail, setSentEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) })
  const confirmForm = useForm<ConfirmValues>({
    resolver: zodResolver(confirmSchema),
    defaultValues: { email: sentEmail },
  })

  const onRequest = async (data: RequestValues) => {
    setLoading(true)
    try {
      await authApi.requestPasswordRecovery(data.email)
      setSentEmail(data.email)
      confirmForm.setValue('email', data.email)
      setStep('confirm')
      toast.success('If that email exists, an OTP has been sent')
    } finally {
      setLoading(false)
    }
  }

  const onConfirm = async (data: ConfirmValues) => {
    setLoading(true)
    try {
      await authApi.confirmPasswordRecovery(data.email, data.otp_code, data.new_password)
      toast.success('Password updated — please log in')
      navigate('/login')
    } catch {
      toast.error('Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Password Recovery</CardTitle>
          <CardDescription>
            {step === 'request'
              ? 'Enter your email to receive a recovery code'
              : 'Enter the code and your new password'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'request' ? (
            <form
              onSubmit={requestForm.handleSubmit(onRequest)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...requestForm.register('email')} />
                {requestForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {requestForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending…' : 'Send Code'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate('/login')}>
                Back to login
              </Button>
            </form>
          ) : (
            <form
              onSubmit={confirmForm.handleSubmit(onConfirm)}
              className="flex flex-col gap-4"
            >
              <div className="flex flex-col gap-1.5">
                <Label>OTP Code</Label>
                <Input
                  placeholder="123456"
                  maxLength={6}
                  className="tracking-widest text-center text-lg"
                  {...confirmForm.register('otp_code')}
                />
                {confirmForm.formState.errors.otp_code && (
                  <p className="text-sm text-destructive">
                    {confirmForm.formState.errors.otp_code.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>New Password</Label>
                <Input type="password" {...confirmForm.register('new_password')} />
                {confirmForm.formState.errors.new_password && (
                  <p className="text-sm text-destructive">
                    {confirmForm.formState.errors.new_password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating…' : 'Set New Password'}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep('request')}>
                Resend code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
