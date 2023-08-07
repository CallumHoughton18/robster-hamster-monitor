import Pino from "pino";
import { getErrorMessage } from "./error-utils";
import FfmpegCommand from "fluent-ffmpeg";
import stream, { Readable } from "stream";

const loggerOptions: Pino.LoggerOptions = {
  timestamp: Pino.stdTimeFunctions.isoTime,
};
const pino = Pino(loggerOptions);

export interface Logger {
  serviceName: string;
  info: (msg: string) => void;
  warn: (msg: string) => void;
  debug: (msg: string) => void;
  error: (msg: string, error: Error) => void;
  fatal: (msg: string, error?: Error) => void;
}

export const pinoLogger = (serviceName: string): Logger => {
  process.on("uncaughtException", err => {
    pino.error(err, "unhandledException occurred");
    process.exit(1);
  });

  process.on("unhandledRejection", err => {
    pino.error(err, "unhandledRejection occurred");
    process.exit(1);
  });
  return {
    serviceName,
    info: (msg: string) => pino.info({ serviceName }, msg),
    warn: (msg: string) => pino.warn({ serviceName }, msg),
    debug: (msg: string) => pino.debug({ serviceName }, msg),
    error: (msg: string, error: Error) =>
      pino.error({ serviceName, error }, msg),
    fatal: (msg: string, error?: Error) =>
      pino.fatal({ serviceName, error }, msg),
  };
};

export const convertToGif = (
  mp4Buffer: Buffer,
  logger: Logger
): Promise<Buffer> => {
  logger.info(`Converting MP4 buffer of ${mp4Buffer.byteLength} bytes`);
  const mp4Stream = Readable.from(mp4Buffer);
  return new Promise<Buffer>((resolve, reject) => {
    const startTime = new Date();
    startTime.setSeconds(startTime.getSeconds() - 10); // Subtract 3 seconds from the current time

    const bufferStream = new stream.PassThrough();
    const toGifCommand = FfmpegCommand();

    toGifCommand
      .input(mp4Stream)
      .inputFormat("avi")
      .on("error", (err, stdout, stderr) => {
        logger.fatal(stderr);
        console.log(err);
        reject(err);
      })
      .toFormat("gif")
      .writeToStream(bufferStream, { end: true });

    // Read the passthrough stream
    const buffers: Uint8Array[] = [];
    bufferStream.on("data", function (buf: Uint8Array) {
      buffers.push(buf);
    });
    bufferStream.on("end", function () {
      const outputBuffer = Buffer.concat(buffers);
      logger.info(
        `Successful GIF conversion. GIF Size: ${outputBuffer.byteLength} bytes`
      );
      resolve(outputBuffer);
    });
  });
};

export { getErrorMessage };
