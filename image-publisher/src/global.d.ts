/* eslint-disable @typescript-eslint/no-unused-vars */
declare namespace NodeJS {
  interface ProcessEnv {
    DISCORD_KEY: string;
    HOST: string;
    ROBSTER_USERNAME: string;
    ROBSTER_PASSWORD: string;
    ONVIF_PORT: string;
    REDIS_URL: string;
    RTSP_URL: string;
    REDIS_IMAGES_CHANNEL: string;
    REDIS_VIDEOS_CHANNEL: string;
  }
}

declare module "onvif";
