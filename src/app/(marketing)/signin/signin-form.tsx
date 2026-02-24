"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
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

export default function SigninForm() {
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SignInInput) => {
    setLoading(true);
    try {
      const res = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/app",
      });

      if (res.error) {
        toast.error(res.error.message ?? "Sign in failed", {
          description: "Please check your credentials and try again.",
        });
        return;
      }

      toast.success("Signed in successfully", {
        description: "Redirecting you to your dashboard...",
      });
      setTimeout(() => {
        router.push("/app");
      }, 800);
    } catch (error) {
      console.log(error);
      toast.error("Unexpected error", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border p-6 shadow-sm bg-white">
      <h1 className="text-xl font-semibold mb-1">Sign in</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Access your account to continue.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-sm text-neutral-600 flex items-center justify-between">
        <Link href="/forgot" className="hover:underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="hover:underline">
          Create account
        </Link>
      </div>
    </div>
  );
}
