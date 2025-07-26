"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, LoginForm } from "@/lib/schema";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/AuthProvider";

export default function AdminLogin() {
  const router = useRouter();
  const { login, user, isAuthReady } = useAuth();
  const [hasJustLoggedIn, setHasJustLoggedIn] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.username, data.password);
      setHasJustLoggedIn(true);
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Erro ao fazer login. Verifique suas credenciais.";
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (!isAuthReady || !hasJustLoggedIn) return;

    if (user?.role === "admin") {
      toast.success("Login realizado com sucesso!");
      router.push("/admin");
    } else {
      toast.error("Acesso negado: apenas administradores podem entrar aqui.");
    }

    setHasJustLoggedIn(false);
  }, [user, isAuthReady, hasJustLoggedIn, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Login do Administrador
        </h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Usuário
            </label>
            <Input
              id="username"
              {...register("username")}
              placeholder="Digite seu usuário"
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="text-red-500 text-sm" role="alert">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              {...register("password")}
              placeholder="Digite sua senha"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-red-500 text-sm" role="alert">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {isSubmitting ? "Entrando..." : "Entrar"}
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
