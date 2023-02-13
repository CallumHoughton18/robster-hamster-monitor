// import * as dotenv from "dotenv";
// import getRtspCameraScreenshot from "./camera-screenshotting/rtsp-camera-screenshot";
// import redisImagePublisher from "./motion-image-publishing/redis-image-publisher";
// import robsterDiscordBot from "./motion-image-subscribers/robster-discord-bot";

// dotenv.config();

// const config = {
//   hostname: process.env.HOST,
//   username: process.env.ROBSTER_USERNAME,
//   password: process.env.ROBSTER_PASSWORD,
//   port: process.env.ONVIF_PORT,
//   timeout: 60000,
//   preserveAddress: true,
// };

// const discordBot = robsterDiscordBot(process.env.DISCORD_KEY).then(bot => {
//   console.log("Robster bot initialized");
//   const publisher = redisImagePublisher("robsterimages");
//   publisher.then(publisher => {
//     const cam = onvifMotionDetector(config, 5000);
//     cam.then(x => {
//       x.subscribeToMotionChanges(handleMotionEvent);
//     });

//     const handleMotionEvent = () => {
//       console.log("motion detected!");
//       getRtspCameraScreenshot().then(buffer => {
//         publisher.publishImageBuffer(buffer);
//       });
//     };
//   });
// });

/** Single Screenshot Test */

// robsterDiscordBot(process.env.DISCORD_KEY).then(() => {
//   const publisher = redisImagePublisher("robsterimages");
//   publisher.then(publisher => {
//     getRtspCameraScreenshot().then(x => {
//       console.log("publishing image bytes");
//       publisher.publishImageBuffer(x);
//     });
//   });
// });
