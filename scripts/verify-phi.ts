/**
 * Sanity checks for the Φ engine. Run with:  npx tsx scripts/verify-phi.ts
 *
 * These are the invariants the explorable teaches. If one of them breaks, the
 * chapters are lying to the reader.
 */
import { calculatePhi, stepNetwork, evaluateGate } from '../src/lib/phi';
import { chapters } from '../src/data/chapters';
import { Network, GateType } from '../src/types';

let failures = 0;
const check = (name: string, ok: boolean, detail = '') => {
  console.log(`${ok ? '  ok  ' : ' FAIL '} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

const clone = (n: Network): Network => structuredClone(n);
const phiOf = (n: Network) => calculatePhi(n).phi;

// ── Gate truth tables ───────────────────────────────────────────────────────
check('AND(1,1)=1', evaluateGate('AND', [1, 1], false) === 1);
check('AND(1,0)=0', evaluateGate('AND', [1, 0], false) === 0);
check('OR(0,0)=0', evaluateGate('OR', [0, 0], false) === 0);
check('OR(0,1)=1', evaluateGate('OR', [0, 1], false) === 1);
check('NOT(1)=0', evaluateGate('NOT', [1], false) === 0);
check('NOR(0,0)=1', evaluateGate('NOT', [0, 0], false) === 1);
check('XOR(1,1)=0', evaluateGate('XOR', [1, 1], false) === 0);
check('XOR parity over 3 inputs', evaluateGate('XOR', [1, 1, 1], false) === 1);
check('HOLD keeps state', evaluateGate('HOLD', [1, 0], true) === 1);

// ── Chapter invariants ──────────────────────────────────────────────────────
const ch = (id: number) => clone(chapters.find((c) => c.id === id)!.networkPreset);

check('Ch1 disconnected pixels have Φ = 0', phiOf(ch(1)) === 0);

const fireflies = ch(2);
check('Ch2 firefly loop has Φ > 0', phiOf(fireflies) > 0, `Φ=${phiOf(fireflies)}`);
fireflies.connections[0].isCut = true;
check('Ch2 with one wire cut is feedforward, Φ = 0', phiOf(fireflies) === 0);

const stepped = stepNetwork(ch(2)); // Alice ON, Bob OFF, both COPY
check(
  'Ch2 tick swaps the two states',
  stepped.nodes.find((n) => n.id === 'A')!.state === false &&
    stepped.nodes.find((n) => n.id === 'B')!.state === true,
);

for (const c of chapters) {
  const preset = clone(c.networkPreset);
  const ids = new Set(preset.nodes.map((n) => n.id));
  const inputsMatchWires = preset.nodes.every((n) =>
    n.inputs.every(
      (i) => ids.has(i) && preset.connections.some((w) => w.from === i && w.to === n.id),
    ),
  );
  const wiresMatchInputs = preset.connections.every((w) =>
    preset.nodes.find((n) => n.id === w.to)?.inputs.includes(w.from),
  );
  check(`Ch${c.id} preset graph is self-consistent`, inputsMatchWires && wiresMatchInputs);
}

// ── The advertised ceiling ──────────────────────────────────────────────────
const gates: GateType[] = ['COPY', 'NOT', 'AND', 'OR', 'XOR'];
const pairs: [string, string][] = [
  ['A', 'B'], ['B', 'A'], ['A', 'C'], ['C', 'A'], ['B', 'C'], ['C', 'B'],
];
let max = 0;
for (let edgeMask = 0; edgeMask < 64; edgeMask++) {
  const edges = pairs.filter((_, i) => edgeMask & (1 << i));
  for (const g0 of gates) for (const g1 of gates) for (const g2 of gates) {
    const sel = [g0, g1, g2];
    for (let s = 0; s < 8; s++) {
      const nodes = ['A', 'B', 'C'].map((id, i) => ({
        id, label: id, x: 0, y: 0,
        state: Boolean(s & (1 << i)),
        gateType: sel[i],
        inputs: edges.filter((e) => e[1] === id).map((e) => e[0]),
      }));
      const connections = edges.map(([from, to]) => ({ from, to, isCut: false }));
      max = Math.max(max, phiOf({ nodes, connections }));
    }
  }
}
check('Exhaustive 3-element ceiling is 1.75 (as claimed in Ch5 and the gauge)', max === 1.75, `found ${max}`);

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
