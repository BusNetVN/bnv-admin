"use client"

import { useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react"

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
import { login } from "@/service/auth"
import { apiErrorMessage } from "@/service/core-api"
import { useAuthStore } from "@/stores/auth-store"

export function LoginForm() {
  const router = useRouter()
  const setSession = useAuthStore((state) => state.setSession)
  const [error, setError] = useState<string>()
  const [pending, setPending] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(undefined)
    setPending(true)

    const formData = new FormData(event.currentTarget)
    const username = String(formData.get("username") ?? "").trim()
    const password = String(formData.get("password") ?? "")

    try {
      const response = await login(username, password)
      if (
        !response.access_token ||
        response.account?.account_type !== "SYSTEM_ADMIN"
      ) {
        setError("Tài khoản không có quyền truy cập hệ thống quản trị.")
        return
      }

      setSession(response, remember)
      router.replace("/dashboard")
    } catch (submitError) {
      setError(
        apiErrorMessage(
          submitError,
          "Không đăng nhập được. Vui lòng thử lại."
        )
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
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

        {error ? <FieldError>{error}</FieldError> : null}

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
