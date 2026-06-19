export type GateType = 'AND' | 'OR' | 'XOR' | 'NOT' | 'COPY' | 'ON';

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
  networkPreset: Network; // Loaded into the interactive container
  allowEditLogic: boolean;
  allowToggleNodes: boolean;
  allowScissors: boolean;
  allowPulse: boolean; // Clock stepping
  showPhiCalculations: boolean;
  quiz?: QuizQuestion;
}
