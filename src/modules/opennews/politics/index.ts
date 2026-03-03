export interface PoliticalTimelineEvent {
  id: string;
  politician_id: string;
  title: string;
  event_type: "office_term" | "controversy" | "promise" | "historical_event";
  started_on: string;
  ended_on: string | null;
  source_url: string | null;
}
