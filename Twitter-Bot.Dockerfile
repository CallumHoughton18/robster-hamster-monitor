FROM node:19-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN yarn install --frozen-lockfile


RUN yarn twitter-bot build

FROM node:19-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json yarn.lock ./
COPY ./robster-shared/package.json ./robster-shared/package.json
COPY ./twitter-bot/package.json ./twitter-bot/package.json

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/twitter-bot/build ./twitter-bot/build
COPY --from=builder /usr/src/app/robster-shared/build ./robster-shared/build

CMD [ "node", "dtwitter-bot/build/main.js" ]
