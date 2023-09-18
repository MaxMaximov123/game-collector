FROM node:latest

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm install
RUN npm i -g knex   

COPY src/ ./



CMD ["node", "main.js"]