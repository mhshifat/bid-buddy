export { eventBus } from "./event-bus";
export type { EventBusAdapter } from "./event-bus";
export type {
  EventMap,
  EventName,
  EventCategory,
  RealtimeEvent,
  NotificationItem,
  JobCapturedPayload,
  JobStatusChangedPayload,
  AiAnalysisStartedPayload,
  AiAnalysisCompletePayload,
  AiAnalysisFailedPayload,
  ProposalGeneratedPayload,
  ProposalStatusChangedPayload,
  SystemConnectedPayload,
  SystemHeartbeatPayload,
  JobMatchAlertPayload,
} from "./types";
export { eventToNotification } from "./types";

// Register the job match listener so it runs when the events module is loaded
import { registerJobMatchListener } from "@/server/notifications/job-match-listener";
registerJobMatchListener();

