"use client"

import { useActionState, useState } from "react"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

import { loginAction } from "@/actions/auth"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="username">Tên đăng nhập</FieldLabel>
          <Input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            placeholder="Nhập tên đăng nhập"
            required
            className="h-10"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              required
              className="h-10 pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
        </Field>

        <Field orientation="horizontal">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(checked) => setRemember(checked === true)}
          />
          <input type="hidden" name="remember" value={remember ? "on" : "off"} />
          <FieldLabel htmlFor="remember" className="font-normal">
            Ghi nhớ đăng nhập
          </FieldLabel>
        </Field>

        {state?.error ? <FieldError>{state.error}</FieldError> : null}

        <Field>
          <Button type="submit" className="h-10 w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2Icon className="animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              "Đăng nhập"
            )}
          </Button>
          <FieldDescription className="text-center">
            Chỉ tài khoản quản trị mới được truy cập hệ thống này.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
