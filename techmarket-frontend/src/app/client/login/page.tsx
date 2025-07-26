"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginForm } from "@/lib/schema";
import { useAuth } from "@/lib/AuthProvider";

export default function ClientLogin() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.username, data.password);

      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;

      if (!user || String(user.role).toLowerCase() !== "user") {
        toast.error("Apenas clientes podem acessar esta área.");
        return;
      }

      toast.success("Login realizado com sucesso!");
      router.replace("/client");
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message || "Erro ao fazer login. Verifique suas credenciais.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Login do Cliente</h1>
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
            <Input
              type="password"
              {...register("password")}
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password.message}</p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full flex justify-center items-center gap-2"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Entrando..." : "Login"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-center">
          Não tem uma conta?{" "}
          <Link href="/client/register" className="text-blue-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
        <div className="mt-4 text-center">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            ← Voltar à tela principal
          </Link>
        </div>
      </div>
    </div>
  );
}
