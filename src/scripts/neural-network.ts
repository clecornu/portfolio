import { lehmer, loop, track, trim, type Frame, type Track } from "@/scripts/timeline";

// A 4-layer MLP (shown as 10 → 9 → 7 → 10 nodes) running one training step:
// forward pass left to right, loss at the output, backprop right to left.
// Geometry, weights and timings mirror the Figma frame "NN — forward + backprop".

export const LAYER_X = [348, 548, 748, 948];
export const LAYER_N = [10, 9, 7, 10];
const SPACING = 24;
const CENTER_Y = 196;
const GAP = 200;

export const LOOP = 5.8;
const DIM = 0.1;
const TRAVEL = 0.5;
const LAG_FORWARD = 0.2;
const LAG_BACKWARD = 0.32;
const STEP = 0.62;
const RESET = 4.85;
const forwardAt = (g: number) => 0.4 + g * STEP;
const backwardAt = (g: number) => 2.75 + (2 - g) * STEP;
const arriveAt = [0.1, forwardAt(0) + TRAVEL, forwardAt(1) + TRAVEL, forwardAt(2) + TRAVEL];
const LOSS_AT = 2.3;

const nodeY = (n: number, i: number) => CENTER_Y + (i - (n - 1) / 2) * SPACING;
const probabilities = [0.01, 0.2, 0.01, 0.01, 0.01, 0.01, 0.01, 0.62, 0, 0.12];
const TARGET = 7;

export interface Edge {
  gap: number;
  d: string;
  base: number;
  forward: number;
  backward: number;
  forwardJitter: number;
  backwardJitter: number;
  flashJitter: number;
}
export interface Neuron {
  layer: number;
  index: number;
  cx: number;
  cy: number;
  activation: number;
  ringAt?: number;
  ringStrength?: number;
}

export function buildNetwork() {
  // Same random draws, in the same order, as the Figma build.
  const rnd = lehmer(11);
  const activations = [
    [0.15, 0.9, 0.2, 1, 0.15, 0.7, 0.15, 0.95, 0.3, 0.15],
    Array.from({ length: 9 }, () => 0.15 + rnd() * 0.85),
    Array.from({ length: 7 }, () => 0.15 + rnd() * 0.85),
    probabilities.map((p) => 0.15 + (0.85 * p) / 0.62),
  ];
  const weights = [0, 1, 2].map((g) =>
    Array.from({ length: LAYER_N[g] }, () => Array.from({ length: LAYER_N[g + 1] }, () => rnd())),
  );
  const edges: Edge[] = [];
  for (let g = 0; g < 3; g++) {
    for (let i = 0; i < LAYER_N[g]; i++) {
      for (let j = 0; j < LAYER_N[g + 1]; j++) {
        const w = weights[g][i][j];
        edges.push({
          gap: g,
          d: `M${LAYER_X[g] + 5} ${nodeY(LAYER_N[g], i)} L${LAYER_X[g] + GAP - 5} ${nodeY(LAYER_N[g + 1], j)}`,
          base: 0.03 + w ** 2 * 0.22,
          forward: 0.1 + 0.85 * activations[g][i] * (0.3 + 0.7 * w),
          backward: 0,
          forwardJitter: 0,
          backwardJitter: 0,
          flashJitter: 0,
        });
      }
    }
  }
  for (const edge of edges) edge.forwardJitter = rnd() * 0.06;

  const neurons: Neuron[] = [];
  for (let g = 0; g < 4; g++) {
    for (let i = 0; i < LAYER_N[g]; i++) {
      neurons.push({ layer: g, index: i, cx: LAYER_X[g], cy: nodeY(LAYER_N[g], i), activation: activations[g][i] });
    }
  }
  const layer = (g: number) => neurons.filter((n) => n.layer === g);
  layer(3).forEach((n) => {
    const error = Math.abs(probabilities[n.index] - (n.index === TARGET ? 1 : 0));
    n.ringAt = LOSS_AT;
    n.ringStrength = 0.1 + (0.9 * error) / 0.38;
  });
  for (const g of [2, 1]) {
    layer(g).forEach((n) => {
      n.ringAt = backwardAt(g) + TRAVEL + rnd() * 0.04;
      n.ringStrength = 0.25 + rnd() * 0.65;
    });
  }

  const back = lehmer(97);
  const gradients = [0, 1, 2].map((g) => Array.from({ length: LAYER_N[g + 1] }, () => 0.3 + back() * 0.7));
  for (let g = 0; g < 3; g++) {
    const inGap = edges.filter((e) => e.gap === g);
    inGap.forEach((e, n) => {
      const j = n % LAYER_N[g + 1];
      e.backward = 0.08 + 0.6 * gradients[g][j] * (0.3 + 0.7 * back());
    });
    inGap.forEach((e) => (e.backwardJitter = back() * 0.06));
  }
  for (const edge of edges) edge.flashJitter = back() * 0.05;

  return { edges, neurons };
}

export function animateNetwork(root: SVGSVGElement) {
  const { edges, neurons } = buildNetwork();
  const q = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const base = q<SVGPathElement>("[data-edge-base]");
  const forward = q<SVGPathElement>("[data-edge-forward]");
  const backward = q<SVGPathElement>("[data-edge-backward]");
  const dots = q<SVGCircleElement>("[data-neuron]");
  const rings = q<SVGCircleElement>("[data-ring]");
  const signals = q<SVGGElement>("[data-signal]");
  const tracks: Track[] = [];

  edges.forEach((e, n) => {
    const tf = forwardAt(e.gap) + e.forwardJitter;
    tracks.push(trim(forward[n], [[tf + LAG_FORWARD, 0], [tf + LAG_FORWARD + TRAVEL, 1, "inOut"]], [[tf, 0], [tf + TRAVEL, 1, "inOut"]]));
    const tb = backwardAt(e.gap) + e.backwardJitter;
    tracks.push(trim(backward[n], [[tb, 1], [tb + TRAVEL, 0, "inOut"]], [[tb + LAG_BACKWARD, 1], [tb + LAG_BACKWARD + TRAVEL, 0, "inOut"]]));
    const tw = backwardAt(e.gap) + 0.15 + e.flashJitter;
    const flash: Frame[] = [[tw, 1], [tw + 0.25, 1.9, "out"], [tw + 0.85, 1, "inOut"]];
    tracks.push(track(flash, (v) => base[n].setAttribute("stroke-width", v.toFixed(3))));
  });

  neurons.forEach((nrn, n) => {
    const t = arriveAt[nrn.layer] + (nrn.layer === 0 ? nrn.index * 0.015 : 0);
    const a = nrn.activation;
    const frames: Frame[] = [[t, DIM], [t + 0.12, Math.min(1, a + 0.35), "out"], [t + 0.45, a, "inOut"], [RESET, a], [RESET + 0.5, DIM, "inOut"]];
    tracks.push(track(frames, (v) => (dots[n].style.opacity = v.toFixed(3))));
    if (nrn.ringAt !== undefined) {
      const r = nrn.ringAt;
      const ring = rings[n];
      tracks.push(track([[r, 0], [r + 0.06, nrn.ringStrength!, "out"], [r + 0.65, 0, "out"]], (v) => (ring.style.opacity = v.toFixed(3))));
      tracks.push(track([[r, 1], [r + 0.65, 2.8, "out"]], (v) => ring.setAttribute("r", (5 * v).toFixed(2))));
    }
  });

  loop(root, LOOP, tracks, () => signals.forEach((g) => (g.style.opacity = "1")));
}
