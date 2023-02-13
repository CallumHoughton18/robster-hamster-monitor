import FfmpegCommand from "fluent-ffmpeg";
import stream from "stream";

const getRtspCameraScreenshot = (rtspUrl: string): Promise<Buffer> => {
  return new Promise<Buffer>((resolve, reject) => {
    const bufferStream = new stream.PassThrough();
    const saveScreenshotCommand = FfmpegCommand(rtspUrl);
    saveScreenshotCommand
      .inputOptions(["-rtsp_transport tcp"])
      .on("error", function (err) {
        reject(err);
      })
      .addOptions(["-rtsp_transport tcp"])
      .videoCodec("png")
      .format("rawvideo")
      .size("640x480")
      .frames(1)
      .outputOptions(["-ss 00:00:01"])
      .writeToStream(bufferStream, { end: true });

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

export default getRtspCameraScreenshot;
