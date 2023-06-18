import { createClient } from "redis";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { Logger, getErrorMessage } from "@robster-monitoring/shared";
import { registerAndDeployCommandsWithClient } from "./commands/command-setup";
import { christmasCommand } from "./commands/robster-commands";
import { convertToGif } from "./utils/helpers";

const robsterDiscordBot = async (
  key: string,
  applicationId: string,
  redisImagesChannelName: string,
  redisVideosChannelname: string,
  redisUrl: string,
  logger: Logger
) => {
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildIntegrations,
    ],
  });

  await discordClient.login(key);

  const redisClient = createClient({ url: redisUrl });
  const subscriber = redisClient.duplicate();

  await subscriber.connect();

  const robsterChannels = (): Array<TextChannel> => {
    return discordClient.channels.cache
      .filter(c => c.isTextBased())
      .map(c => c as TextChannel)
      .filter(c => c.name == "robster-spotted");
  };

  registerAndDeployCommandsWithClient(
    discordClient,
    [christmasCommand],
    key,
    applicationId,
    logger
  );

  await subscriber.subscribe(
    redisImagesChannelName,
    buf => {
      logger.info(`Detected bytes on channel ${redisImagesChannelName}`);
      postFileData(buf, "robster!.webp");
    },
    true
  );

  await subscriber.subscribe(
    redisVideosChannelname,
    buf => {
      logger.info(`Detected bytes on channel ${redisVideosChannelname}`);

      convertToGif(buf, logger)
      .then(gifBuffer => postFileData(gifBuffer, 'robster!.gif'))
      .catch(err => logger.error('An error occurred posting a gif to discord', err as Error));
    },
    true
  );

  const postFileData = (data: Buffer, fileName: string) => {
    if (data.length === 0) {
      logger.warn(`Cannot post a zero byte file as ${fileName}`);
      return;
    }
    robsterChannels().forEach(async channel => {
      try {
        logger.info(`Posting ${fileName} to discord...`);
        await channel.send({
          files: [{ attachment: data, name: fileName }],
        });
        logger.info(`successfully posted ${fileName} to discord`);
      } catch (err) {
        logger.error(
          `An error occurred posting ${fileName} to discord: ${getErrorMessage(
            err
          )}`,
          err as Error
        );
      }
    });
  };

  return {
    postFileData,
  };
};

export default robsterDiscordBot;
