import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthEmailInput } from '@/components/auth-email-input'
import { AuthPasswordInput } from '@/components/auth-password-input'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { appConfig } from '@/lib/config'
import {
  forgotPasswordSchema,
  resetForgotPassword,
  sendForgotPasswordEmailVerify,
  type ForgotPasswordInput,
} from '@/lib/api/services/auth'

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error ? (error as { response?: { data?: { message?: unknown } } }).response : undefined
    const message = maybeResponse?.data?.message
    if (typeof message === 'string' && message.trim()) return message

    const directMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  }

  return fallback
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [redirectCountdown, setRedirectCountdown] = useState(0)

  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      email_code: '',
      password: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  useEffect(() => {
    if (redirectCountdown <= 0) return
    const timer = window.setTimeout(() => {
      setRedirectCountdown((value) => {
        if (value <= 1) {
          navigate('/login')
          return 0
        }
        return value - 1
      })
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [navigate, redirectCountdown])

  async function handleSendCode() {
    const email = form.getValues('email')
    const parsed = forgotPasswordSchema.shape.email.safeParse(email)
    if (!parsed.success) {
      form.setError('email', { message: parsed.error.issues[0]?.message ?? '请输入有效邮箱' })
      return
    }

    setSendingCode(true)
    setError(null)
    setSuccess(null)
    try {
      await sendForgotPasswordEmailVerify(email)
      setCountdown(60)
      setSuccess('重置验证码已发送到邮箱，请注意查收')
    } catch (err) {
      setError(getErrorMessage(err, '发送验证码失败，请稍后重试'))
    } finally {
      setSendingCode(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    setError(null)
    setSuccess(null)
    try {
      await resetForgotPassword(values)
      form.reset()
      setSuccess('密码已重置成功，请使用新密码重新登录')
      setRedirectCountdown(3)
    } catch (err) {
      setError(getErrorMessage(err, '重置密码失败，请检查验证码或联系管理员'))
    } finally {
      setPending(false)
    }
  })

  return (
    <form className='flex flex-col gap-7' onSubmit={onSubmit}>
      <FieldGroup className='gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='inline-flex items-center rounded-full border border-primary/12 bg-primary/8 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-primary uppercase'>重置密码</div>
          <div className='space-y-2'>
            <h1 className='text-3xl font-semibold tracking-tight'>找回 {appConfig.appName} 密码</h1>
            <p className='mx-auto max-w-sm text-sm leading-6 text-balance text-muted-foreground'>验证邮箱后重置密码，再返回登录继续访问账户与服务信息。</p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor='email'>注册邮箱</FieldLabel>
          <AuthEmailInput id='email' placeholder='you@example.com' autoComplete='email' {...form.register('email')} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <div className='flex items-center'>
            <FieldLabel htmlFor='email_code'>邮箱验证码</FieldLabel>
            <Button
              type='button'
              variant='link'
              className='ml-auto h-8 rounded-full px-3 text-sm text-primary/90 transition-all hover:bg-primary/8 hover:text-primary disabled:bg-muted/50 disabled:text-muted-foreground disabled:no-underline'
              disabled={sendingCode || countdown > 0}
              onClick={handleSendCode}
            >
              {sendingCode ? <LoaderCircle className='size-4 animate-spin' /> : <MailCheck className='size-4' />}
              {countdown > 0 ? `${countdown}s 后重发` : sendingCode ? '发送中…' : '发送验证码'}
            </Button>
          </div>
          <Input id='email_code' placeholder='请输入邮箱验证码' autoComplete='one-time-code' className='transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20' {...form.register('email_code')} />
          <FieldError errors={[form.formState.errors.email_code]} />
        </Field>

        <Field>
          <FieldLabel htmlFor='password'>新密码</FieldLabel>
          <AuthPasswordInput id='password' placeholder='请输入新的登录密码' autoComplete='new-password' {...form.register('password')} />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor='confirmPassword'>确认新密码</FieldLabel>
          <AuthPasswordInput id='confirmPassword' placeholder='请再次输入新的登录密码' autoComplete='new-password' {...form.register('confirmPassword')} />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>

        {error ? (
          <FieldError className='rounded-2xl border border-destructive/15 bg-destructive/6 px-4 py-3 text-sm text-destructive shadow-sm dark:border-destructive/20 dark:bg-destructive/10'>
            {error}
          </FieldError>
        ) : null}
        {success ? (
          <FieldDescription className='rounded-2xl border border-primary/15 bg-primary/8 px-4 py-3 text-primary shadow-sm dark:border-primary/20 dark:bg-primary/10'>
            <div className='font-medium'>{success}</div>
            {redirectCountdown > 0 ? <div className='mt-1 text-xs opacity-80'>{redirectCountdown}s 后自动返回登录页</div> : null}
          </FieldDescription>
        ) : null}

        <Field>
          <Button
            type='submit'
            className='w-full rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 disabled:translate-y-0 disabled:shadow-none'
            disabled={pending}
          >
            {pending ? <LoaderCircle className='size-4 animate-spin' /> : <ArrowRight className='size-4 transition-transform group-hover/button:translate-x-0.5' />}
            {pending ? '重置中…' : '重置密码'}
          </Button>
        </Field>

        <Field>
          <FieldDescription className='text-center'>
            想起密码了？ <Link to='/login' className='underline underline-offset-4 hover:text-primary'>返回登录</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
