'use client';

import { Inter } from 'next/font/google';
import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from '@/lib/AuthProvider';
import { QueryProvider } from '@/lib/QueryProvider';
import { ToastContainer } from 'react-toastify';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" dir="ltr" className="dark">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
