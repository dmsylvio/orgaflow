"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc/client";
import {
  type SignupUserInput,
  signupUserSchema,
} from "@/validations/signup.schema";

interface UserSignupFormProps {
  onSuccess: () => void;
}

export function UserSignupForm({ onSuccess }: UserSignupFormProps) {
  const [loading, setLoading] = useState(false);
  const signup = trpc.auth.signup.useMutation();

  const form = useForm<SignupUserInput>({
    resolver: zodResolver(signupUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: SignupUserInput) => {
    setLoading(true);
    try {
      await signup.mutateAsync(data);

      const login = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: "/app",
      });

      if (login?.ok) {
        toast.success("Conta criada! Vamos configurar sua organização.");
        onSuccess();
      } else {
        toast.error(login?.error ?? "Não foi possível entrar após o cadastro.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? "Falha ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="name">Nome</FormLabel>
              <FormControl>
                <Input type="text" {...field} disabled={loading} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="email">E-mail</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={loading} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="password">Senha</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={loading} />
              </FormControl>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
        >
          {loading ? "Criando conta..." : "Continuar"}
        </Button>
      </form>
    </Form>
  );
}
