/**
 * HOLD  – the element has no mechanism of its own; it simply keeps its state
 *         (used for the "isolated camera pixel" demo). 'ON' is kept as a legacy
 *         alias so that older saved presets still parse.
 * COPY  – fires when its input fires (with several inputs: the average).
 * NOT   – fires only when *no* input fires (i.e. classic NOT for one input, NOR for many).
 * AND   – fires only when every input fires.
 * OR    – fires when at least one input fires.
 * XOR   – fires when an odd number of inputs fire (parity).
 */
export type GateType = 'AND' | 'OR' | 'XOR' | 'NOT' | 'COPY' | 'HOLD' | 'ON';

export interface NetworkNode {
  id: string;
  label: string;
  x: number;
  y: number;
  state: boolean;
  gateType: GateType;
  inputs: string[]; // Node IDs that feed into this node
}

export interface NetworkConnection {
  from: string;
  to: string;
  isCut: boolean; // Managed by the "Scissors" tool!
}

export interface Network {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  narrative: string[]; // Step-by-step paragraphs
  actionPrompt: string; // Encouragement for what the user should do
  /** Optional scientific caveat shown at the bottom of the narrative column. */
  realityCheck?: string;
  networkPreset: Network; // Loaded into the interactive container
  allowEditLogic: boolean;
  allowToggleNodes: boolean;
  allowScissors: boolean;
  allowPulse: boolean; // Clock stepping
  showPhiCalculations: boolean;
  quiz?: QuizQuestion;
}
