export interface ImagePublisher {
  publisherBuffer: (buffer: Buffer, bufferKey: string) => Promise<void>;
}

export interface ImageQueueProcessor {
  delayBetweenCyclesInMiliseconds: number;
  beginProcessingQueue: (publisher: ImagePublisher) => Promise<void>;
}
