FROM node:19-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN yarn install --frozen-lockfile

RUN yarn build-all

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
COPY ./discord-bot/package.json ./discord-bot/package.json
COPY ./image-publisher/package.json ./image-publisher/package.json
COPY ./image-s3-storage/package.json ./image-s3-storage/package.json
COPY ./twitter-bot/package.json ./twitter-bot/package.json

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/image-publisher/build ./image-publisher/build
COPY --from=builder /usr/src/app/robster-shared/build ./robster-shared/build
COPY --from=builder /usr/src/app/discord-bot/build ./discord-bot/build
COPY --from=builder /usr/src/app/image-s3-storage/build ./image-s3-storage/build
COPY --from=builder /usr/src/app/twitter-bot/build ./twitter-bot/build

COPY ./start-all.sh ./
RUN chmod +x ./start-all.sh
