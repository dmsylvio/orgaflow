"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
import { authClient } from "@/lib/auth-client";
import { type SignInInput, signInSchema } from "@/validations/signin.schema";

export default function InviteSigninForm({ token }: { token: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: SignInInput) => {
    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: `/invite/${token}/accept`,
      });

      if (res.error) {
        toast.error(res.error.message ?? "Sign in failed", {
          description: "Please check your credentials and try again.",
        });
        return;
      }

      toast.success("Signed in successfully", {
        description: "Redirecting to accept the invite...",
      });
      setTimeout(() => {
        router.push(`/invite/${token}/accept`);
      }, 500);
    } catch {
      toast.error("Unexpected error", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Sign in to accept invite</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Use your existing account to join the organization.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} disabled={loading} />
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
                  <Input type="password" {...field} disabled={loading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in and accept"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
