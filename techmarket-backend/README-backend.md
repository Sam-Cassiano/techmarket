# TechMarket – Back-End

Este é o back-end da aplicação **TechMarket**, uma API RESTful construída com **NestJS** e **Prisma**, conectada a um banco **PostgreSQL**, com autenticação JWT e cache com Redis.

## 🚀 Tecnologias Utilizadas

- [NestJS 11](https://nestjs.com/)
- [Prisma ORM](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis (Cache)](https://redis.io/)
- [JWT](https://jwt.io/)
- [Class-validator](https://github.com/typestack/class-validator)
- [Docker + Docker Compose](https://www.docker.com/)
- [ESLint + Prettier](https://eslint.org/)
- [Jest](https://jestjs.io/) para testes

## 📦 Instalação

```bash
# Acesse a pasta do projeto
cd techmarket-backend

# Instale as dependências
npm install
```

## 🐘 Configuração do Banco de Dados

Configure o arquivo `.env`:

```env
DATABASE_URL=postgresql://usuario:senha@localhost:5432/techmarket
JWT_SECRET=meuSegredoSuperSeguro123
```

## 🐳 Usando Docker (opcional)

```bash
docker-compose up -d
```

## 🧱 Prisma

```bash
# Gerar as migrações
npx prisma migrate dev

# Gerar cliente Prisma
npx prisma generate

# Visualizar dados
npx prisma studio
```

## 🌱 Seed (dados iniciais)

```bash
npm run seed
```

> Isso cria o usuário admin e alguns produtos.

## 🔐 Autenticação

- JWT enviado no header `Authorization: Bearer <token>`
- Login com `/auth/login`
- Middleware `JwtAuthGuard` protege rotas

## 🧪 Scripts

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build
npm run start:prod

# Testes
npm run test
npm run test:e2e

# Lint
npm run lint
```

## 📁 Estrutura Importante

- `/src/modules`: módulos organizados (auth, users, products, sales)
- `/prisma`: schema e seed
- `main.ts`: habilita CORS e inicia app
