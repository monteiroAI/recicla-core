# Base estável de produção
FROM node:18-alpine

# 1. Instala os compiladores nativos e ferramentas para compilação nativa
RUN apk add --no-cache python3 make g++ gcc

WORKDIR /usr/src/app

# Copia os manifestos de dependências primeiro (Otimização de Cache)
COPY package*.json ./

# 2. Força o NPM a ignorar compilações de hardware desnecessárias locais
RUN npm install --omit=optional --ignore-scripts

# 3. Instala o ts-node e typescript globalmente no container 
# Isso garante que o comando CMD consiga executar o server.ts direto no Alpine
RUN npm install -g ts-node typescript

# Copia a estrutura real do projeto identificada no VS Code
COPY src/gateway-api/ ./src/gateway-api/
COPY .env ./

EXPOSE 3000

# Executa diretamente o arquivo TypeScript mapeado
CMD ["ts-node", "src/gateway-api/server.ts"]

# Copia a estrutura real do projeto identificada no VS Code
COPY src/gateway-api/ ./src/gateway-api/
COPY tsconfig.json ./
COPY .env ./

EXPOSE 3000

# Executa diretamente o arquivo TypeScript mapeado
CMD ["ts-node", "src/gateway-api/server.ts"]