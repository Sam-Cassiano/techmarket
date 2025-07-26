# 🛒 TechMarket

TechMarket é uma aplicação completa de e-commerce voltada para produtos eletrônicos, com painel administrativo e área do cliente. A aplicação é dividida em dois projetos:

- 🔧 Backend: API RESTful desenvolvida com **NestJS**, **Prisma ORM** e **PostgreSQL**
- 💻 Frontend: Aplicação **Next.js** com **React**, **Tailwind CSS** e **React Query**

---

## 📁 Estrutura do Projeto

```bash
techmarket/
├── techmarket-backend/   # Projeto NestJS
└── techmarket-frontend/  # Projeto Next.js
🚀 Funcionalidades
👩‍💻 Admin
Login e autenticação com JWT

Gerenciamento de produtos (CRUD)

Visualização e exclusão de vendas

🧑‍🛍️ Cliente
Registro e login

Listagem e filtro de produtos

Carrinho de compras com verificação de estoque

Finalização de pedido (checkout)

Histórico de compras

📦 Tecnologias Utilizadas
Backend
NestJS

Prisma

PostgreSQL

JWT

Class-validator

Frontend
Next.js

React

Tailwind CSS

React Hook Form + Zod

React Query

React Toastify

🔧 Como Executar o Projeto
Pré-requisitos
Node.js 18+

Docker e Docker Compose

Yarn ou NPM

📦 Backend
Acesse a pasta do backend:

bash
Copiar
Editar
cd techmarket-backend
Crie o arquivo .env:

env
Copiar
Editar
DATABASE_URL=postgresql://user:password@localhost:5432/techmarket
JWT_SECRET=supertokenseguro
Suba o banco com Docker:

bash
Copiar
Editar
docker-compose up -d
Instale as dependências:

bash
Copiar
Editar
npm install
Gere o client do Prisma e rode as migrações:

bash
Copiar
Editar
npx prisma generate
npx prisma migrate dev --name init
(Opcional) Popule dados iniciais:

bash
Copiar
Editar
npm run seed
Rode a aplicação:

bash
Copiar
Editar
npm run start:dev
💻 Frontend
Acesse a pasta do frontend:

bash
Copiar
Editar
cd techmarket-frontend
Instale as dependências:

bash
Copiar
Editar
npm install
Crie o arquivo .env.local com a URL da API:

env
Copiar
Editar
NEXT_PUBLIC_API_URL=http://localhost:3000
Rode a aplicação:

bash
Copiar
Editar
npm run dev
🧪 Testes
Backend
bash
Copiar
Editar
# Testes unitários
npm run test

# Testes e2e
npm run test:e2e
👥 Usuários de Teste
Admin
Usuário: admin

Senha: admin123

Cliente
Usuário: cliente

Senha: cliente123

📂 Pastas Importantes
Backend
src/auth/: autenticação JWT

src/users/: cadastro e login

src/products/: gerenciamento de produtos

src/sales/: controle de vendas

Frontend
src/app/: páginas Next.js

src/lib/: hooks, validações e API

src/components/: componentes reutilizáveis (UI e tabelas)

📄 Licença
Este projeto está sob a licença MIT.



