import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getErrorMessage, pinoLogger } from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const logger = pinoLogger("image-publisher");

const onvifPortNum = Number(process.env.ONVIF_PORT);
if (isNaN(onvifPortNum))
  throw new Error("Onvif port number is not a valid number");

const config = {
  redisUrl: process.env.REDIS_URL as string,
  redisChannelName: process.env.REDIS_CHANNEL_NAME as string,
  bucketName: process.env.BUCKET_NAME as string,
};

const imageUploader = async () => {
  const client = new S3Client({});

  const redisClient = createClient({ url: config.redisUrl });
  const subscriber = redisClient.duplicate();

  await subscriber.connect();

  await subscriber.subscribe(
    config.redisChannelName,
    buf => {
      logger.info(`Detected bytes on channel ${config.redisChannelName}`);
      publishImageDataToS3(new Date(), buf);
    },
    true
  );

  async function publishImageDataToS3(publishDateTime: Date, buf: Buffer) {
    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: "hello-s3.txt",
      Body: buf,
    });

    try {
      const response = await client.send(command);
      console.log(response);
    } catch (err) {
      logger.error(
        `Unable to publish to S3: ${getErrorMessage(err)}`,
        err as Error
      );
      console.error(err);
    }
  }
};

const run = async () => {
  try {
    const client = await imageUploader();
  } catch (err) {
    logger.fatal(
      `A fatal error occurred: ${getErrorMessage(err)}`,
      err as Error
    );
  }
};

run();
