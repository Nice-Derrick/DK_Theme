import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, LoaderCircle } from 'lucide-react'
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
import { useAuth } from '@/features/auth/auth-context'
import { appConfig } from '@/lib/config'
import { loginSchema, type LoginInput } from '@/lib/api/services/auth'

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === 'object' && error !== null) {
    const maybeResponse = 'response' in error
      ? (error as { response?: { data?: { message?: unknown } } }).response
      : undefined
    const responseMessage = maybeResponse?.data?.message
    if (typeof responseMessage === 'string' && responseMessage.trim()) return responseMessage

    const directMessage = 'message' in error ? (error as { message?: unknown }).message : undefined
    if (typeof directMessage === 'string' && directMessage.trim()) return directMessage
  }

  if (error instanceof Error && error.message.trim()) return error.message
  return fallback
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setPending(true)
    setError(null)
    try {
      await login(values)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, '登录失败，请检查接口配置'))
    } finally {
      setPending(false)
    }
  })

  return (
    <form className='flex flex-col gap-7' onSubmit={onSubmit}>
      <FieldGroup className='gap-6'>
        <div className='flex flex-col items-center gap-3 text-center'>
          <div className='inline-flex items-center rounded-full border border-primary/12 bg-primary/8 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-primary uppercase'>账号登录</div>
          <div className='space-y-2'>
            <h1 className='text-3xl font-semibold tracking-tight'>欢迎回到 {appConfig.appName}</h1>
            <p className='mx-auto max-w-sm text-sm leading-6 text-balance text-muted-foreground'>输入你的邮箱和密码，继续访问账户、订单与服务信息。</p>
          </div>
        </div>

        <Field>
          <FieldLabel htmlFor='email'>邮箱</FieldLabel>
          <AuthEmailInput id='email' placeholder='you@example.com' autoComplete='email' {...form.register('email')} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field>
          <div className='flex items-center'>
            <FieldLabel htmlFor='password'>密码</FieldLabel>
            <Link to='/forgot-password' className='ml-auto text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline'>忘记密码？</Link>
          </div>
          <AuthPasswordInput id='password' placeholder='••••••••' autoComplete='current-password' {...form.register('password')} />
          <FieldError errors={[form.formState.errors.password]} />
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
            {pending ? '登录中…' : '登录'}
          </Button>
        </Field>

        <Field>
          <FieldDescription className='text-center'>
            还没有账户？ <Link to='/register' className='underline underline-offset-4 hover:text-primary'>立即注册</Link>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
