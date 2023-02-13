import * as dotenv from "dotenv";
import robsterDiscordBot from "./robster-discord-bot";
import { pinoLogger, getErrorMessage } from "@robster-monitoring/shared";

dotenv.config();
const logger = pinoLogger("discord-bot");

const run = async () => {
  try {
    logger.info("Initializing discord bot...");
    await robsterDiscordBot(
      process.env.DISCORD_KEY as string,
      process.env.DISCORD_APPLICATION_ID as string,
      process.env.REDIS_CHANNEL as string,
      process.env.REDIS_URL as string,
      logger
    );
    logger.info("Discord bot initialized");
  } catch (err) {
    logger.fatal(
      `A fatal error occurred: ${getErrorMessage(err)}`,
      err as Error
    );
  }
};

run();
