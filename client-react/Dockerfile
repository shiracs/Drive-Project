FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN chmod -R 777 node_modules/.bin
EXPOSE 3000
CMD ["npm", "start"]