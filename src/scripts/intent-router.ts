import { loop, track, trim, type Frame, type Track } from "@/scripts/timeline";

// The intent classifier routing customer messages one at a time: the message
// lights up, its path draws into DistilBERT, the six layers fire in sequence and
// the path lands on the predicted intent. Based on "A2 — Message router" in Figma.

export const LANES = [
  "schedule_service",
  "reschedule_service",
  "water_issue",
  "equipment_issue",
  "pricing_billing",
  "service_status",
];
export const MESSAGES = [
  { text: "can you come thursday instead?", lane: 1 },
  { text: "pool’s green again, help", lane: 2 },
  { text: "how much is a weekly clean?", lane: 4 },
  { text: "heater won’t turn on", lane: 3 },
];
export const LAYER_REST = [0.18, 0.21, 0.24, 0.27, 0.3, 0.33];

const CYCLE = 2.6;
const LOOP = CYCLE * MESSAGES.length;
const LANE_HEIGHT = 32;
const LANE_REST = 0.55;

const curve = (x1: number, y1: number, x2: number, y2: number) => {
  const mid = (x1 + x2) / 2;
  return `M${x1} ${y1} C${mid} ${y1} ${mid} ${y2} ${x2} ${y2}`;
};

export function animateRouter(root: HTMLElement) {
  const q = <T extends Element>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const svg = root.querySelector<SVGSVGElement>("[data-wires]")!;
  const wiresIn = q<SVGPathElement>("[data-wire-in]");
  const wiresOut = q<SVGPathElement>("[data-wire-out]");
  const activeIn = q<SVGPathElement>("[data-wire-in-active]");
  const activeOut = q<SVGPathElement>("[data-wire-out-active]");
  const messages = q<HTMLElement>("[data-message]");
  const messageActive = q<HTMLElement>("[data-message-active]");
  const messageText = q<HTMLElement>("[data-message-text]");
  const layers = q<HTMLElement>("[data-layer]");
  const lanes = q<HTMLElement>("[data-lane]");
  const highlight = root.querySelector<HTMLElement>("[data-lane-highlight]")!;
  const model = root.querySelector<HTMLElement>("[data-model]")!;

  // Wires connect the measured boxes, so they follow the layout at any width.
  const layout = () => {
    const box = root.getBoundingClientRect();
    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    const m = model.getBoundingClientRect();
    const my = m.top + m.height / 2 - box.top;
    messages.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = curve(r.right - box.left, r.top + r.height / 2 - box.top, m.left - box.left, my);
      wiresIn[i].setAttribute("d", d);
      activeIn[i].setAttribute("d", d);
    });
    lanes.forEach((el, j) => {
      const r = el.getBoundingClientRect();
      const d = curve(m.right - box.left, my, r.left - box.left, r.top + r.height / 2 - box.top);
      wiresOut[j].setAttribute("d", d);
      activeOut[j].setAttribute("d", d);
    });
  };
  layout();
  new ResizeObserver(layout).observe(root);
  document.fonts?.ready.then(layout);

  const tracks: Track[] = [];
  const opacity = (el: HTMLElement) => (v: number) => (el.style.opacity = v.toFixed(3));
  const layerFrames: Frame[][] = LAYER_REST.map(() => []);
  const laneFrames: Frame[][] = LANES.map(() => []);
  const highlightFrames: Frame[] = [];

  MESSAGES.forEach((message, i) => {
    const c = i * CYCLE;
    const previous = MESSAGES[(i + MESSAGES.length - 1) % MESSAGES.length].lane;

    tracks.push(track([[c, 0], [c + 0.3, 1, "out"], [c + 2.35, 1], [c + 2.6, 0, "inOut"]], opacity(messageActive[i])));
    tracks.push(track([[c, 0.5], [c + 0.3, 1, "out"], [c + 2.35, 1], [c + 2.6, 0.5, "inOut"]], opacity(messageText[i])));

    // Path into the model, then retract once the intent has been picked.
    const retract: Frame[] = [[c + 2.2, 0], [c + 2.6, 1, "inOut"], [c + 2.601, 0, "hold"]];
    tracks.push(trim(activeIn[i], retract, [[c + 0.3, 0], [c + 0.85, 1, "inOut"], [c + 2.6, 1], [c + 2.601, 0, "hold"]]));
    tracks.push(trim(activeOut[message.lane], retract, [[c + 1.6, 0], [c + 2.05, 1, "inOut"], [c + 2.6, 1], [c + 2.601, 0, "hold"]]));

    LAYER_REST.forEach((rest, b) => {
      const t = c + 0.85 + b * 0.12;
      layerFrames[b].push([t, rest], [t + 0.12, 0.95, "out"], [t + 0.6, rest, "inOut"]);
    });

    highlightFrames.push([c + 1.95, previous * LANE_HEIGHT], [c + 2.2, message.lane * LANE_HEIGHT, "inOut"]);
    LANES.forEach((_, j) => {
      const from = j === previous ? 1 : LANE_REST;
      const to = j === message.lane ? 1 : LANE_REST;
      laneFrames[j].push([c + 1.95, from], [c + 2.2, to, "inOut"]);
    });
  });

  layers.forEach((el, b) => tracks.push(track(layerFrames[b], opacity(el))));
  lanes.forEach((el, j) => tracks.push(track(laneFrames[j], opacity(el))));
  tracks.push(track(highlightFrames, (v) => (highlight.style.transform = `translateY(${v.toFixed(2)}px)`)));

  loop(root, LOOP, tracks);
}
