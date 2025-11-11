"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
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
  type SignupOrgInput,
  signupOrgSchema,
} from "@/validations/signup.schema";

export function OrgCreationForm() {
  const router = useRouter();
  const createOrg = trpc.org.create.useMutation();

  const form = useForm<SignupOrgInput>({
    resolver: zodResolver(signupOrgSchema),
    defaultValues: {
      orgName: "",
    },
  });

  const onSubmit = async (data: SignupOrgInput) => {
    try {
      const { org } = await createOrg.mutateAsync({
        name: data.orgName,
      });
      toast.success("Organização criada com sucesso!", {
        description: org.name,
      });
      router.push("/app");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message ?? "Falha ao criar organização.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="orgName"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="orgName">Nome da organização</FormLabel>
              <FormControl>
                <Input type="text" {...field} disabled={createOrg.isPending} />
              </FormControl>
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={createOrg.isPending}
          className="w-full rounded-md bg-black text-white py-2 disabled:opacity-60"
        >
          {createOrg.isPending ? "Criando organização..." : "Finalizar"}
        </Button>
      </form>
    </Form>
  );
}
