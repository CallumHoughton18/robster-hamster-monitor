FROM node:19-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN yarn install --frozen-lockfile


RUN yarn discord-bot build

FROM node:19-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json yarn.lock ./
COPY ./robster-shared/package.json ./robster-shared/package.json
COPY ./discord-bot/package.json ./discord-bot/package.json

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/discord-bot/build ./discord-bot/build
COPY --from=builder /usr/src/app/robster-shared/build ./robster-shared/build

CMD [ "node", "discord-bot/build/main.js" ]
