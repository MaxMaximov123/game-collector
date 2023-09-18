FROM node:latest

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm install
RUN npm i -g knex
RUN knex migrate:latest

COPY src/ ./



# CMD ["node", "main.js"]