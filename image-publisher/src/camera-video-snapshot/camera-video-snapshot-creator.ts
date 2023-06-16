import FfmpegCommand from "fluent-ffmpeg";
import { Logger } from "robster-shared/src";
import stream from "stream";

const getCameraVideoSnapshot = (rtspUrl: string, logger: Logger, lengthInSeconds: number): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const startTime = new Date();
    startTime.setSeconds(startTime.getSeconds() - 10); // Subtract 3 seconds from the current time

    const bufferStream = new stream.PassThrough();
    const captureVideoCommand = FfmpegCommand(rtspUrl);
    
    captureVideoCommand
      .inputOptions(["-rtsp_transport tcp"])
      .on("error", (err, stdout, stderr) => {
        logger.fatal(stderr);
        console.log(err);
        reject(err);
      })
      .addOptions(["-rtsp_transport tcp"])
      .audioCodec("aac") // Specify an audio codec (in this case, AAC)
      .videoCodec("libx264") // Use libx264 for H.264 encoding
      .format("avi") // Use MPEG-4 container format
      .size("640x480")
      .outputOptions(["-an"]) // Disable audio recording
      .outputOptions([`-t ${lengthInSeconds}`]) // Set output duration to 3 seconds
      .writeToStream(bufferStream, {end: true});


    // Read the passthrough stream
    const buffers: Uint8Array[] = [];
    bufferStream.on("data", function (buf: Uint8Array) {
      buffers.push(buf);
    });
    bufferStream.on("end", function () {
      const outputBuffer = Buffer.concat(buffers);
      resolve(outputBuffer);
    });
  });
};

export default getCameraVideoSnapshot;
