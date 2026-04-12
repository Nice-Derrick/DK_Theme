import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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
  register,
  registerSchema,
  sendRegisterEmailVerify,
  type RegisterInput,
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

export function RegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      email_code: '',
      password: '',
      confirmPassword: '',
      invite_code: searchParams.get('code') ?? '',
    },
  })

  useEffect(() => {
    if (countdown <= 0) return
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function handleSendCode() {
    const email = form.getValues('email')
    const parsed = registerSchema.shape.email.safeParse(email)
    if (!parsed.success) {
      form.setError('email', { message: parsed.error.issues[0]?.message ?? '请输入有效邮箱' })
      return
    }

    setSendingCode(true)
    setError(null)
    try {
      await sendRegisterEmailVerify(email)
      setCountdown(60)
    } catch (err) {
      setError(getErrorMessage(err, '发送验证码失败，请稍后重试'))
    } finally {
      setSendingCode(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    setError(null)
    try {
      await register(values)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, '注册失败，请检查接口配置'))
    } finally {
      setPending(false)
    }
  })

  return (
    <form className='flex flex-col gap-7' onSubmit={onSubmit}>
      <FieldGroup className='gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='inline-flex items-center rounded-full border border-primary/12 bg-primary/8 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-primary uppercase'>创建账户</div>
          <div className='space-y-2'>
            <h1 className='text-3xl font-semibold tracking-tight'>注册 {appConfig.appName}</h1>
            <p className='mx-auto max-w-sm text-sm leading-6 text-balance text-muted-foreground'>创建账户后即可进入管理页面，查看账户、订单与服务信息。</p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor='email'>邮箱</FieldLabel>
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
          <Input id='email_code' placeholder='请输入邮箱验证码' className='transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20' {...form.register('email_code')} />
          <FieldError errors={[form.formState.errors.email_code]} />
        </Field>

        <Field>
          <FieldLabel htmlFor='password'>密码</FieldLabel>
          <AuthPasswordInput id='password' placeholder='••••••••' autoComplete='new-password' {...form.register('password')} />
          <FieldError errors={[form.formState.errors.password]} />
        </Field>

        <Field>
          <FieldLabel htmlFor='confirmPassword'>确认密码</FieldLabel>
          <AuthPasswordInput id='confirmPassword' placeholder='再次输入密码' autoComplete='new-password' {...form.register('confirmPassword')} />
          <FieldError errors={[form.formState.errors.confirmPassword]} />
        </Field>

        <Field>
          <FieldLabel htmlFor='invite_code'>邀请码（可选）</FieldLabel>
          <Input id='invite_code' placeholder='填写邀请码可绑定邀请关系' className='transition-all duration-200 focus-visible:border-primary/60 focus-visible:ring-primary/20 dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20' {...form.register('invite_code')} />
        </Field>

        {error ? (
          <FieldError className='rounded-2xl border border-destructive/15 bg-destructive/6 px-4 py-3 text-sm text-destructive shadow-sm dark:border-destructive/20 dark:bg-destructive/10'>
            {error}
          </FieldError>
        ) : null}

        <Field>
          <Button
            type='submit'
            className='w-full rounded-xl shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/20 disabled:translate-y-0 disabled:shadow-none'
            disabled={pending}
          >
            {pending ? <LoaderCircle className='size-4 animate-spin' /> : <ArrowRight className='size-4 transition-transform group-hover/button:translate-x-0.5' />}
            {pending ? '注册中…' : '创建账户'}
          </Button>
        </Field>

        <Field>
          <FieldDescription className='text-center'>
            已有账户？ <Link to='/login' className='underline underline-offset-4 hover:text-primary'>返回登录</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
