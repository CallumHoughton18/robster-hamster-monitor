import * as dotenv from "dotenv";
import getRtspCameraScreenshot from "./camera-screenshotting/rtsp-camera-screenshot";
import onvifMotionDetector from "./motion-detection-providers/onvif-motion-detector";
import redisImagePublisher from "./motion-image-publishing/redis-image-publisher";
import { getErrorMessage, pinoLogger } from "@robster-monitoring/shared";

dotenv.config();
const logger = pinoLogger("image-publisher");

const onvifPortNum = Number(process.env.ONVIF_PORT);
if (isNaN(onvifPortNum))
  throw new Error("Onvif port number is not a valid number");

const config = {
  hostname: process.env.HOST,
  username: process.env.ROBSTER_USERNAME,
  password: process.env.ROBSTER_PASSWORD,
  port: onvifPortNum,
  timeout: 60000,
  preserveAddress: true,
};

const run = async () => {
  try {
    const publisher = await redisImagePublisher(
      process.env.REDIS_URL,
      process.env.REDIS_CHANNEL,
      logger
    );
    logger.info("Redis image publisher initialized");

    const handleMotionEvent = () => {
      logger.info("Motion detected!");
      getRtspCameraScreenshot(process.env.RTSP_URL)
        .then(buffer => {
          publisher.publishImageBuffer(buffer);
        })
        .catch(err => logger.error("Cannot publish image buffer", err));
    };

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
