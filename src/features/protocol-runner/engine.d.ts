export interface ProtocolRunner {
  /** Stops the loop, releases the WebGL context and audio, and empties the root element. */
  destroy(): void;
}

/** Mounts the game into `root`, which must be a positioned element with a definite size. */
export function createProtocolRunner(root: HTMLElement): ProtocolRunner;
