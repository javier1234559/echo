"use client";

import { memo } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/feature/auth/hooks/useAuth";
import { DEFAULT_LOGIN_FORM, loginSchema } from "./schema";
import { RouteNames } from "@/constants";
import { useRouter } from "next/navigation";

function SignInForm() {
  const loginMutation = useAuth();
  const router = useRouter();
  const form = useForm<yup.InferType<typeof loginSchema>>({
    resolver: yupResolver(loginSchema),
    defaultValues: DEFAULT_LOGIN_FORM,
  });

  const onSubmit = (values: yup.InferType<typeof loginSchema>) => {
    loginMutation.mutate(values, {
      onSuccess: () => {
        router.push(RouteNames.App);
      },
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6 rounded-lg border border-border bg-background p-6 shadow-sm"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@gmail.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {loginMutation.isError && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            {loginMutation.error?.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </Form>
  );
}

export default memo(SignInForm);
