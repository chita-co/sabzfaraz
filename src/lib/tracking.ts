export interface TrackingSettings {
  tracking_stage_1: string;
  tracking_stage_2: string;
  tracking_stage_3: string;
  tracking_stage_4: string;
  tracking_stage_5: string;
}

export function getTrackingStageNumber(startedAt: string | null): number {
  if (!startedAt) return 0;
  const hours = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60);
  const stage = Math.floor(hours / 24) + 1;
  return Math.min(Math.max(stage, 1), 5);
}

export function getTrackingMessage(
  startedAt: string | null,
  settings: TrackingSettings
): string | null {
  const stage = getTrackingStageNumber(startedAt);
  if (stage === 0) return null;
  const key = `tracking_stage_${stage}` as keyof TrackingSettings;
  return settings[key];
}