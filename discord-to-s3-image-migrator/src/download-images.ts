import { pinoLogger } from "@robster-monitoring/shared";
import { Client, GatewayIntentBits } from "discord.js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();
const logger = pinoLogger("discord-to-s3-image-migrator");

const config = {
  bucketName: process.env.BUCKET_NAME as string,
  s3Region: process.env.S3_REGION as string,
  discordKey: process.env.DISCORD_KEY as string,
  discordChannelId: process.env.DISCORD_CHANNEL_ID as string,
  baseImageDir: process.env.BASE_IMAGE_DIR as string,
};

const run = async () => {
  const discordClient = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildIntegrations,
    ],
  });

  await discordClient.login(config.discordKey);

  function getExtensionFromMimeType(mimeType: string): string | null {
    const mimeTypeMap: { [key: string]: string } = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/gif": ".gif",
      "image/bmp": ".bmp",
      "image/webp": ".webp",
    };

    // Remove the "charset" part from the MIME type if present
    const normalizedMimeType = mimeType.split(";")[0].trim().toLowerCase();

    return mimeTypeMap[normalizedMimeType] || null;
  }

  async function getMessages(channelId: string, before?: string) {
    try {
      const channel = await discordClient.channels.fetch(
        config.discordChannelId
      );
      if (!channel || !channel.isTextBased()) {
        throw new Error("Invalid channel ID or channel is not a text channel.");
      }

      const messages = await channel.messages.fetch({ limit: 100, before }); // Adjust the limit as per your requirements
      if (messages.size === 0) {
        console.log("All attachments downloaded.");
        discordClient.destroy();
        return;
      }
      logger.info(messages.size.toString());
      for (let index = 0; index < messages.size; index++) {
        const message = messages.at(index);
        if (message == undefined) continue;

        const attachments = message.attachments;
        for (const [, attachment] of attachments) {
          const { url } = attachment;
          const response = await fetch(url);
          const buff = await response.arrayBuffer();

          // Save the image locally
          const filePath = path.join(
            config.baseImageDir,
            `${message.createdTimestamp.toString()}${getExtensionFromMimeType(
              attachment.contentType!
            )}`
          );
          // Create directory if it doesn't exist
          const directory = path.dirname(filePath);
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
          }

          // Overwrite existing file if it exists
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          fs.writeFileSync(filePath, Buffer.from(buff));
          logger.info(`Image "${filePath}" downloaded.`);
        }
      }

      const lastMessageId = messages.lastKey();
      logger.info(
        `last message at: ${messages.at(messages.size - 1)?.createdAt}`
      );
      await getMessages(channelId, lastMessageId);
    } catch (error) {
      logger.error("Error occurred:", error as Error);
    } finally {
      discordClient.destroy();
    }
  }
  getMessages(config.discordChannelId);
};
run();
