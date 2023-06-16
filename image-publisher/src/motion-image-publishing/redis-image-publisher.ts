import { Logger } from "robster-shared/src/index";
import { createClient } from "redis";
import { ImagePublisher } from "./image-publisher";

const redisImagePublisher = async (
  redisUrl: string,
  logger: Logger
): Promise<ImagePublisher> => {
  const client = createClient({ url: redisUrl });
  await client.connect();
  logger.info("redis client connected");

  const publisherBuffer = async (buffer: Buffer, bufferKey: string) => {
    await client.publish(bufferKey, buffer);
    logger.info(`published buffer to redis channel ${bufferKey}`);
  };

  return {
    publisherBuffer,
  };
};

export default redisImagePublisher;
