################################################################################
# ECOSSISTEMA RECICLA (BACKEND CORE ENGINE)
# CAMINHO FÍSICO: /boot/torre/recicla/Dockerfile
# RESPONSABILIDADE: Construir a imagem estável Linux Alpine para a API Gateway
################################################################################

# Passo 1: Imagem base leve do Node.js
FROM node:20-alpine

# Passo 2: Definir o diretório interno de trabalho do container
WORKDIR /usr/src/app

# Passo 3: Copiar os manifestos de dependência
COPY package*.json ./

# Passo 4: Instalar as dependências (incluindo o CORS adicionado)
RUN npm install

# Passo 5: Copiar todo o restante do código fonte
COPY . .

# Passo 6: Compilar o TypeScript (Garante que não há erros estáticos)
RUN npm run build

# Passo 7: Expor a porta real de controle sincronizada
EXPOSE 3000

# Passo 8: Comando de inicialização do servidor em produção
CMD ["npm", "start"]