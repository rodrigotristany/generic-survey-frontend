import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authApi, setTokens } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'

const schema = z.object({
  email: z.string().email(),
  otp_code: z.string().length(6, 'OTP must be 6 digits'),
})

type FormValues = z.infer<typeof schema>

export default function OtpPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const defaultEmail = (location.state as { email?: string } | null)?.email ?? ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail },
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    try {
      const tokens = await authApi.verifyOtp(data.email, data.otp_code)
      setTokens(tokens)
      login(tokens)
      navigate('/surveys')
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
          <CardTitle>Two-Factor Verification</CardTitle>
          <CardDescription>Enter the 6-digit code sent to your email</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {!defaultEmail && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="otp_code">OTP Code</Label>
              <Input
                id="otp_code"
                placeholder="123456"
                maxLength={6}
                className="tracking-widest text-center text-lg"
                {...register('otp_code')}
              />
              {errors.otp_code && (
                <p className="text-sm text-destructive">{errors.otp_code.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate('/login')}>
              Back to login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
