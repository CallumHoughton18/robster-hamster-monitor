import {
  convertToGif,
  getErrorMessage,
  pinoLogger,
} from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import { createClient } from "redis";
import { EUploadMimeType, TwitterApi } from "twitter-api-v2";

dotenv.config();
const logger = pinoLogger("robster-twitter-bot");

const config = {
  redisUrl: process.env.REDIS_URL as string,
  redisImagesVideosName: process.env.REDIS_VIDEOS_CHANNEL as string,
  twitterConsumerKey: process.env.TWITTER_CONSUMER_KEY as string,
  twitterConsumerKeySecret: process.env.TWITTER_CONSUMER_KEY_SECRET as string,
  twitterAccessToken: process.env.TWITTER_ACCESS_TOKEN as string,
  twitterAccessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET as string,
};

const runTwitterBot = async (cooldownInMs: number) => {
  const redisClient = createClient({ url: config.redisUrl });
  const subscriber = redisClient.duplicate();
  let isOnCoolDown = false;

  const twitterClient = new TwitterApi({
    appKey: config.twitterConsumerKey,
    appSecret: config.twitterConsumerKeySecret,
    accessToken: config.twitterAccessToken,
    accessSecret: config.twitterAccessTokenSecret,
  });

  setInterval(() => {
    logger.info("Twitter bot cooldown reset");
    isOnCoolDown = false;
  }, cooldownInMs);

  await subscriber.connect();
  logger.info(`Connected to Redis`);

  await subscriber.subscribe(
    config.redisImagesVideosName,
    async buf => {
      // Sometimes a video with 1 frame or of 0 bytes is published. This should be handled by the publisher
      // but for now we're handling it here too (so we don't post erroneous videos to twitter) and accounting for the cooldown.
      if (buf.byteLength < 40000 || isOnCoolDown) return;

      logger.info(`Detected bytes on channel ${config.redisImagesVideosName}`);
      isOnCoolDown = true;

      const gifBuffer = await convertToGif(buf, logger);
      const mediaIdApi = await twitterClient.v1.uploadMedia(gifBuffer, {
        mimeType: EUploadMimeType.Gif,
        // RobsterHamster account ID
        additionalOwners: "1687230190198362112",
      });
      logger.info(mediaIdApi);
      const result = await twitterClient.v2.tweet("Motion detected...", {
        media: { media_ids: [mediaIdApi] },
      });
      logger.info(JSON.stringify(result));
    },
    true
  );

  logger.info(`Initialized Robster Twitter Bot`);
};

const run = async () => {
  try {
    // Twitter API V2 has a free post limit of 1500 per month, which is around 1 every 30 minutes
    // so 2100000 is 35 minutes, so a bit over that
    const thirtyFiveMinCoolDownInMs = 2100000;
    await runTwitterBot(thirtyFiveMinCoolDownInMs);
  } catch (err) {
    logger.fatal(
      `A fatal error occurred: ${getErrorMessage(err)}`,
      err as Error
    );
    process.exit(1);
  }
};

run();
