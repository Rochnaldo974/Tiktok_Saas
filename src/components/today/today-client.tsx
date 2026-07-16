'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Hook, Sound, Video } from '@/lib/data';
import { DIFFICULTY_LABELS } from '@/lib/data';
import type { ScoreContext } from '@/lib/content/opportunity-score';
import { LEVEL_LABELS } from '@/lib/content/opportunity-score';
import {
  buildMission,
  daySeed,
  dayKeyOf,
  pickTopThree,
  progressIndex,
  sinceLastVisit,
  PROGRESS_STEPS,
  RANK_TAG_LABELS,
  type Mission,
  type MissionAction,
} from '@/lib/content/daily';
import { getSessionPreviousVisit, recordVisit, setContentStatus } from '@/lib/content/store';
import { useContents, useHydrated, useProfile } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { openAdaptation } from '@/components/adaptation/adaptation-flow';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { PublishDialog, MetricsDialog } from '@/components/contents/publish-dialogs';
import { updateContent } from '@/lib/content/store';
import { deriveInsights } from '@/lib/content/insights';
import { ArrowRight, Check, Film, Sparkle, Wand } from '@/components/icons';

/* Cœur de la page Aujourd'hui : mission du jour pilotée par la machine
   d'états (A–I), top 3 des opportunités, « depuis votre dernière
   visite » et progression. Un seul recordVisit() par montage. */

export function TodayClient({
  videos,
  sounds,
  hooks,
  fallbackNiches,
  country,
}: {
  videos: Video[];
  sounds: Sound[];
  hooks: Hook[];
  fallbackNiches: string[];
  country: string;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const profile = useProfile();
  const contents = useContents();
  const [publishFor, setPublishFor] = useState<string | null>(null);
  const [metricsFor, setMetricsFor] = useState<string | null>(null);
  const [dateKey] = useState(() => dayKeyOf());
  const visitRecorded = useRef(false);

  /* Une seule écriture de visite par montage : recordVisit() déclenche
     le re-render via l'événement store — aucun setState nécessaire. */
  useEffect(() => {
    if (visitRecorded.current) return;
    visitRecorded.current = true;
    const result = recordVisit();
    track('daily_plan_viewed', { visitsToday: result.visitsToday });
    if (result.visitsToday > 1) track('daily_return_visit', {});
  }, []);

  const ctx: ScoreContext = useMemo(
    () =>
      profile
        ? {
            niches: [profile.primaryNiche, ...profile.secondaryNiches].filter(Boolean),
            primaryNiche: profile.primaryNiche || null,
            goal: profile.primaryGoal,
          }
        : { niches: fallbackNiches, primaryNiche: fallbackNiches[0] ?? null, goal: null },
    [profile, fallbackNiches],
  );

  const top = useMemo(() => pickTopThree(videos, ctx), [videos, ctx]);
  const mission: Mission = useMemo(
    () => buildMission(contents, profile, dateKey, profile?.visitsToday ?? 1),
    [contents, profile, dateKey],
  );
  const previousVisitAt = hydrated ? getSessionPreviousVisit() : null;
  const changes = useMemo(
    () =>
      sinceLastVisit(
        previousVisitAt,
        videos,
        sounds,
        hooks,
        daySeed(dateKey, ctx.primaryNiche ?? '', country),
      ),
    [previousVisitAt, videos, sounds, hooks, dateKey, ctx.primaryNiche, country],
  );
  const progress = useMemo(() => progressIndex(contents, dateKey), [contents, dateKey]);

  const missionContent = mission.contentId
    ? contents.find((c) => c.id === mission.contentId) ?? null
    : null;

  function runAction(action: MissionAction) {
    track('mission_cta_clicked', { action, state: mission.state });
    switch (action) {
      case 'adapt_top':
        if (top[0]) openAdaptation(top[0].video);
        else router.push('/opportunites');
        break;
      case 'open_content':
        if (mission.contentId) router.push(`/contenus/${mission.contentId}`);
        break;
      case 'verify':
        if (missionContent) {
          if (missionContent.status === 'script_ready' || missionContent.status === 'to_film') {
            setContentStatus(missionContent.id, 'filming');
            setContentStatus(missionContent.id, 'video_uploaded');
            track('content_marked_filmed', {});
          }
          router.push(`/contenus/${missionContent.id}/verifier`);
        }
        break;
      case 'view_corrections':
        if (mission.contentId) router.push(`/contenus/${mission.contentId}/verifier`);
        break;
      case 'mark_published':
        if (mission.contentId) setPublishFor(mission.contentId);
        break;
      case 'add_metrics':
        if (mission.contentId) setMetricsFor(mission.contentId);
        break;
      case 'prepare_tomorrow': {
        track('next_content_started', {});
        const next = top.find((t) => t.video.id !== missionContent?.sourceOpportunityId) ?? top[0];
        if (next) openAdaptation(next.video);
        else router.push('/opportunites');
        break;
      }
      case 'see_opportunities':
        router.push('/opportunites');
        break;
    }
  }

  if (!hydrated) {
    return (
      <>
        <div className="skeleton" style={{ height: 230, borderRadius: 'var(--r-xl)' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--r-lg)' }} />
      </>
    );
  }

  return (
    <>
      {/* mission du jour */}
      <section className="hero mission-card reveal" aria-labelledby="mission-title">
        <p className="eyebrow">{mission.eyebrow}</p>
        <h1 className="hero-title" id="mission-title" style={{ fontSize: 'clamp(24px, 3.4vw, 36px)' }}>
          {mission.title}
        </h1>
        <div className="hero-brief">
          <p>{mission.message}</p>
        </div>
        {missionContent && (mission.state === 'D' || mission.state === 'C') && (
          <div className="content-meta" style={{ marginTop: 4 }}>
            <span>{missionContent.duration} s</span>
            <span>· {DIFFICULTY_LABELS[missionContent.difficulty]}</span>
            <span>· {missionContent.productionTime}</span>
            <span>· {missionContent.equipment}</span>
          </div>
        )}
        {mission.state === 'D' && missionContent && missionContent.filmingChecklist.length > 0 && (
          <div className="chip-row" style={{ marginTop: 10 }}>
            {missionContent.filmingChecklist.map((item) => (
              <span key={item.id} className={`chip${item.done ? ' good' : ''}`}>
                {item.done ? <Check style={{ width: 11, height: 11 }} /> : null} {item.label}
              </span>
            ))}
          </div>
        )}
        {mission.softNudge && <p className="mission-nudge" style={{ marginTop: 12 }}>{mission.softNudge}</p>}
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => runAction(mission.primary.action)}>
            {mission.state === 'A' ? <Wand /> : null} {mission.primary.label} <ArrowRight />
          </button>
          {mission.secondary && (
            <button className="btn btn-secondary btn-lg" onClick={() => runAction(mission.secondary!.action)}>
              {mission.secondary.label}
            </button>
          )}
        </div>
        {/* progression sobre du jour */}
        <div className="progress-steps" style={{ marginTop: 22 }} aria-label={`Progression : ${progress} étapes sur ${PROGRESS_STEPS.length} terminées`}>
          {PROGRESS_STEPS.map((step, i) => (
            <span
              key={step}
              className={`progress-step${i < progress ? ' done' : i === progress ? ' current' : ''}`}
            >
              {step}
            </span>
          ))}
        </div>
      </section>

      {/* les 3 meilleures opportunités */}
      <section aria-labelledby="top-title">
        <div className="section-head">
          <div>
            <p className="eyebrow">Sélection Signal</p>
            <h2 className="section-title" id="top-title">Les meilleures opportunités pour vous</h2>
            <p className="section-sub">
              Classées selon leur croissance, leur saturation et leur pertinence pour votre activité.
            </p>
          </div>
          <Link className="section-link" href="/opportunites">
            Voir toutes les opportunités <ArrowRight />
          </Link>
        </div>
        {top.length ? (
          <div className="idea-feed">
            {top.map((r, i) => (
              <OpportunityCard
                key={r.video.id}
                video={r.video}
                delay={i * 60}
                tagLabel={`${RANK_TAG_LABELS[r.tag]} · ${LEVEL_LABELS[r.score.level]}`}
                fallbackNiches={fallbackNiches}
              />
            ))}
          </div>
        ) : (
          <div className="empty">
            <Film />
            <h4>Aucun signal suffisamment fort pour le moment</h4>
            <p>Nous préférons ne rien recommander plutôt que vous montrer une tendance peu pertinente.</p>
            <Link className="btn btn-secondary" href="/opportunites?mode=emerging">Voir les opportunités émergentes</Link>
          </div>
        )}
      </section>

      {/* depuis votre dernière visite */}
      {changes.length > 0 && (
        <section aria-labelledby="changes-title">
          <div className="section-head">
            <div>
              <p className="eyebrow">Ce qui a changé</p>
              <h2 className="section-title" id="changes-title" style={{ fontSize: 20 }}>Depuis votre dernière visite</h2>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {changes.map((c) => (
              <div key={c.text} className="review-check pass">
                <Sparkle style={{ color: 'var(--live)' }} />
                <div>{c.text}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {publishFor && (
        <PublishDialog
          onClose={() => setPublishFor(null)}
          onConfirm={(url) => {
            const c = contents.find((x) => x.id === publishFor);
            if (c) {
              if (c.status === 'video_uploaded' || c.status === 'review_in_progress') {
                setContentStatus(c.id, 'ready_to_publish');
              }
              if (c.status === 'corrections_needed') setContentStatus(c.id, 'ready_to_publish');
              setContentStatus(c.id, 'published');
              if (url) updateContent(c.id, { publishedUrl: url });
              track('content_marked_published', {});
              track('daily_content_completed', {});
              toast('Bravo — contenu du jour publié');
            }
            setPublishFor(null);
          }}
        />
      )}
      {metricsFor && (
        <MetricsDialog
          onClose={() => setMetricsFor(null)}
          onConfirm={(metrics) => {
            const c = contents.find((x) => x.id === metricsFor);
            if (c) {
              updateContent(c.id, {
                performanceMetrics: metrics,
                performanceInsights: deriveInsights(c, metrics),
              });
              if (c.status === 'published') setContentStatus(c.id, 'performance_pending');
              setContentStatus(c.id, 'performance_available');
              track('publication_metrics_added', {});
              toast('Résultats enregistrés — enseignements dans Mes contenus');
            }
            setMetricsFor(null);
          }}
        />
      )}
    </>
  );
}
