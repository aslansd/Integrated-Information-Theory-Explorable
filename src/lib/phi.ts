import { Network, NetworkNode, NetworkConnection } from '../types';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  A TOY Φ FOR TEACHING
 * ─────────────────────────────────────────────────────────────────────────────
 *  This file computes a *simplified*, deliberately readable analogue of the Φ
 *  of Integrated Information Theory. Two honest caveats, restated in the UI:
 *
 *  1. Real IIT compares full probability *distributions* over past and future
 *     states using an earth-mover's distance. Here we compare the expected
 *     activation of each element (an L1 distance on expectations). Same spirit,
 *     far cheaper, and it moves in the same direction.
 *  2. Real IIT also searches every *subset* of elements to find the maximally
 *     irreducible one (the "complex") and applies the exclusion postulate.
 *     Here we always evaluate the whole network the user drew.
 *
 *  Everything below is exact and deterministic, so the numbers on screen can
 *  always be re-derived by hand — which is the point of an explorable.
 */

/** Value fed down a severed wire when we *measure* Φ: maximum-entropy noise. */
export const NOISE = 0.5;

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const orOf = (xs: number[]) => 1 - xs.reduce((acc, x) => acc * (1 - x), 1);

/**
 * Evaluates a logic gate with continuous inputs in [0, 1]. With crisp 0/1
 * inputs every case below collapses to the ordinary boolean truth table; the
 * continuous form is only used when a wire has been cut and carries noise.
 *
 * Products assume the inputs are independent — true for the single-cut
 * partitions this app evaluates.
 */
export function evaluateGate(
  gateType: string,
  inputs: number[],
  nodeState: boolean,
): number {
  // A node with no incoming wires has no mechanism to update itself.
  if (inputs.length === 0) return nodeState ? 1 : 0;

  switch (gateType) {
    case 'HOLD':
    case 'ON':
      return nodeState ? 1 : 0;

    // Copies its input. With several inputs it copies their average activity.
    case 'COPY':
      return mean(inputs);

    // Fires only when nothing feeds it. One input => classic NOT; many => NOR.
    case 'NOT':
      return 1 - orOf(inputs);

    case 'AND':
      return inputs.reduce((acc, x) => acc * x, 1);

    case 'OR':
      return orOf(inputs);

    // Parity over *all* inputs, built up pair by pair:
    // P(odd so far) after adding x is  p(1-x) + (1-p)x.
    case 'XOR':
      return inputs.reduce((p, x) => p * (1 - x) + (1 - p) * x, 0);

    default:
      return nodeState ? 1 : 0;
  }
}

/** Collects the live input values of a node for the *dynamics* (clock ticks). */
export function gatherLiveInputs(
  node: NetworkNode,
  allNodes: NetworkNode[],
  connections: NetworkConnection[],
): number[] {
  return node.inputs.map((inputId) => {
    const conn = connections.find((c) => c.from === inputId && c.to === node.id);
    // A severed or missing wire simply delivers nothing while the system runs.
    if (!conn || conn.isCut) return 0;
    const source = allNodes.find((n) => n.id === inputId);
    return source && source.state ? 1 : 0;
  });
}

/** One synchronous clock tick: every element updates from the previous state. */
export function stepNetwork(network: Network): Network {
  const nodes = network.nodes.map((node) => {
    const inputs = gatherLiveInputs(node, network.nodes, network.connections);
    const next = evaluateGate(node.gateType, inputs, node.state);
    return { ...node, state: next >= 0.5 };
  });
  return { ...network, nodes };
}

/**
 * Predicts a node's next-state value for the *measurement* of Φ.
 * Here a cut wire carries NOISE (0.5) rather than 0: partitioning in IIT means
 * replacing what crosses the cut with maximum-entropy input, not silencing it.
 */
export function predictNodeNextState(
  node: NetworkNode,
  allNodes: NetworkNode[],
  connections: NetworkConnection[],
  cutsOverride?: { from: string; to: string }[],
): number {
  const inputs: number[] = node.inputs.map((inputId) => {
    const source = allNodes.find((n) => n.id === inputId);
    if (!source) return NOISE;

    const conn = connections.find((c) => c.from === inputId && c.to === node.id);
    const severed = conn
      ? conn.isCut ||
        !!cutsOverride?.some((ov) => ov.from === inputId && ov.to === node.id)
      : true; // no wire in the graph at all == disconnected

    return severed ? NOISE : source.state ? 1 : 0;
  });

  return evaluateGate(node.gateType, inputs, node.state);
}

/**
 * Cycle detection over the *uncut* directed graph. A network with no cycle is
 * strictly feedforward.
 */
export function hasFeedbackLoops(network: Network): boolean {
  const adj: Record<string, string[]> = {};
  for (const node of network.nodes) adj[node.id] = [];
  for (const conn of network.connections) {
    if (!conn.isCut && adj[conn.from]) adj[conn.from].push(conn.to);
  }

  const visited: Record<string, boolean> = {};
  const inStack: Record<string, boolean> = {};

  const walk = (id: string): boolean => {
    if (inStack[id]) return true;
    if (visited[id]) return false;
    visited[id] = true;
    inStack[id] = true;
    for (const next of adj[id] || []) {
      if (walk(next)) return true;
    }
    inStack[id] = false;
    return false;
  };

  return network.nodes.some((n) => walk(n.id));
}

export interface PartitionResult {
  /** Human readable, e.g. "{A} | {B, C}" */
  name: string;
  partA: string[];
  partB: string[];
  cutConnections: { from: string; to: string }[];
  /** Raw prediction loss summed over every element. */
  loss: number;
  /** loss / min(|A|, |B|) — used to compare cuts of different sizes fairly. */
  normalizedLoss: number;
}

export interface PhiResult {
  phi: number;
  mip: PartitionResult | null;
  partitions: PartitionResult[];
  uncutPredictions: Record<string, number>;
  /** Plain-language reason whenever Φ is pinned to 0 for a structural reason. */
  note: string | null;
}

/**
 * Enumerates every unordered bipartition {A, B} of the elements.
 * Node 0 is always placed in A, which removes the A/B mirror duplicates:
 * 2^(n-1) - 1 partitions for n elements.
 */
function enumerateBipartitions(ids: string[]): Array<[string[], string[]]> {
  const out: Array<[string[], string[]]> = [];
  const n = ids.length;
  if (n < 2) return out;

  for (let mask = 0; mask < 1 << (n - 1); mask++) {
    const a: string[] = [ids[0]];
    const b: string[] = [];
    for (let i = 1; i < n; i++) {
      if (mask & (1 << (i - 1))) a.push(ids[i]);
      else b.push(ids[i]);
    }
    if (b.length === 0) continue; // trivial "everything in one part"
    out.push([a, b]);
  }
  return out;
}

const fmt = (part: string[]) => `{${part.join(', ')}}`;

/**
 * Calculates the system's Φ.
 *
 * Method: cut the network along every possible bipartition, replacing every
 * wire that crosses the cut (in both directions) with noise, and measure how
 * much the system's prediction of its own next state degrades.
 *
 * The Minimum Information Partition (MIP) is the *cheapest* such cut — the
 * system's weakest seam. Following IIT 3.0, candidate cuts are ranked by a
 * size-normalized loss (so a lopsided 1-vs-2 split isn't unfairly favoured),
 * but the Φ we report is the *raw* loss at that winning cut.
 */
export function calculatePhi(network: Network): PhiResult {
  const { nodes, connections } = network;

  const uncutPredictions: Record<string, number> = {};
  for (const node of nodes) {
    uncutPredictions[node.id] = predictNodeNextState(node, nodes, connections, []);
  }

  const activeConnections = connections.filter((c) => !c.isCut);

  if (nodes.length < 2 || activeConnections.length === 0) {
    return {
      phi: 0,
      mip: null,
      partitions: [],
      uncutPredictions,
      note:
        nodes.length < 2
          ? 'A single element cannot be divided, so there is nothing to integrate.'
          : 'No live wires: the elements are an aggregate of independent parts, not a whole.',
    };
  }

  const ids = nodes.map((n) => n.id);
  const partitions: PartitionResult[] = enumerateBipartitions(ids).map(([a, b]) => {
    const inA = new Set(a);
    const crossing = activeConnections
      .filter((c) => inA.has(c.from) !== inA.has(c.to))
      .map((c) => ({ from: c.from, to: c.to }));

    let loss = 0;
    for (const n of nodes) {
      const cutPrediction = predictNodeNextState(n, nodes, connections, crossing);
      loss += Math.abs(uncutPredictions[n.id] - cutPrediction);
    }
    loss = parseFloat(loss.toFixed(4));

    return {
      name: `${fmt(a)} | ${fmt(b)}`,
      partA: a,
      partB: b,
      cutConnections: crossing,
      loss,
      normalizedLoss: parseFloat((loss / Math.min(a.length, b.length)).toFixed(4)),
    };
  });

  // Cheapest seam first: normalized loss decides, raw loss breaks ties.
  partitions.sort(
    (x, y) => x.normalizedLoss - y.normalizedLoss || x.loss - y.loss,
  );

  const mip = partitions[0] ?? null;
  let phi = mip ? mip.loss : 0;
  let note: string | null = null;

  // A partition that severs nothing means the two halves were already
  // independent — the "system" is really two systems.
  if (mip && mip.cutConnections.length === 0) {
    phi = 0;
    note = `The split ${mip.name} cuts no live wire at all, so these halves are already independent systems.`;
  } else if (!hasFeedbackLoops(network)) {
    // Strictly feedforward networks are reducible in IIT: nothing inside the
    // system causes its own first layer, so its cause-effect power factorises.
    phi = 0;
    note =
      'This network is strictly feedforward — no signal ever returns to its source. Such systems can be decomposed without loss, so IIT assigns them Φ = 0 no matter how much information they carry.';
  }

  return {
    phi: parseFloat(phi.toFixed(2)),
    mip,
    partitions,
    uncutPredictions,
    note,
  };
}
