export interface ImagePublisher {
  publishImageBuffer: (buffer: Buffer) => Promise<void>;
}

export interface ImageQueueProcessor {
  delayBetweenCyclesInMiliseconds: number;
  beginProcessingQueue: (publisher: ImagePublisher) => Promise<void>;
}
