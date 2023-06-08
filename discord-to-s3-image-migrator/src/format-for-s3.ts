import { pinoLogger } from "@robster-monitoring/shared";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const config = {
  webpBaseDir: process.env.WEBP_IMAGES_DIR as string,
  directoryForS3: process.env.DIRECTORY_FOR_S3 as string,
};
const logger = pinoLogger("discord-to-s3-image-migrator");

const run = async () => {
  function formatImagePathsForS3(webpBaseDir: string, directoryForS3: string) {
    if (!fs.existsSync(directoryForS3)) {
      fs.mkdirSync(directoryForS3, { recursive: true });
    }

    const files = fs.readdirSync(webpBaseDir);
    for (const file of files) {
      const filePath = path.join(webpBaseDir, file);
      // Extract the timestamp from the filename
      const timestamp = parseInt(path.parse(file).name, 10);

      // Adjust the date to UTC time
      const date = new Date(timestamp);

      // Format the timestamp as a date string
      const year = date.getUTCFullYear().toString();
      const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
      const day = date.getUTCDate().toString().padStart(2, "0");
      const hours = date.getUTCHours().toString().padStart(2, "0");
      const minutes = date.getUTCMinutes().toString().padStart(2, "0");
      const seconds = date.getUTCSeconds().toString().padStart(2, "0");

      const formattedFilename = `${year}/${month}/${day}/${hours}:${minutes}:${seconds}.webp`;
      const formattedFilePath = path.join(directoryForS3, formattedFilename);

      const parentDirOfNewFile = path.dirname(formattedFilePath);
      if (!fs.existsSync(parentDirOfNewFile)) {
        fs.mkdirSync(parentDirOfNewFile, { recursive: true });
      }
      // Move the file
      fs.copyFile(filePath, formattedFilePath, err => {
        if (err) {
          console.log(JSON.stringify(err));
          logger.error(
            `Error moving the file ${filePath} to ${formattedFilePath}`,
            err
          );
        } else {
          logger.info(`File moved successfully: ${formattedFilePath}`);
        }
      });
    }
  }

  formatImagePathsForS3(config.webpBaseDir, config.directoryForS3);
};

run();
