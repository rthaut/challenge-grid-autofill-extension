import { type Grid } from "@/utils/grids";

export interface RuntimeMessageBase {
  action: string;
}

export interface NotificationRuntimeMessage extends RuntimeMessageBase {
  action: "show-basic-notification";
  notification: {
    title: string;
    message: string;
  };
}

export interface FillGridRuntimeMessage extends RuntimeMessageBase {
  action: "fill-grid";
  grid: Grid;
}

export type RuntimeMessage =
  | NotificationRuntimeMessage
  | FillGridRuntimeMessage;

export function isRuntimeMessage(message: unknown): message is RuntimeMessage {
  return typeof message === "object" && message !== null && "action" in message;
}
