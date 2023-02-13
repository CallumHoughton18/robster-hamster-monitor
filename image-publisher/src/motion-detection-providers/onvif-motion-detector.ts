/* eslint-disable @typescript-eslint/no-explicit-any */
// onvif library doesn't come with any types
import { Logger } from "robster-shared/src/index";
import { Cam } from "onvif";
import { MotionDetector } from "./motion-detector";

type OnvifConfiguration = {
  hostname: string;
  username: string;
  password: string;
  port: number;
  timeout: number;
  preserveAddress: boolean;
};

const onvifMotionDetector = async (
  config: OnvifConfiguration,
  cooldown: number,
  logger: Logger
): Promise<MotionDetector> => {
  let isOnCoolDown = false;
  const createCameraConnection = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      const cam = new Cam(config, (err: any) => {
        if (err) {
          reject(err);
        }
        logger.info("Connected to onvif camera successfully...");
        resolve(cam);
      });
    });
  };

  const camera = await createCameraConnection();
  return {
    cooldown: cooldown,
    subscribeToMotionChanges(isMotionCallback) {
      logger.info("Registering for onvif motion events...");
      camera.on("event", (camMessage: any) => {
        const topic = camMessage.topic._;
        if (topic.indexOf("RuleEngine/CellMotionDetector/Motion") === -1)
          return;

        const isMotion = camMessage.message.message.data.simpleItem.$
          .Value as boolean;
        if (isMotion && !isOnCoolDown) {
          isOnCoolDown = true;

          setTimeout(() => {
            logger.info("Cooldown reset");
            isOnCoolDown = false;
          }, cooldown);

          isMotionCallback();
        }
      });
    },
  };
};

export default onvifMotionDetector;
