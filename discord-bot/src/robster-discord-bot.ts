import { createClient } from "redis";
import { Client, GatewayIntentBits, TextChannel } from "discord.js";
import { Logger, getErrorMessage } from "@robster-monitoring/shared";
import { registerAndDeployCommandsWithClient } from "./commands/command-setup";
import { christmasCommand } from "./commands/robster-commands";

const robsterDiscordBot = async (
  key: string,
  applicationId: string,
  redisChannelName: string,
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
    redisChannelName,
    buf => {
      logger.info(`Detected bytes on channel ${redisChannelName}`);
      postImageData(buf);
    },
    true
  );

  const postImageData = (data: Buffer) => {
    robsterChannels().forEach(async channel => {
      try {
        logger.info("Posting image to discord...");
        await channel.send({
          files: [{ attachment: data, name: "robster!.webp" }],
        });
        logger.info("successfully posted image to discord");
      } catch (err) {
        logger.error(
          `An error occurred posting the image to discord: ${getErrorMessage(
            err
          )}`,
          err as Error
        );
      }
    });
  };

  return {
    postImageData,
  };
};

export default robsterDiscordBot;
