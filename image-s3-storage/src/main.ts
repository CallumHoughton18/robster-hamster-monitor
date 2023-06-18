import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getErrorMessage, pinoLogger } from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config();
const logger = pinoLogger("S3-image-storage");

const config = {
  redisUrl: process.env.REDIS_URL as string,
  redisImagesChannelName: process.env.REDIS_IMAGES_CHANNEL as string,
  redisImagesVideosName: process.env.REDIS_VIDEOS_CHANNEL as string,
  imagesBucketName: process.env.IMAGES_BUCKET_NAME as string,
  videosBucketName: process.env.VIDEOS_BUCKET_NAME as string,
  s3Region: process.env.S3_REGION as string,
};

const imageUploader = async () => {
  const client = new S3Client({ region: config.s3Region });

  const redisClient = createClient({ url: config.redisUrl });
  const subscriber = redisClient.duplicate();

  await subscriber.connect();
  logger.info(`Connected to Redis`);

  await subscriber.subscribe(
    config.redisImagesChannelName,
    buf => {
      logger.info(`Detected bytes on channel ${config.redisImagesChannelName}`);
      const now = new Date(); // Get the current local date and time
      const utcDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        )
      );
      publishImageDataToS3(config.imagesBucketName, ".webp", utcDate, buf);
    },
    true
  );

  await subscriber.subscribe(
    config.redisImagesVideosName,
    buf => {
      logger.info(`Detected bytes on channel ${config.redisImagesVideosName}`);
      const now = new Date(); // Get the current local date and time
      const utcDate = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds(),
          now.getUTCMilliseconds()
        )
      );
      publishImageDataToS3(config.videosBucketName, ".mp4", utcDate, buf);
    },
    true
  );

  logger.info(`Initialized S3 image uploader`);

  async function publishImageDataToS3(bucketName: string, fileExtension: string, publishDateTime: Date, buf: Buffer) {
    const year = publishDateTime.getFullYear();
    const month = String(publishDateTime.getMonth() + 1).padStart(2, "0"); // Months are zero-based

    const day = String(publishDateTime.getDate()).padStart(2, "0");
    const hours = String(publishDateTime.getHours()).padStart(2, "0");
    const minutes = String(publishDateTime.getMinutes()).padStart(2, "0");
    const seconds = String(publishDateTime.getSeconds()).padStart(2, "0");

    const key = `${year}/${month}/${day}/${hours}:${minutes}:${seconds}${fileExtension}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
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
