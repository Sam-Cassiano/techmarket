"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-toastify";
import api from "@/services/api";
import { registerSchema, RegisterForm } from "@/lib/schema";
import type { AxiosError } from "axios";

export default function ClientRegister() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      const { username, password } = data;

      await api.post("/users", {
        username,
        password,
        role: "user",
      });

      toast.success("Cadastro realizado com sucesso!");
      router.push("/");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      const errorMessage =
        error?.response?.data?.message || "Não foi possível realizar o cadastro.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Cadastro de Cliente</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Usuário</label>
            <Input {...register("username")} autoComplete="username" />
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Senha</label>
            <Input type="password" {...register("password")} autoComplete="new-password" />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Confirmar Senha</label>
            <Input type="password" {...register("confirmPassword")} autoComplete="new-password" />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center gap-2"
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Registrando..." : "Cadastrar"}
          </Button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Voltar à tela principal
          </Link>
        </div>
      </div>
    </div>
  );
}
