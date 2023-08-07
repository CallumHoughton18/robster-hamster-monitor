/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_KEY: string;
    REDIS_IMAGES_CHANNEL: string;
    REDIS_VIDEOS_CHANNEL: string;
  }
}
