# Consciousness Lab — an explorable explanation of Integrated Information Theory

An interactive digital laboratory for exploring how Integrated Information Theory (IIT)
measures the "wholeness" of a system, built in the active-learning spirit of
[Nicky Case's explorables](https://ncase.me/).

Six chapters, each pairing a short narrative with a live network you can poke:

| # | Chapter | Idea |
|---|---------|------|
| 1 | Camera vs. Eye | Information without integration (Φ = 0) |
| 2 | The Firefly Loop | Feedback and cause–effect power |
| 3 | The Logic of Thought | Differentiation, and why copying isn't enough |
| 4 | Finding the Weakest Seam | Partitions, the MIP, and how Φ is computed |
| 5 | The Consciousness Sandbox | Build and optimise your own network |
| 6 | Where the Science Actually Stands | Honest caveats and the open arguments |

## Running it

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | `tsc --noEmit` in strict mode |
| `npm run verify` | Invariant checks on the Φ engine (see below) |

## How the Φ number is computed

`src/lib/phi.ts` is deliberately small and readable so every number on screen can be
re-derived by hand.

1. **Predict.** For each element, compute its expected next-state value from its gate
   and its live inputs.
2. **Partition.** Enumerate every unordered bipartition of the elements — 2^(n−1)−1 of
   them — and replace every wire crossing the boundary with maximum-entropy noise (0.5).
3. **Measure.** Loss for a partition is the summed absolute change in every element's
   prediction.
4. **Minimise.** Candidates are ranked by `loss ÷ size of the smaller side` (the
   normalisation IIT 3.0 uses so that lopsided cuts don't win by default). The cheapest
   is the **Minimum Information Partition**, and **Φ is its raw loss**.
5. **Structural zeros.** Φ is pinned to 0 when the cheapest partition severs nothing, or
   when the network is strictly feedforward — feedforward systems are reducible in IIT
   regardless of how much information they carry.

Note the deliberate asymmetry: a cut wire delivers **0** while the clock is running
(a severed connection carries no signal), but **0.5** when Φ is being measured
(partitioning means substituting noise, not silence).

### What this is not

This is a teaching model, not real Φ:

- Real IIT compares whole probability *distributions* over past and future states with an
  earth-mover's distance. This compares expected activations with an L1 distance.
- Real IIT applies the **exclusion** postulate: it searches every subset of elements at
  every timescale, and only the maximally irreducible subset — the *complex* — counts.
  This always evaluates the whole network you drew.

Numbers here are not comparable to published Φ values. Chapter 6 says so in the app.

The exhaustive ceiling for a three-element network with the available gates is
**Φ = 1.75**, reached by a fully recurrent all-NOT/NOR network in its quiescent state.
`npm run verify` re-derives this by brute force, so the claim can't silently rot.

## Project layout

```
src/
  App.tsx                        chapter shell, quiz, badges, layout
  types.ts                       Network / Chapter / GateType definitions
  lib/phi.ts                     the Φ engine (partition search, gates, clock)
  data/chapters.ts               all narrative, quizzes and network presets
  components/
    NetworkVisualizer.tsx        the interactive SVG stage
    Gauge.tsx                    the radial Φ readout
scripts/verify-phi.ts            invariant checks for the Φ engine
```

All prose lives in `src/data/chapters.ts`. A limited inline markdown subset is supported
(`**bold**`, `*italic*`, `` `code` ``); the text is HTML-escaped before formatting, so
chapter content cannot inject markup.

## Reading

- Tononi, *An information integration theory of consciousness*, BMC Neuroscience (2004)
- Oizumi, Albantakis & Tononi, *From the phenomenology to the mechanisms of consciousness: IIT 3.0*, PLoS Computational Biology (2014)
- Albantakis et al., *Integrated information theory (IIT) 4.0*, PLoS Computational Biology (2023)
- Fleming et al., *The Integrated Information Theory of Consciousness as Pseudoscience*, PsyArXiv (2023)
- Cogitate Consortium, *Adversarial testing of global neuronal workspace and integrated information theories of consciousness*, Nature 642:133–142 (2025)
