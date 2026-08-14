"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/lib/hooks/useAuth";
import { ApiError } from "@/lib/api/client";
import { loginFormSchema, LoginFormValues } from "@/lib/utils/schemas";
import { Input, Label, FieldError } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const { login } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginFormSchema) });

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values.email, values.password);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Unable to log in. Try again.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-6">
      <Card className="w-full max-w-sm p-8">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-md bg-ink-900 text-xs font-semibold text-white">
            LD
          </span>
          <h1 className="text-lg font-semibold text-ink-900">Log in to Order Tracker</h1>
          <p className="mt-1 text-sm text-ink-400">Track orders and payments in one place.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError>{errors.email?.message}</FieldError>
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            <FieldError>{errors.password?.message}</FieldError>
          </div>

          {formError && <p className="text-sm text-danger-600">{formError}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Logging in…" : "Log in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-400">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-ink-900 hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
