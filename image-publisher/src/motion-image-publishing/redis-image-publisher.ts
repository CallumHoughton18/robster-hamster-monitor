import { Logger } from "robster-shared/src/index";
import { createClient } from "redis";
import { ImagePublisher } from "./image-publisher";

const redisImagePublisher = async (
  redisUrl: string,
  redisChannelName: string,
  logger: Logger
): Promise<ImagePublisher> => {
  const client = createClient({ url: redisUrl });
  await client.connect();
  logger.info("redis client connected");

  const publishImageBuffer = async (buffer: Buffer) => {
    await client.publish(redisChannelName, buffer);
    logger.info("published image buffer to redis");
  };

  return {
    publishImageBuffer,
  };
};

export default redisImagePublisher;
