FROM node:22-alpine

WORKDIR /app

RUN apk update && apk add bash git python3

RUN npm install eslint -g
RUN npm install next -g

COPY . .

RUN yarn install --ignore-scripts

CMD ["yarn", "dev"]
