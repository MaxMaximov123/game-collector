FROM node:latest

WORKDIR /app

COPY ./package.json ./package-lock.json ./
RUN npm install
RUN npm i -g knex
RUN knex migrate:latest

COPY ./ ./



# CMD ["node", "main.js"]