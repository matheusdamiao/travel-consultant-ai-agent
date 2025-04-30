# Use uma imagem base com Node.js 22.14.0
FROM node:22.14.0-bullseye

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libxcomposite1 \
    libxrandr2 \
    libxdamage1 \
    libxkbcommon0 \
    libgbm1 \
    libgtk-3-0 \
    libnss3 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Instalar o Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' && \
    apt-get update && apt-get install -y google-chrome-stable && \
    rm -rf /var/lib/apt/lists/*

# Configurar o diretório de trabalho
WORKDIR /app

# Copiar arquivos do projeto
COPY package*.json ./
COPY . .

# Instalar dependências e construir o projeto
RUN npm install
RUN npm run build

# Expor a porta da aplicação
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "dist/main.js"]