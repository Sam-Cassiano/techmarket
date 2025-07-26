import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'TechMarket',
  description: 'Plataforma de e-commerce de tecnologia',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      <h1 className="text-3xl font-bold mb-8 text-center text-foreground">
        Bem-vindo ao TechMarket
      </h1>
      <p className="mb-6 text-center text-muted-foreground">
        Escolha seu tipo de acesso para continuar
      </p>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button asChild variant="default" className="w-full sm:w-auto">
          <Link href="/admin/login" aria-label="Acessar painel de administrador">
            Login como Administrador
          </Link>
        </Button>
        <Button asChild variant="secondary" className="w-full sm:w-auto">
          <Link href="/client/login" aria-label="Acessar painel de cliente">
            Login como Cliente
          </Link>
        </Button>
      </div>
    </div>
  );
}