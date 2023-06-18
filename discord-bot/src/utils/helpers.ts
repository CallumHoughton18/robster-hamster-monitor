export const isInFestiveSeason = (givenDate: Date): boolean => {
  const dateCopy = new Date(givenDate.getTime());
  const givenYear = dateCopy.getFullYear();
  const beginningFestiveSeason = new Date(givenYear, 11, 24);
  const endFestiveSeason = new Date(givenYear, 11, 26);

  givenDate.setDate(dateCopy.getDate() + 1);
  return dateCopy >= beginningFestiveSeason && dateCopy < endFestiveSeason;
};

import FfmpegCommand from "fluent-ffmpeg";
import { Logger } from "robster-shared/src";
import stream, { Readable } from "stream";

export const convertToGif = (mp4Buffer: Buffer, logger: Logger): Promise<Buffer> => {
  logger.info(`Converting MP4 buffer of ${mp4Buffer.byteLength} bytes`)
  const mp4Stream =  Readable.from(mp4Buffer);
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
      .toFormat('gif')
      .writeToStream(bufferStream, {end: true});


    // Read the passthrough stream
    const buffers: Uint8Array[] = [];
    bufferStream.on("data", function (buf: Uint8Array) {
      buffers.push(buf);
    });
    bufferStream.on("end", function () {
      const outputBuffer = Buffer.concat(buffers);
      logger.info(`Successful GIF conversion. GIF Size: ${outputBuffer.byteLength} bytes`)
      resolve(outputBuffer);
    });
  });
};
