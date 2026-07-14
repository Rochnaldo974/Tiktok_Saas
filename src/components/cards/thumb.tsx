import { thumbStyle, thumbSeed } from '@/lib/visuals';

/* Generated video thumbnail: layered hue gradients + a dot grid,
   so the app needs no external images at all. */
export function ThumbBg({ hue, angle, id }: { hue: number; angle: number; id: string }) {
  const seed = thumbSeed(hue, id);
  return (
    <div className="thumb-bg" style={thumbStyle(hue, angle, id)}>
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.25 }} aria-hidden="true">
        <defs>
          <pattern id={`g${seed}`} width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="1.2" fill={`hsl(${hue} 70% 70%)`} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#g${seed})`} />
      </svg>
    </div>
  );
}
