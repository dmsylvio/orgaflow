"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc/client";
import { signupAccountSchema } from "@/validations/auth";

export default function InviteSignup({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const router = useRouter();
  const { token } = use(params);
  const inviteInfo = trpc.invitations.getByToken.useQuery({ token });
  const acceptInvite = trpc.invitations.accept.useMutation();
  const [loading, setLoading] = useState(false);

  const form = useForm<{ name: string; email: string; password: string }>({
    resolver: zodResolver(signupAccountSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (inviteInfo.data?.email) {
      form.setValue("email", inviteInfo.data.email);
    }
  }, [inviteInfo.data?.email, form]);

  const onSubmit = async (values: {
    name: string;
    email: string;
    password: string;
  }) => {
    setLoading(true);
    try {
      const signUp = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/app",
      });

      if (signUp.error) {
        toast.error(signUp.error.message ?? "Sign up failed", {
          description: "Please check your details and try again.",
        });
        return;
      }

      await acceptInvite.mutateAsync({ token });
      toast.success("Invitation accepted", {
        description: "Redirecting to the organization...",
      });
      router.replace("/app");
    } catch {
      toast.error("Unexpected error", {
        description: "Please try again in a few moments.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (inviteInfo.isLoading) {
    return <div className="text-sm text-neutral-500">Loading invite...</div>;
  }

  if (inviteInfo.error || inviteInfo.data?.expired) {
    return (
      <div className="rounded-2xl border bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-semibold">Invite unavailable</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This invite is invalid or expired.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-neutral-600">
        You’re invited to join <strong>{inviteInfo.data?.org.name}</strong>.
      </p>

      <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <div>
          <Label className="block text-sm font-medium">Full name</Label>
          <Input
            className="mt-1 w-full border rounded px-3 py-2"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div>
          <Label className="block text-sm font-medium">Email</Label>
          <Input
            className="mt-1 w-full border rounded px-3 py-2"
            {...form.register("email")}
            disabled
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label className="block text-sm font-medium">Password</Label>
          <Input
            type="password"
            className="mt-1 w-full border rounded px-3 py-2"
            {...form.register("password")}
          />
          {form.formState.errors.password && (
            <p className="text-sm text-red-600">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2"
        >
          {loading ? "Creating..." : "Create account"}
        </Button>
      </form>
    </div>
  );
}
