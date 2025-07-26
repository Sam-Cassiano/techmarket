
'use client';

import { CartProvider } from '@/lib/CartProvider';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
