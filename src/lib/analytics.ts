/* Instrumentation produit locale — journalise en console, remplaçable
   par un vrai outil analytics via setAnalyticsSink() sans toucher aux
   points d'appel. Aucune donnée n'est envoyée à un serveur. */

export type AnalyticsEvent =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'onboarding_skipped_tiktok'
  | 'tiktok_connection_selected'
  | 'tiktok_handle_submitted'
  | 'daily_plan_viewed'
  | 'daily_return_visit'
  | 'mission_cta_clicked'
  | 'opportunity_opened'
  | 'opportunity_saved'
  | 'search_used'
  | 'filter_used'
  | 'adaptation_started'
  | 'adaptation_step_completed'
  | 'content_generated'
  | 'hook_variant_requested'
  | 'content_copied'
  | 'content_added'
  | 'content_saved'
  | 'content_scheduled'
  | 'content_status_changed'
  | 'content_duplicated'
  | 'content_deleted'
  | 'content_marked_to_film'
  | 'content_marked_filmed'
  | 'content_marked_ready'
  | 'content_marked_published'
  | 'video_selected'
  | 'video_review_started'
  | 'video_review_completed'
  | 'review_issue_opened'
  | 'publication_metrics_added'
  | 'performance_insights_viewed'
  | 'next_content_started'
  | 'daily_content_completed'
  | 'contextual_copilot_used'
  | 'global_search_used'
  | 'settings_updated'
  | 'onboarding_reset';

export type AnalyticsProps = Record<string, string | number | boolean>;
export type AnalyticsSink = (event: AnalyticsEvent, props: AnalyticsProps) => void;

let sink: AnalyticsSink | null = null;

export function setAnalyticsSink(next: AnalyticsSink | null): void {
  sink = next;
}

export function track(event: AnalyticsEvent, props: AnalyticsProps = {}): void {
  if (typeof window === 'undefined') return;
  console.info('[signal:analytics]', event, props);
  sink?.(event, props);
}
