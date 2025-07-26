# Etapa 1: imagem base com Node.js
FROM node:18-alpine

# Etapa 2: diretório de trabalho
WORKDIR /app

# Etapa 3: copiar dependências e instalar
COPY package*.json ./
COPY prisma ./prisma

RUN npm install

# Etapa 4: copiar restante da aplicação
COPY . .

# Etapa 5: gerar o Prisma Client
RUN npx prisma generate

# Etapa 6: expor a porta da API
EXPOSE 3005

# Etapa 7: comando padrão (ajuste para produção/dev)
CMD ["npm", "run", "start:dev"]
