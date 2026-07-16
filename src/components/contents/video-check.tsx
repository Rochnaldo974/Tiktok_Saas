'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { VideoMetadata, VideoReview } from '@/lib/content/types';
import {
  manualChecklistReview,
  readinessLabel,
  readVideoMetadata,
  REVIEW_QUESTIONS,
  type ChecklistAnswers,
} from '@/lib/content/review';
import { setContentStatus, updateContent } from '@/lib/content/store';
import { useContent, useHydrated } from '@/lib/content/use-store';
import { track } from '@/lib/analytics';
import { toast } from '@/components/toaster';
import { Check, Film, X, ArrowRight } from '@/components/icons';

/* « Vérifier ma vidéo » : sélection d'un fichier LOCAL (jamais envoyé
   à un serveur, jamais stocké — seulement ses métadonnées), aperçu,
   checklist guidée, rapport dérivé des réponses. Présenté honnêtement :
   c'est VOTRE checklist, pas une analyse IA. */

const ACCEPTED = ['video/mp4', 'video/quicktime', 'video/webm'];
const MAX_SIZE = 500 * 1024 * 1024; // 500 Mo — vérification purement locale

export function VideoCheck({ id }: { id: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const content = useContent(id);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [answers, setAnswers] = useState<ChecklistAnswers>({});
  const [dragover, setDragover] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* Révocation propre de l'objectURL — jamais de fuite mémoire. */
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (content && (content.status === 'video_uploaded' || content.status === 'corrections_needed')) {
      track('video_review_started', {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!hydrated) {
    return <div className="skeleton" style={{ height: 420, borderRadius: 'var(--r-lg)' }} />;
  }
  if (!content) {
    return (
      <div className="empty">
        <Film />
        <h4>Contenu introuvable</h4>
        <p>Il a peut-être été supprimé, ou créé sur un autre appareil (stockage local).</p>
        <Link className="btn btn-secondary" href="/contenus">Retour à Mes contenus</Link>
      </div>
    );
  }

  const review = content.videoReview;

  async function acceptFile(f: File) {
    setFileError(null);
    if (!ACCEPTED.includes(f.type)) {
      setFileError('Format non pris en charge — utilisez MP4, MOV ou WebM.');
      return;
    }
    if (f.size > MAX_SIZE) {
      setFileError('Fichier trop volumineux (500 Mo max pour l’aperçu local).');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    const meta = await readVideoMetadata(f);
    setMetadata(meta);
    updateContent(id, { videoMetadata: meta });
    if (content!.status === 'video_uploaded') setContentStatus(id, 'review_in_progress');
    track('video_selected', { type: f.type, portrait: meta.orientation === 'portrait' });
  }

  function removeFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setMetadata(null);
  }

  const answered = REVIEW_QUESTIONS.every((q) => q.id in answers);

  async function runReview() {
    if (!metadata || !content) return;
    const result = await manualChecklistReview.analyzeVideo(metadata, content, null, answers);
    updateContent(id, { videoReview: result });
    const needsFix = result.issues.length > 0 && result.readinessScore < 90;
    setContentStatus(id, needsFix ? 'corrections_needed' : 'ready_to_publish');
    track('video_review_completed', { score: result.readinessScore, issues: result.issues.length });
    toast(needsFix ? 'Rapport prêt — quelques corrections recommandées' : 'Rapport prêt — vidéo prête à publier');
  }

  return (
    <>
      <header>
        <p className="eyebrow">
          <Link href={`/contenus/${id}`} style={{ color: 'inherit' }}>{content.title.slice(0, 50)}</Link> · Vérification
        </p>
        <h1 className="page-title" style={{ marginTop: 12, fontSize: 'clamp(26px, 4vw, 36px)' }}>
          Vérifier ma vidéo
        </h1>
        <p className="page-sub" style={{ marginTop: 12 }}>
          Votre fichier reste sur votre appareil — rien n&apos;est envoyé à un serveur.
          Le rapport est basé sur <strong>votre checklist</strong> et les métadonnées du
          fichier, pas sur une analyse IA de l&apos;image.
        </p>
      </header>

      {review ? (
        <ReviewReport review={review} contentId={id} onRedo={() => updateContent(id, { videoReview: null })} />
      ) : (
        <>
          {!file ? (
            <div
              className={`upload-zone${dragover ? ' dragover' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
              onDragLeave={() => setDragover(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragover(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void acceptFile(f);
              }}
            >
              <Film style={{ width: 28, height: 28, color: 'var(--faint)' }} />
              <p><strong>Glissez votre vidéo ici</strong> ou</p>
              <button className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
                Choisir un fichier
              </button>
              <p style={{ fontSize: 12, color: 'var(--faint)' }}>MP4, MOV ou WebM · l&apos;aperçu reste local</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(',')}
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void acceptFile(f);
                }}
              />
              {fileError && <p style={{ color: 'var(--orange)', fontSize: 13 }}>{fileError}</p>}
            </div>
          ) : (
            <div className="card" style={{ padding: 16, display: 'grid', gap: 12 }}>
              {previewUrl && <video src={previewUrl} controls className="upload-preview" />}
              <div className="content-meta">
                <span>{file.name}</span>
                <span>· {(file.size / 1024 / 1024).toFixed(1)} Mo</span>
                {metadata?.duration ? <span>· {Math.round(metadata.duration)} s (script : {content.duration} s)</span> : null}
                {metadata?.orientation ? (
                  <span className={metadata.orientation === 'portrait' ? 'up' : ''} style={metadata.orientation !== 'portrait' ? { color: 'var(--orange)' } : undefined}>
                    · {metadata.orientation === 'portrait' ? 'verticale ✓' : `⚠ ${metadata.orientation === 'landscape' ? 'horizontale' : 'carrée'} — recadrez en 9:16`}
                  </span>
                ) : null}
              </div>
              <div className="card-actions">
                <button className="btn btn-ghost btn-sm" onClick={removeFile}><X /> Remplacer la vidéo</button>
              </div>
            </div>
          )}

          {file && (
            <section aria-label="Checklist de vérification">
              <h2 className="section-title" style={{ fontSize: 18, marginBottom: 4 }}>Votre checklist</h2>
              <p className="section-sub" style={{ marginBottom: 14 }}>
                Regardez votre vidéo et répondez honnêtement — le rapport en découle.
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {REVIEW_QUESTIONS.map((q) => (
                  <div key={q.id} className="review-check-row">
                    <span>{q.label}</span>
                    <div className="review-check-actions" role="radiogroup" aria-label={q.label}>
                      <button
                        role="radio"
                        aria-checked={answers[q.id] === true}
                        className={`pill${answers[q.id] === true ? ' on' : ''}`}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: true }))}
                      >
                        Oui
                      </button>
                      <button
                        role="radio"
                        aria-checked={answers[q.id] === false}
                        className={`pill${answers[q.id] === false ? ' on' : ''}`}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: false }))}
                      >
                        Pas encore
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="card-actions" style={{ marginTop: 18 }}>
                <button className="btn btn-primary btn-lg" disabled={!answered} onClick={runReview}>
                  Générer mon rapport <ArrowRight />
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setContentStatus(id, 'ready_to_publish');
                    toast('Vérification passée — prête à publier');
                    router.push('/contenus');
                  }}
                >
                  Passer la vérification
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}

function ReviewReport({
  review,
  contentId,
  onRedo,
}: {
  review: VideoReview;
  contentId: string;
  onRedo: () => void;
}) {
  const router = useRouter();
  return (
    <div className="review-report">
      <div className="score-hero" style={{ marginBottom: 6 }}>
        <div>
          <div className="score-num">{review.readinessScore}<small>/100</small></div>
          <div className="score-label">Score de préparation — {readinessLabel(review.readinessScore)}</div>
        </div>
      </div>
      <p style={{ fontSize: 12, color: 'var(--faint)' }}>
        Rapport basé sur votre checklist et les métadonnées du fichier (mode : vérification manuelle).
      </p>

      {review.issues.length > 0 && (
        <section aria-label="Améliorations recommandées">
          <h3 className="section-title" style={{ fontSize: 17, margin: '18px 0 10px' }}>
            {review.issues.length} amélioration{review.issues.length > 1 ? 's' : ''} avant publication
          </h3>
          <div style={{ display: 'grid', gap: 10 }}>
            {review.issues.map((issue, i) => (
              <div key={issue} className="review-check fail">
                <X />
                <div>
                  <strong>{issue}</strong>
                  {review.recommendations[i] ? <p>{review.recommendations[i]}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {review.strengths.length > 0 && (
        <section aria-label="Points réussis">
          <h3 className="section-title" style={{ fontSize: 17, margin: '18px 0 10px' }}>Points réussis</h3>
          <div className="chip-row">
            {review.strengths.map((s) => (
              <span key={s} className="chip good"><Check style={{ width: 11, height: 11 }} /> {s}</span>
            ))}
          </div>
        </section>
      )}

      <div className="card-actions" style={{ marginTop: 20, flexWrap: 'wrap' }}>
        {review.issues.length > 0 ? (
          <button
            className="btn btn-primary"
            onClick={() => {
              setContentStatus(contentId, 'ready_to_publish');
              toast('Marquée comme corrigée — prête à publier');
              router.push('/contenus');
            }}
          >
            Marquer comme corrigée
          </button>
        ) : (
          <button className="btn btn-primary" onClick={() => router.push('/contenus')}>
            Continuer vers la publication <ArrowRight />
          </button>
        )}
        <button className="btn btn-secondary" onClick={onRedo}>Refaire la vérification</button>
        <Link className="btn btn-ghost" href="/contenus">Retour à Mes contenus</Link>
      </div>
    </div>
  );
}
