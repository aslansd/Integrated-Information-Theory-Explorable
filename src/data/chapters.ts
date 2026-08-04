import { Chapter } from '../types';

export const chapters: Chapter[] = [
  {
    id: 1,
    title: '📷 1. Camera vs. Eye',
    subtitle: 'Information Without Integration',
    narrative: [
      'Look at your screen. You see colours, shapes, a glowing layout — a single, unified visual experience. You cannot see the left half of it *separately* from the right half. It arrives whole.',
      'Now think of a digital camera sensor: millions of tiny photodiodes, each turning ON or OFF depending on the light hitting it. In the Shannon sense that is an *enormous* amount of information — far more than you can report about what you see.',
      'So does the camera experience anything? In Integrated Information Theory (IIT), the answer is no.',
      'Why? Because each photodiode is informationally isolated. Pixel A does not care what Pixel B is doing. Slice the sensor in half and the left side behaves exactly as before — it never notices the right half is gone. The million-pixel sensor is really a million separate one-bit systems that happen to sit in the same housing.',
      'That is Giulio Tononi\'s original thought experiment, and the point it makes is precise: **information alone is not enough**. This sensor has plenty of information and **zero integration, so Φ = 0**.'
    ],
    actionPrompt: 'Toggle the three isolated "pixels" (A, B, C) by clicking them. Notice that clicking one has absolutely no effect on the others. With no connections between them there is nothing to integrate, so Φ is stuck at 0 no matter which pattern you make.',
    realityCheck:
      'Φ measures integration, not richness. A system can carry a huge amount of information and still have Φ = 0 — and, as you will see in Chapter 6, whether Φ really tracks consciousness is exactly what the field is still arguing about.',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Pixel A', x: 150, y: 150, state: false, gateType: 'HOLD', inputs: [] },
        { id: 'B', label: 'Pixel B', x: 300, y: 150, state: false, gateType: 'HOLD', inputs: [] },
        { id: 'C', label: 'Pixel C', x: 450, y: 150, state: false, gateType: 'HOLD', inputs: [] }
      ],
      connections: []
    },
    allowEditLogic: false,
    allowToggleNodes: true,
    allowScissors: false,
    allowPulse: false,
    showPhiCalculations: false,
    quiz: {
      question: 'According to IIT, why does a digital camera sensor have Φ = 0?',
      options: [
        'It does not have enough total pixels.',
        'Its pixels respond independently, with no causal interaction or feedback between them.',
        'It is made of silicon instead of biological cells.',
        'It cannot store its images permanently.'
      ],
      correctIndex: 1,
      explanation:
        'Right. IIT requires integration: the whole must specify more than its parts do separately. Because the pixels never influence one another, the sensor is an aggregate of independent parts, not a unified whole. Note that the material is irrelevant to IIT — what matters is the causal structure.'
    }
  },
  {
    id: 2,
    title: '🪰 2. The Firefly Loop',
    subtitle: 'Feedback & Cause–Effect Power',
    narrative: [
      'To build a unified whole, the parts have to talk to each other — and, crucially, listen back.',
      'Meet two fireflies (or neurons) called **Alice** and **Bob**. Each has one rule: copy whatever the other one did on the previous tick.',
      'If Alice glows, Bob glows next tick. If Bob glows, Alice glows next tick. Their pasts and futures are now entangled: knowing Alice\'s state tells you something about Bob\'s, and vice versa.',
      'That is a **feedback loop** — the simplest integrated system there is. The pair constrains its own past and its own future, which is exactly what IIT means by *cause–effect power over itself*.',
      'Now cut the wire from Bob to Alice. Bob still copies Alice, so information still flows — but only one way. Alice\'s next state is no longer caused by anything inside the system. What remains is a **feedforward** chain, and IIT assigns feedforward systems Φ = 0 however busy they look.'
    ],
    actionPrompt: 'Click Alice to toggle her ON, then press "Tick Clock" (or "Auto Run") and watch the glow bounce between them. Then pick up the SCISSORS and click one of the arrows. Watch Φ collapse to 0 — and read the explanation the gauge panel gives you.',
    realityCheck:
      'Two copycat fireflies score above zero here, but nobody claims they are having an experience. Φ > 0 in a toy network is a statement about causal structure, not a discovery of a tiny mind.',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Alice', x: 220, y: 150, state: true, gateType: 'COPY', inputs: ['B'] },
        { id: 'B', label: 'Bob', x: 380, y: 150, state: false, gateType: 'COPY', inputs: ['A'] }
      ],
      connections: [
        { from: 'A', to: 'B', isCut: false },
        { from: 'B', to: 'A', isCut: false }
      ]
    },
    allowEditLogic: false,
    allowToggleNodes: true,
    allowScissors: true,
    allowPulse: true,
    showPhiCalculations: true,
    quiz: {
      question: 'You cut one of the two arrows in the firefly loop. What happens, and why?',
      options: [
        'Nothing changes — copying still works in both directions.',
        'The remaining link carries twice as much information, so Φ doubles.',
        'The loop becomes a one-way feedforward chain, so the system can be split without loss and Φ drops to 0.',
        'The fireflies re-establish the link automatically on the next tick.'
      ],
      correctIndex: 2,
      explanation:
        'Exactly. Signals still flow along the surviving wire, but nothing comes back. A feedforward system does not constrain its own past, so it can be decomposed into independent parts without losing anything — and Φ goes to zero.'
    }
  },
  {
    id: 3,
    title: '🧠 3. The Logic of Thought',
    subtitle: 'Why Copycatting Is Not Enough',
    narrative: [
      'If a simple feedback loop already gives integration, why aren\'t two blinking fireflies as conscious as you are?',
      'Because of **differentiation**. Your experience is not just "on" or "off": it is one specific state selected out of an astronomically large repertoire of colours, sounds, smells, moods and memories. Every experience rules out a vast number of alternatives, and that is what makes it informative.',
      'A pure copycat network is poor at this. Its elements do not *discriminate* between different input patterns — each one just echoes what it was handed. The pattern shuttles around the loop unchanged, so the system specifies very little about which of its possible pasts actually happened.',
      'Real neurons behave more like selective filters: **"fire only if A is ON and B is OFF"**. That kind of mechanism rules out many possible pasts at once, which is precisely what a large cause–effect repertoire requires.',
      'Mixing gate types — **AND**, **OR**, **XOR**, **NOT** — gives the network mechanisms that each carve up the state space differently. Integration keeps it one system; differentiation gives that system something to say.'
    ],
    actionPrompt: 'Run the clock in Auto mode, then change the gate on each neuron with the dropdown under it. Watch how AND makes the network fall quiet, how NOT keeps it churning, and how the Φ reading responds. Try to find a combination that beats the preset.',
    realityCheck:
      'Careful with the intuition "more complicated gate = more Φ". In IIT, XOR-heavy networks are often *less* irreducible than they look, because their elements can be reshuffled without changing much. The number on the gauge is the arbiter here, not the vibe of the gate.',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Neuron A', x: 180, y: 100, state: true, gateType: 'XOR', inputs: ['B', 'C'] },
        { id: 'B', label: 'Neuron B', x: 420, y: 100, state: false, gateType: 'OR', inputs: ['A'] },
        { id: 'C', label: 'Neuron C', x: 300, y: 220, state: true, gateType: 'NOT', inputs: ['B'] }
      ],
      connections: [
        { from: 'B', to: 'A', isCut: false },
        { from: 'C', to: 'A', isCut: false },
        { from: 'A', to: 'B', isCut: false },
        { from: 'B', to: 'C', isCut: false }
      ]
    },
    allowEditLogic: true,
    allowToggleNodes: true,
    allowScissors: true,
    allowPulse: true,
    showPhiCalculations: true,
    quiz: {
      question: 'What does DIFFERENTIATION add that integration alone does not?',
      options: [
        'It keeps the network from overheating.',
        'It guarantees the network has feedback loops.',
        'It gives the system a large repertoire of distinguishable states, so each state rules out many alternatives.',
        'It reduces the number of connections needed.'
      ],
      correctIndex: 2,
      explanation:
        'Correct. IIT needs both: integration means the system cannot be split into independent parts, differentiation means it has many distinguishable states to be in. A big undifferentiated blob and a rich pile of disconnected parts both fail.'
    }
  },
  {
    id: 4,
    title: '✂️ 4. Finding the Weakest Seam',
    subtitle: 'Partitions, the MIP, and Φ',
    narrative: [
      '"The whole is more than the sum of its parts" is a slogan. IIT turns it into a measurement — by playing devil\'s advocate against the system.',
      'We take the elements and split them into two groups. Every wire crossing that boundary is replaced with noise, and we ask: how much worse is the system now at specifying its own next state? That drop is the **loss** for that split.',
      'A split through a genuine bottleneck destroys a lot. A split through a seam that barely carried anything destroys almost nothing. So we try **every possible way of dividing the elements into two groups** — for three elements that is three distinct splits, listed live in the panel.',
      'The cheapest split — the one the system barely notices — is the **Minimum Information Partition (MIP)**. It is the seam along which the system is *least* one thing.',
      'Because a lopsided 1-vs-2 split severs fewer wires than an even one, the candidates are ranked by loss **divided by the size of the smaller side**. That is the normalisation IIT uses so that big and small cuts compete fairly.',
      '**Φ is the loss at that winning seam.** If the system falls apart cleanly somewhere, it was never really a whole — and Φ is 0. A high Φ means there is no cheap way to cut it at all.'
    ],
    actionPrompt: 'Watch the partition list. Each row is one way of dividing the three elements, with its raw loss and its normalised score; the 🏆 marks the current MIP. Toggle states and snip wires and watch which seam becomes the weakest one.',
    realityCheck:
      'This app measures Φ for the whole network you drew. Real IIT also applies the **exclusion** postulate: it searches every subset of elements and every timescale, and only the single most irreducible subset — the "complex" — gets to exist as an experience. That search grows super-exponentially, which is why exact Φ has only ever been computed for systems of a handful of elements.',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Node A', x: 200, y: 100, state: true, gateType: 'COPY', inputs: ['C'] },
        { id: 'B', label: 'Node B', x: 400, y: 100, state: false, gateType: 'COPY', inputs: ['A'] },
        { id: 'C', label: 'Node C', x: 300, y: 220, state: true, gateType: 'COPY', inputs: ['B'] }
      ],
      connections: [
        { from: 'C', to: 'A', isCut: false },
        { from: 'A', to: 'B', isCut: false },
        { from: 'B', to: 'C', isCut: false }
      ]
    },
    allowEditLogic: true,
    allowToggleNodes: true,
    allowScissors: true,
    allowPulse: true,
    showPhiCalculations: true,
    quiz: {
      question: 'Why does IIT take the MINIMUM information partition rather than the maximum?',
      options: [
        'Because the maximum cut would damage too many nodes.',
        'Because a system is only as unified as its weakest seam — if any split is nearly free, it was really two systems.',
        'Because minima are easier to compute than maxima.',
        'It is an arbitrary convention with no motivation.'
      ],
      correctIndex: 1,
      explanation:
        'Right. Integration is a claim about *every* way of dividing the system. One cheap seam is enough to show the system is reducible, so Φ is pinned to the smallest loss, not the largest.'
    }
  },
  {
    id: 5,
    title: '🧪 5. The Consciousness Sandbox',
    subtitle: 'Design, Simulate, Optimise',
    narrative: [
      'Welcome to the laboratory. Everything is unlocked.',
      'You now know the two ingredients: **differentiation** (elements with mechanisms that discriminate) and **integration** (recurrent wiring with no cheap seam to cut along).',
      'Wire the nodes however you like, swap their gates, cut and restore connections, and step or run the clock. The gauge recomputes Φ from scratch on every change.',
      'For a three-element network with these gates, the highest Φ this app can produce is **1.75**. Getting there needs every wire in place and a very particular choice of mechanism — a hint: think about which gate makes a node *disagree* with everything feeding it.',
      'Can you unlock the **✨ Spark** badge by reaching Φ ≥ 1.5? Only about one in a thousand random configurations manages it.'
    ],
    actionPrompt: 'Experiment freely. Use Graph Wire to add or remove connections (click the target neuron first, then its source), swap gates, cut links with the scissors, and hunt for the maximum Φ.',
    realityCheck:
      'The Φ on this gauge is a teaching model, not the real quantity. Real IIT compares whole probability distributions over past and future states with an earth-mover\'s distance, over every subset of elements. This app compares expected activations across whole-system bipartitions — the same logic, drastically cheaper, and the numbers are not comparable to published Φ values.',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Neuron A', x: 200, y: 100, state: true, gateType: 'COPY', inputs: ['C'] },
        { id: 'B', label: 'Neuron B', x: 400, y: 100, state: false, gateType: 'XOR', inputs: ['A', 'C'] },
        { id: 'C', label: 'Neuron C', x: 300, y: 220, state: true, gateType: 'NOT', inputs: ['B'] }
      ],
      connections: [
        { from: 'C', to: 'A', isCut: false },
        { from: 'A', to: 'B', isCut: false },
        { from: 'B', to: 'C', isCut: false },
        { from: 'C', to: 'B', isCut: false }
      ]
    },
    allowEditLogic: true,
    allowToggleNodes: true,
    allowScissors: true,
    allowPulse: true,
    showPhiCalculations: true,
    quiz: {
      question: 'Two networks have identical wiring. One is all COPY gates, the other mixes NOT and AND. What can you conclude?',
      options: [
        'They must have the same Φ, because Φ only depends on the wiring diagram.',
        'The mixed network always has higher Φ.',
        'Φ depends on the mechanisms and the current state as well as the wiring, so you have to compute it.',
        'Φ cannot be defined unless every gate is the same type.'
      ],
      correctIndex: 2,
      explanation:
        'Correct — and this is a genuinely important point. Φ is not a property of the connectivity graph alone. The same diagram can be highly irreducible or completely reducible depending on what the elements compute and which state they are currently in.'
    }
  },
  {
    id: 6,
    title: '⚖️ 6. Where the Science Actually Stands',
    subtitle: 'Honest Caveats & Open Arguments',
    narrative: [
      'You have just spent five chapters inside one theory. Here is the part that explorables usually skip: IIT is **contested**, and you should know how.',
      'The **panpsychism problem.** Because Φ is defined purely by causal structure, anything with the right structure gets a non-zero Φ — a grid of simple circuits, in principle a large enough thermostat network. Supporters call that a bold prediction. Critics call it a reductio.',
      'The **falsifiability problem.** In September 2023 an open letter signed by 124 researchers labelled IIT "pseudoscience", arguing that its headline claims had never been properly tested. Prominent researchers including Anil Seth pushed back hard on the label, and a later survey found only a small minority of the field fully endorsed it. The fight itself is a useful signal: this is a live scientific dispute, not settled knowledge.',
      'The **evidence.** In 2025 the Cogitate Consortium published the first large pre-registered adversarial test in Nature, pitting IIT against Global Neuronal Workspace Theory across 256 participants with fMRI, MEG and intracranial EEG. Neither theory came through with its predictions fully intact: IIT was challenged by the absence of the sustained posterior synchronisation it predicted, while GNWT was challenged by missing prefrontal "ignition". Both camps are still arguing about what the results mean.',
      'The **computation problem.** Exact Φ requires searching all subsets, all partitions and all timescales. It is intractable beyond a handful of elements, so every claim about the Φ of a brain rests on an approximation — as does the gauge you have been playing with.',
      'None of this means the ideas you just explored are worthless. Integration, differentiation and irreducibility are genuinely useful concepts, and IIT-inspired measures such as the Perturbational Complexity Index are already used clinically to detect awareness in unresponsive patients. Hold the framework the way a scientist should: as a serious, precise, testable and still-unproven proposal.'
    ],
    actionPrompt: 'The sandbox is still live — keep experimenting. But now read the gauge for what it is: a number describing the causal structure of six lights and some wires, not a consciousness detector.',
    realityCheck:
      'Sources for this chapter: Tononi (2004, 2008); Oizumi, Albantakis & Tononi, PLoS Comp Biol (2014); Albantakis et al., IIT 4.0, PLoS Comp Biol (2023); Fleming et al., PsyArXiv (2023); Cogitate Consortium, Nature 642:133–142 (2025).',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Neuron A', x: 200, y: 100, state: false, gateType: 'NOT', inputs: ['B', 'C'] },
        { id: 'B', label: 'Neuron B', x: 400, y: 100, state: false, gateType: 'NOT', inputs: ['A', 'C'] },
        { id: 'C', label: 'Neuron C', x: 300, y: 220, state: false, gateType: 'NOT', inputs: ['A', 'B'] }
      ],
      connections: [
        { from: 'A', to: 'B', isCut: false },
        { from: 'B', to: 'A', isCut: false },
        { from: 'A', to: 'C', isCut: false },
        { from: 'C', to: 'A', isCut: false },
        { from: 'B', to: 'C', isCut: false },
        { from: 'C', to: 'B', isCut: false }
      ]
    },
    allowEditLogic: true,
    allowToggleNodes: true,
    allowScissors: true,
    allowPulse: true,
    showPhiCalculations: true,
    quiz: {
      question: 'What is the most defensible thing to say about IIT after finishing this explorable?',
      options: [
        'IIT is the proven scientific explanation of consciousness.',
        'IIT has been definitively refuted and should be discarded.',
        'IIT is a precise, ambitious and genuinely testable proposal whose central claims remain unresolved and actively disputed.',
        'Consciousness cannot be studied scientifically at all.'
      ],
      correctIndex: 2,
      explanation:
        'Yes. IIT is unusual among theories of consciousness in being mathematically explicit enough to generate falsifiable predictions — and those predictions are now being tested, with mixed results. Precision is a virtue; it is not the same thing as being correct.'
    }
  }
];
