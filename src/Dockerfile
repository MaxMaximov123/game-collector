FROM node:19.5.0

WORKDIR /app

COPY src/package.json src/package-lock.json ./
RUN npm install
RUN npm i -g knex   

COPY src/ ./



CMD ["node", "main.js"]