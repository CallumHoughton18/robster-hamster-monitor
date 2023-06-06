FROM node:19-alpine as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY . .

RUN yarn install --frozen-lockfile


RUN yarn image-s3-storage build

FROM node:19-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json yarn.lock ./
COPY ./robster-shared/package.json ./robster-shared/package.json
COPY ./image-s3-storage/package.json ./image-s3-storage/package.json

RUN yarn install --production --frozen-lockfile

COPY --from=builder /usr/src/app/image-s3-storage/build ./image-s3-storage/build
COPY --from=builder /usr/src/app/robster-shared/build ./robster-shared/build

CMD [ "node", "image-s3-storage/build/main.js" ]
