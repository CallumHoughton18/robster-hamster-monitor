import * as dotenv from "dotenv";
import getRtspCameraScreenshot from "./camera-screenshotting/rtsp-camera-screenshot";
import onvifMotionDetector from "./motion-detection-providers/onvif-motion-detector";
import redisImagePublisher from "./motion-image-publishing/redis-image-publisher";
import { getErrorMessage, pinoLogger } from "@robster-monitoring/shared";
import getCameraVideoSnapshot from "./camera-video-snapshot/camera-video-snapshot-creator";

dotenv.config();
const logger = pinoLogger("image-publisher");

const onvifPortNum = Number(process.env.ONVIF_PORT);
if (isNaN(onvifPortNum))
  throw new Error("Onvif port number is not a valid number");

const config = {
  hostname: process.env.HOST,
  username: process.env.ROBSTER_USERNAME,
  password: process.env.ROBSTER_PASSWORD,
  redisImageChannel: process.env.REDIS_IMAGES_CHANNEL,
  redisVideosChannel: process.env.REDIS_VIDEOS_CHANNEL,
  port: onvifPortNum,
  timeout: 60000,
  preserveAddress: true,
};

// should probably put guard clauses here for parameters I don't want to be null

const run = async () => {
  try {
    const publisher = await redisImagePublisher(
      process.env.REDIS_URL,
      logger
    );
    logger.info("Redis image publisher initialized");

    const handleMotionEvent = () => {
      logger.info("Motion detected!");

      getCameraVideoSnapshot(process.env.RTSP_URL, logger, 3)
      .then(buffer => {
        logger.info(`Publishing buffer to ${config.redisVideosChannel} of size ${buffer.byteLength} bytes`)
        publisher.publisherBuffer(buffer, config.redisVideosChannel!);

      })
      .catch(err => logger.error("Cannot publish video buffer", err));

      getRtspCameraScreenshot(process.env.RTSP_URL)
        .then(buffer => {
          publisher.publisherBuffer(buffer, config.redisImageChannel!);
        })
        .catch(err => logger.error("Cannot publish image buffer", err));
    };

    //handleMotionEvent();
    const motionDetector = await onvifMotionDetector(config, 300000, logger);
    motionDetector.subscribeToMotionChanges(handleMotionEvent);

  } catch (err) {
    logger.fatal(
      `A fatal error occurred: ${getErrorMessage(err)}`,
      err as Error
    );
  }
};

run();
