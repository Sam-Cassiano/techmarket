# TechMarket – Front-End

Este é o front-end do projeto **TechMarket**, um catálogo de produtos com painel administrativo e interface para cliente, desenvolvido em **Next.js (App Router)**.

## 🚀 Tecnologias Utilizadas

- [Next.js 14+ (App Router)](https://nextjs.org/)
- [React 18+](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Shadcn/UI](https://ui.shadcn.com/)
- [Zod](https://zod.dev/) – validação de formulários
- [React Hook Form](https://react-hook-form.com/)
- [TanStack Query](https://tanstack.com/query)
- [Axios](https://axios-http.com/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)
- [ESLint + Prettier](https://eslint.org/)

## 📦 Instalação

```bash
# Acesse a pasta do projeto
cd techmarket-frontend

# Instale as dependências
npm install
# ou
yarn install
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz com:

```
NEXT_PUBLIC_API_URL=http://localhost:3005
```

## 🧪 Scripts

```bash
# Iniciar ambiente de desenvolvimento
npm run dev

# Build para produção
npm run build

# Lint do projeto
npm run lint
```

## 📁 Estrutura Importante

- `/app`: estrutura App Router
- `/components`: UI e formulários reutilizáveis
- `/lib`: schemas, API layer, AuthProvider
- `/services/api.ts`: configuração global do Axios

---

## 🧠 Recursos

- Login para admin e cliente
- Cadastro de clientes
- Painel do administrador: produtos e vendas
- Validação com Zod
- Cache e estado com TanStack Query
