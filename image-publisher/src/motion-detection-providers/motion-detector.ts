export interface MotionDetector {
  cooldown: number;
  subscribeToMotionChanges: (isMotionCallback: () => void) => void;
}
