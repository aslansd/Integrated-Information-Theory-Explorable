import { Network, NetworkNode, NetworkConnection } from '../types';

/**
 * Evaluates a logic gate mathematically with continuous inputs (ranging from 0 to 1).
 * Supports standard boolean states and continuous noise (0.5).
 */
export function evaluateGate(gateType: string, inputs: number[], nodeState: boolean): number {
  if (inputs.length === 0) {
    // If a node has no inputs, its next state defaults to its current state
    return nodeState ? 1 : 0;
  }

  switch (gateType) {
    case 'ON':
      return nodeState ? 1 : 0;

    case 'COPY':
      // Takes primary input, defaults to first input
      return inputs[0];

    case 'NOT':
      return 1 - inputs[0];

    case 'AND': {
      // Product of all inputs
      let result = 1;
      for (const val of inputs) {
        result *= val;
      }
      return result;
    }

    case 'OR': {
      // 1 - product of the negative inputs
      let oppProduct = 1;
      for (const val of inputs) {
        oppProduct *= (1 - val);
      }
      return 1 - oppProduct;
    }

    case 'XOR': {
      if (inputs.length < 2) {
        // Fallback for single input XOR (acts as COPY)
        return inputs[0];
      }
      // For two inputs: A(1-B) + B(1-A)
      const a = inputs[0];
      const b = inputs[1];
      return a * (1 - b) + b * (1 - a);
    }

    default:
      return nodeState ? 1 : 0;
  }
}

/**
 * Predicts the next-state value of a node given specific cut connections.
 * If a connection feeding an input is cut, that input yields 0.5 (noise).
 */
export function predictNodeNextState(
  node: NetworkNode,
  allNodes: NetworkNode[],
  connections: NetworkConnection[],
  cutsOverride?: { from: string; to: string }[]
): number {
  const inputs: number[] = [];

  for (const inputId of node.inputs) {
    const sourceNode = allNodes.find(n => n.id === inputId);
    if (!sourceNode) {
      inputs.push(0.5);
      continue;
    }

    // Check if connection is active and uncut
    const conn = connections.find(c => c.from === inputId && c.to === node.id);
    const isConnectionCut = conn
      ? conn.isCut || !!cutsOverride?.some(ov => ov.from === inputId && ov.to === node.id)
      : true; // If no connection structure exists, it's considered disconnected (cut)

    if (isConnectionCut) {
      inputs.push(0.5); // Inject random noise representing cut
    } else {
      inputs.push(sourceNode.state ? 1 : 0);
    }
  }

  return evaluateGate(node.gateType, inputs, node.state);
}

/**
 * Checks if there are active (uncut) feedback loops in the network.
 * Uses a DFS cycle-detection on the directed graph of uncut connections.
 */
export function hasFeedbackLoops(network: Network): boolean {
  const uncutConnections = network.connections.filter(c => !c.isCut);
  const adj: Record<string, string[]> = {};

  for (const node of network.nodes) {
    adj[node.id] = [];
  }

  for (const conn of uncutConnections) {
    if (adj[conn.from]) {
      adj[conn.from].push(conn.to);
    }
  }

  const visited: Record<string, boolean> = {};
  const recStack: Record<string, boolean> = {};

  function isCyclicUtil(nodeId: string): boolean {
    if (recStack[nodeId]) return true;
    if (visited[nodeId]) return false;

    visited[nodeId] = true;
    recStack[nodeId] = true;

    const neighbors = adj[nodeId] || [];
    for (const neighbor of neighbors) {
      if (isCyclicUtil(neighbor)) {
        return true;
      }
    }

    recStack[nodeId] = false;
    return false;
  }

  for (const node of network.nodes) {
    if (isCyclicUtil(node.id)) {
      return true;
    }
  }

  return false;
}

export interface PartitionResult {
  name: string;
  cutConnections: { from: string; to: string }[];
  loss: number;
}

/**
 * Calculates the system phi (Φ) and evaluates all candidate partitions.
 * High Φ means the system behaves as a unified, highly integrated loop.
 * Φ is 0 if no feedback loop exists.
 */
export function calculatePhi(network: Network): {
  phi: number;
  mip: PartitionResult | null;
  partitions: PartitionResult[];
  uncutPredictions: Record<string, number>;
} {
  const { nodes, connections } = network;

  // 1. Calculate uncut predictions (the whole system's future state prediction)
  const uncutPredictions: Record<string, number> = {};
  for (const node of nodes) {
    uncutPredictions[node.id] = predictNodeNextState(node, nodes, connections, []);
  }

  // If there are no connections, phi is 0
  if (connections.length === 0) {
    return { phi: 0, mip: null, partitions: [], uncutPredictions };
  }

  // If there is no feedback loop (strongly connected flow), phi is 0 in IIT
  const hasFeedback = hasFeedbackLoops(network);
  if (!hasFeedback) {
    return {
      phi: 0,
      mip: { name: 'Whole System Split', cutConnections: [], loss: 0 },
      partitions: [{ name: 'Whole System Split', cutConnections: [], loss: 0 }],
      uncutPredictions,
    };
  }

  // 2. Generate candidate partitions
  // For pedagogical clarity, we define several clean structural cuts in our 2-3 node systems:
  // - Cutting each individual active (uncut) connection
  // - Bi-partition splits (e.g. separating a node entirely)
  const activeConnections = connections.filter(c => !c.isCut);
  const partitions: PartitionResult[] = [];

  // Candidate A: Cut single active links
  for (const conn of activeConnections) {
    const cutOverride = [{ from: conn.from, to: conn.to }];
    
    // Evaluate predictions under this cut
    let totalLoss = 0;
    for (const node of nodes) {
      const predCut = predictNodeNextState(node, nodes, connections, cutOverride);
      totalLoss += Math.abs(uncutPredictions[node.id] - predCut);
    }

    partitions.push({
      name: `Cut Link ${conn.from} → ${conn.to}`,
      cutConnections: cutOverride,
      loss: parseFloat(totalLoss.toFixed(2)),
    });
  }

  // Candidate B: Cut each node's entire input-flow (separating that node from the whole)
  for (const node of nodes) {
    const nodeInputs = activeConnections.filter(c => c.to === node.id);
    if (nodeInputs.length > 0) {
      const cutOverride = nodeInputs.map(c => ({ from: c.from, to: c.to }));

      let totalLoss = 0;
      for (const n of nodes) {
        const predCut = predictNodeNextState(n, nodes, connections, cutOverride);
        totalLoss += Math.abs(uncutPredictions[n.id] - predCut);
      }

      partitions.push({
        name: `Isolate Node ${node.id}`,
        cutConnections: cutOverride,
        loss: parseFloat(totalLoss.toFixed(2)),
      });
    }
  }

  // Sort partitions by loss ascending.
  // The MIP (Minimum Information Partition) is the non-empty cut that inflicts the LEAST destruction (minimum loss).
  // In IIT, if you can divide the system with very little loss, then the system is weakly integrated.
  // The system's Φ is limited by its weakest integration point (its MIP score).
  partitions.sort((a, b) => a.loss - b.loss);

  // We filter out any partitions that resulted in 0 loss if they did change states,
  // but if the lowest loss is non-zero, that is our MIP.
  // Let's filter out partitions with 0 connections cut (trivial)
  const validPartitions = partitions.filter(p => p.cutConnections.length > 0);

  let mip: PartitionResult | null = null;
  let phi = 0;

  if (validPartitions.length > 0) {
    // The MIP is the partition with the minimum non-zero loss of information
    mip = validPartitions[0];
    phi = mip.loss;
  }

  return {
    phi: parseFloat(phi.toFixed(2)),
    mip,
    partitions: validPartitions,
    uncutPredictions,
  };
}
