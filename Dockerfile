FROM node:14

WORKDIR /usr/src/app

RUN npm install

COPY . .

EXPOSE 8080

CMD [ "node", "server.js" ]
