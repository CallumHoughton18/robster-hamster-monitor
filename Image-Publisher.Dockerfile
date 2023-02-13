FROM node:19-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN yarn install --frozen-lockfile

RUN yarn discord-bot build

FROM node:19-alpine

# install ffmpeg
RUN apk update
RUN apk add
RUN apk add ffmpeg

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json yarn.lock ./
COPY ./robster-shared/package.json ./robster-shared/package.json
COPY ./image-publisher/package.json ./image-publisher/package.json

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/image-publisher/build ./image-publisher/build
COPY --from=builder /usr/src/app/robster-shared/build ./robster-shared/build

CMD [ "node", "image-publisher/build/main.js" ]

