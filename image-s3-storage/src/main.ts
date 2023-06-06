import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getErrorMessage, pinoLogger } from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const logger = pinoLogger("image-publisher");

const config = {
  redisUrl: process.env.REDIS_URL as string,
  redisChannelName: process.env.REDIS_CHANNEL as string,
  bucketName: process.env.BUCKET_NAME as string,
  s3Region: process.env.S3_REGION as string,
};

const imageUploader = async () => {
  const client = new S3Client({ region: config.s3Region });

  const redisClient = createClient({ url: config.redisUrl });
  const subscriber = redisClient.duplicate();

  await subscriber.connect();
  logger.info(`Connected to Redis Channel ${config.redisChannelName}`);

  await subscriber.subscribe(
    config.redisChannelName,
    buf => {
      logger.info(`Detected bytes on channel ${config.redisChannelName}`);
      publishImageDataToS3(new Date(), buf);
    },
    true
  );

  async function publishImageDataToS3(publishDateTime: Date, buf: Buffer) {
    const year = publishDateTime.getFullYear();
    const month = String(publishDateTime.getMonth() + 1).padStart(2, "0"); // Months are zero-based

    const day = String(publishDateTime.getDate()).padStart(2, "0");
    const hours = String(publishDateTime.getHours()).padStart(2, "0");
    const minutes = String(publishDateTime.getMinutes()).padStart(2, "0");
    const seconds = String(publishDateTime.getSeconds()).padStart(2, "0");

    const key = `${year}/${month}/${day}/${hours}:${minutes}:${seconds}.webp`;
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: buf,
    });

    try {
      const response = await client.send(command);
      logger.info(
        `S3 image publish response: ${JSON.stringify(response.$metadata)}`
      );
    } catch (err) {
      logger.error(
        `Unable to publish to S3: ${getErrorMessage(err)}`,
        err as Error
      );
    }
  }
};

const run = async () => {
  try {
    await imageUploader();
  } catch (err) {
    logger.fatal(
      `A fatal error occurred: ${getErrorMessage(err)}`,
      err as Error
    );
  }
};

run();
