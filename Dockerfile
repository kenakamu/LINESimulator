FROM node:14.1.0-stretch-slim

RUN mkdir app
WORKDIR /app/
COPY . .

RUN npm install

CMD [ "node", "app.js" ]
