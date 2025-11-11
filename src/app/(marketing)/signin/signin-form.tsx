"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
      signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: "/app",
      }).then((res) => {
        if (res?.ok) {
          toast.success("Login realizado com sucesso!", {
            description: "Você será redirecionado para página inicial...",
          });
          setTimeout(() => {
            router.push("/app");
          }, 3000);
        } else {
          toast.error(res?.error, {
            description:
              "Por favor, verifique suas credenciais e tente novamente.",
          });
        }
      });
    } catch (error) {
      console.log(error);
      toast.error("Ocorreu um erro inesperado.", {
        description: "Por favor, tente novamente em alguns instantes.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border p-6 shadow-sm bg-white">
      <h1 className="text-xl font-semibold mb-1">Entrar</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Acesse sua conta para continuar.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>

      <div className="mt-4 text-sm text-neutral-600 flex items-center justify-between">
        <Link href="/forgot" className="hover:underline">
          Esqueceu a senha?
        </Link>
        <Link href="/signup" className="hover:underline">
          Criar conta
        </Link>
      </div>
    </div>
  );
}
