import { type Grid } from "@/utils/grids";

export interface RuntimeMessageBase {
  action: string;
}

export interface FillGridRuntimeMessage extends RuntimeMessageBase {
  action: "fill-grid";
  grid: Grid;
}

export type RuntimeMessage = FillGridRuntimeMessage;

/**
 * What happened when a frame tried to fill a grid (sent back from the content script)
 */
export type FrameFillResult =
  | { status: "filled" }
  | { status: "invalid-grid" }
  | { status: "missing-challenge" }
  | { status: "response-error"; challenge: string[] }
  | { status: "input-mismatch"; response: string };

export function isRuntimeMessage(message: unknown): message is RuntimeMessage {
  return typeof message === "object" && message !== null && "action" in message;
}
