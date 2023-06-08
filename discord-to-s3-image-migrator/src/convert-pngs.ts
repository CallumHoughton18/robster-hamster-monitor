import { pinoLogger } from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

dotenv.config();

const config = {
  imagesBaseDir: process.env.BASE_IMAGE_DIR as string,
  webpBaseDir: process.env.WEBP_IMAGES_DIR as string,
};
const logger = pinoLogger("discord-to-s3-image-migrator");

const run = async () => {
  async function isFileZeroBytes(filePath: string): Promise<boolean> {
    const fileStats = await fs.promises.stat(filePath);
    return fileStats.size === 0;
  }
  async function convertPngsToWebp(
    fullImagesPath: string,
    webpsDirectory: string
  ): Promise<void> {
    if (!fs.existsSync(webpsDirectory)) {
      fs.mkdirSync(webpsDirectory, { recursive: true });
    }
    const files = fs.readdirSync(fullImagesPath);

    for (const file of files) {
      const filePath = path.join(fullImagesPath, file);
      logger.info(`Processing file: ${filePath}`);
      const fileExtension = path.extname(file);

      const webpFilePath = path.join(
        webpsDirectory,
        file.replace(".png", ".webp")
      );

      if (await isFileZeroBytes(filePath)) continue;
      if (fs.lstatSync(filePath).isFile() && fileExtension === ".png") {
        await convertToWebp(filePath, webpFilePath);
      } else if (fs.lstatSync(filePath).isFile() && fileExtension === ".webp") {
        fs.copyFileSync(filePath, webpFilePath);
      }
      logger.info(`DONE: processed file to: ${webpFilePath}`);
    }
  }

  async function convertToWebp(
    inputPath: string,
    outputPath: string
  ): Promise<void> {
    await sharp(inputPath).toFormat("webp").toFile(outputPath);
  }

  // Example usage
  await convertPngsToWebp(config.imagesBaseDir, config.webpBaseDir);
};

run();
