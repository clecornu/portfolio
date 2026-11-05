// Tiny keyframe timeline used by the machine learning visuals.
// Keyframes follow Figma's motion semantics: a frame's easing controls the
// segment arriving at that frame, the first value holds back to t = 0 and the
// last value holds to the end of the loop.

export type Ease = "linear" | "out" | "inOut" | "outBack" | "hold";
export type Frame = readonly [time: number, value: number, ease?: Ease];
export type Track = (t: number) => void;

const bezier = (x1: number, y1: number, x2: number, y2: number) => {
  const curve = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  return (x: number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (curve(x1, x2, mid) < x) lo = mid;
      else hi = mid;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };
};

const easings: Record<Ease, (p: number) => number> = {
  linear: (p) => p,
  out: bezier(0, 0, 0.58, 1),
  inOut: bezier(0.42, 0, 0.58, 1),
  outBack: bezier(0.34, 1.56, 0.64, 1),
  hold: (p) => (p < 1 ? 0 : 1),
};

export function sample(frames: readonly Frame[], t: number): number {
  if (t <= frames[0][0]) return frames[0][1];
  for (let i = 1; i < frames.length; i++) {
    const [t1, v1, ease = "linear"] = frames[i];
    if (t <= t1) {
      const [t0, v0] = frames[i - 1];
      const p = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      return v0 + (v1 - v0) * easings[ease](p);
    }
  }
  return frames[frames.length - 1][1];
}

/** One animated value; `apply` only runs when the value changes. */
export function track(frames: readonly Frame[], apply: (value: number) => void): Track {
  let last = Number.NaN;
  return (t) => {
    const value = sample(frames, t);
    if (Math.abs(value - last) < 1e-4) return;
    last = value;
    apply(value);
  };
}

/** A visible stroke segment between trim start and trim end (needs pathLength="1"). */
export function trim(path: SVGPathElement, start: readonly Frame[], end: readonly Frame[]): Track {
  let last = "";
  return (t) => {
    const s = sample(start, t);
    const e = sample(end, t);
    const key = `${s.toFixed(4)}:${e.toFixed(4)}`;
    if (key === last) return;
    last = key;
    path.style.strokeDasharray = `${Math.max(0, e - s)} 2`;
    path.style.strokeDashoffset = `${-s}`;
  };
}

/**
 * Loops the tracks while the element is on screen. Under reduced motion nothing
 * plays and the server-rendered resting state stays in place.
 */
export function loop(root: Element, duration: number, tracks: Track[], onStart?: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  let elapsed = 0;
  let last = 0;
  let raf = 0;
  let visible = false;
  let started = false;

  const tick = (now: number) => {
    if (last) elapsed += Math.min(now - last, 100) / 1000;
    last = now;
    const t = elapsed % duration;
    for (const run of tracks) run(t);
    raf = requestAnimationFrame(tick);
  };
  const start = () => {
    if (raf || !visible || reduce.matches) return;
    if (!started) {
      started = true;
      onStart?.();
    }
    last = 0;
    raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    },
    { rootMargin: "120px" },
  ).observe(root);
  reduce.addEventListener("change", () => (reduce.matches ? stop() : start()));
}

/** Deterministic PRNG so the server render and the client timeline agree. */
export function lehmer(seed: number) {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
