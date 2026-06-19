import { Chapter } from '../types';

export const chapters: Chapter[] = [
  {
    id: 1,
    title: '🍕 1. Eye vs. Camera',
    subtitle: 'Understanding Information & Separation',
    narrative: [
      'Look at your screen. You see colors, shapes, a glowing layout. You are having a rich, unified visual experience.',
      'Now think of a digital camera sensor. It is made of millions of tiny photosensitive pixels. If you capture an image, each pixel turns ON or OFF depending on the light hitting it. That’s a massive amount of information!',
      'But does the camera "experience" anything? In Integrated Information Theory (IIT), the answer is a flat NO.',
      'Why? Because each pixel on the sensor is completely isolated. Pixel A doesn\'t care what Pixel B is doing. There is no cooperation, no sharing, and no integration. If you cut the camera sensor in half, the left side keeps working exactly as before—it doesn\'t miss its right half.',
      'Hence, it has **Information**, but **Zero Integration ($\Phi = 0$)**.'
    ],
    actionPrompt: 'Toggle the three isolated "pixels" below (A, B, C) by clicking them. Notice that clicking one has absolutely no effect on the others. They have no connections, so their Integration Score (Φ) is stuck at 0!',
    networkPreset: {
      nodes: [
        { id: 'A', label: 'Pixel A', x: 150, y: 150, state: false, gateType: 'ON', inputs: [] },
        { id: 'B', label: 'Pixel B', x: 300, y: 150, state: false, gateType: 'ON', inputs: [] },
        { id: 'C', label: 'Pixel C', x: 450, y: 150, state: false, gateType: 'ON', inputs: [] }
      ],
      connections: []
    },
    allowEditLogic: false,
    allowToggleNodes: true,
    allowScissors: false,
    allowPulse: false,
    showPhiCalculations: false,
    quiz: {
      question: 'Which of the following describes why a digital camera sensor has zero Φ (Phi) consciousness?',
      options: [
        'It does not have enough total pixels.',
        'The pixels operate in parallel with zero communication or feedback loops between them.',
        'It is made of silicon instead of biological cells.',
        'It requires batteries to work.'
      ],
      correctIndex: 1,
      explanation: 'Exactly! IIT states that consciousness requires integration. Because the pixels do not interact or depend on each other, they are a mere aggregate of independent parts, not a unified whole.'
    }
  },
  {
    id: 2,
    title: '🪰 2. The Firefly Loop',
    subtitle: 'Feedback & Cause-Effect Power',
    narrative: [
      'To build a unified "whole," we need the parts to talk to each other.',
      'Imagine two glowing fireflies (or neurons) named **Alice** and **Bob**. They have a simple rule: they always copycat whatever the other did on the previous second.',
      'If Alice is ON (glowing), Bob sees it and turns ON in the next second. If Bob is ON, Alice turns ON next.',
      'Because they feedback into each other, their futures and pasts are intertwined! They have formed a **feedback loop**—the simplest integrated system.',
      'Together, they rule out alternative outcomes. If we cut the connection from Bob to Alice, Bob can still copy Alice, but Alice no longer listens. The loop is broken, the integration crumbles, and the unified experience vanishes.'
    ],
    actionPrompt: 'Click on Alice (A) to toggle her state on. Then click "Tick Clock" (or "Auto Run") to watch the signal bounce back and forth between them! Now select the SCISSORS tool and click on a connection arrow to cut the feedback. Watch the Integration Score (Φ) plummet to zero!',
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
      question: 'What happens to the Firefly system when you cut one of the connection lines?',
      options: [
        'The fireflies both immediately explode.',
        'The copycat behavior continues perfectly in both directions.',
        'The feedback loop is broken, preventing mutual integration and dropping Φ to 0.',
        'The system automatically reconnects using wireless bluetooth.'
      ],
      correctIndex: 2,
      explanation: 'Spot on! Cutting even one direction of the loop stops information from circulating. The system can no longer act as a unified whole, meaning its integration collapses.'
    }
  },
  {
    id: 3,
    title: '🧠 3. The Logic of Thought',
    subtitle: 'Why "Copycatting" is Not Enough',
    narrative: [
      'Wait... if a simple feedback loop gives us integration, why aren\'t simple oscillating fireflies as conscious as a human?',
      'Because of **differentiation**. A conscious mind doesn’t just experience "flashing" or "not flashing." It can experience colors, sounds, emotions, memories—billions of distinct combinations.',
      'If a network only "copycats", it can only express two states: all ON or all OFF. That\'s extremely boring!',
      'To build complex consciousness, our neurons must act as diverse logical filters. They must calculate: **"If Node A is ON and Node B is OFF, then fire!"**',
      'By combining different gate types like **AND**, **OR**, **XOR**, and **NOT**, our network can create complex, rich oscillations and pathways, representing unique states of awareness.'
    ],
    actionPrompt: 'We have built a 3-neuron network. Try running the clock in Auto mode. Now, change the logical gates (AND, OR, XOR, NOT) of each node using the dropdown selector beneath the node list or clicking the gate node. Observe how complex the patterns become!',
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
      question: 'What is the role of DIFFERENTIATED logic gates (AND, OR, XOR, NOT) in consciousness?',
      options: [
        'They keep the brain cool.',
        'They limit the amount of electricity you use.',
        'They allow the system to have a rich repertoire of distinct, unique mental states.',
        'They prevent the network from having feedback.'
      ],
      correctIndex: 2,
      explanation: 'Exactly! High consciousness requires both high integration (staying unified) and high differentiation (having a vast catalog of possible thoughts, visuals, and experiences).'
    }
  },
  {
    id: 4,
    title: '✂️ 4. What is the Partition?',
    subtitle: 'Measuring the "Weakest Link" (Φ)',
    narrative: [
      'We know integrated information means "the whole is more than the sum of its parts."',
      'But how do we put an exact number on it? In IIT, we do this by **playing devil\'s advocate**.',
      'We examine every possible way to slice the system into isolated pieces. This is called **partitioning**.',
      'For each slice, we calculate how much information prediction power is lost. If we slice at a crucial bottleneck, we lose a lot of information. If we slice at an unimportant or non-existent connection, we lose very little.',
      'The partition that causes the **absolute minimum information loss** is called the **Minimum Information Partition (MIP)**. It represents the "weakest link" of the system.',
      'The value of **Φ (Phi)** is simply the information loss at this weakest link! If the weakest link is already disconnected (like the camera), Φ is exactly 0.'
    ],
    actionPrompt: 'Observe the list of possible partitioning cuts in the panel below. Play with the node states and scissor cuts to see how the Minimum Information Partition changes in real time. We highlight the custom slice that corresponds to the MIP!',
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
      question: 'Why does IIT locate the Minimum Information Partition (MIP) instead of the maximum?',
      options: [
        'Because the maximum cut would break too many nodes.',
        'Because the MIP represents the weakest link; a system is only as conscious as its weakest integration point.',
        'Because calculating minimums is easier for computers.',
        'It is just an artistic choice by neuroscientists.'
      ],
      correctIndex: 1,
      explanation: 'Wonderful! In IIT, consciousness is a unified whole. If a system can be divided along a weak boundary with almost zero loss, it is functionally two separate things, not one. We find the weakest link to verify true unity.'
    }
  },
  {
    id: 5,
    title: '🧪 5. The Consciousness Sandbox',
    subtitle: 'Design, Simulate, and Optimize',
    narrative: [
      'Welcome to the ultimate Integrated Information laboratory!',
      'You are now equipped with all the secrets of Integrated Information Theory. You know that consciousness requires **information** (diverse logic configurations) AND **integration** (reciprocal feedback lines, strongly connected elements).',
      'Now you can put it all together to construct the highest-Phi mind possible.',
      'Use the controls to configure your network. Turn connections on and off, adjust logical gates, step through clock cycles, and find complex feedback dynamics.',
      'Can you unlock the **Golden Spark** achievement by getting a system Φ index of 1.0 or higher? Let\'s find out!'
    ],
    actionPrompt: 'Experiment freely! Customize the inputs of any node, toggle their gates (AND, OR, XOR, NOT, COPY), click connections to cut or restore them, and try to maximize your overall Φ (Phi) score in real time!',
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
    showPhiCalculations: true
  }
];
