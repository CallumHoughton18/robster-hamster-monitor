import Pino from "pino";
import { getErrorMessage } from "./error-utils";

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

export { getErrorMessage };
