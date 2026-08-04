import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Scissors, MousePointerClick, RefreshCw, Play, Pause, Info, PlusCircle } from 'lucide-react';
import { Network, GateType } from '../types';

/** Why the network changed — lets the parent award badges honestly. */
export type ChangeReason = 'toggle' | 'cut' | 'wire' | 'gate' | 'move';

export type Tool = 'interact' | 'scissors' | 'edit-inputs';

interface NetworkVisualizerProps {
  network: Network;
  onChangeNetwork: (newNet: Network, reason: ChangeReason) => void;
  allowEditLogic: boolean;
  allowToggleNodes: boolean;
  allowScissors: boolean;
  allowPulse: boolean;
  onClockTick: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeTool: Tool;
  onChangeActiveTool: (tool: Tool) => void;
}

/**
 * Fixed user-space canvas. The SVG scales to its container via viewBox, so node
 * coordinates stay valid on every screen size — without this, elements placed
 * beyond the rendered width simply vanished on narrow viewports.
 */
const VIEW_W = 600;
const VIEW_H = 340;
const NODE_RADIUS = 30;
const DRAG_THRESHOLD = 4; // px of movement before a click counts as a drag

const GATE_OPTIONS: { value: GateType; hint: string }[] = [
  { value: 'COPY', hint: 'Fires when its input fires' },
  { value: 'NOT', hint: 'Fires only when no input fires' },
  { value: 'AND', hint: 'Fires only when every input fires' },
  { value: 'OR', hint: 'Fires when at least one input fires' },
  { value: 'XOR', hint: 'Fires when an odd number of inputs fire' },
  { value: 'HOLD', hint: 'No mechanism — keeps its state' },
];

export default function NetworkVisualizer({
  network,
  onChangeNetwork,
  allowEditLogic,
  allowToggleNodes,
  allowScissors,
  allowPulse,
  onClockTick,
  isPlaying,
  onTogglePlay,
  activeTool,
  onChangeActiveTool,
}: NetworkVisualizerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredConn, setHoveredConn] = useState<{ from: string; to: string } | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragRef = useRef<{ id: string; dx: number; dy: number; moved: boolean } | null>(null);

  /** Screen pixels → SVG user units. Required once the SVG has a viewBox. */
  const toSvgPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(ctm.inverse());
    return { x: local.x, y: local.y };
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

  const handlePointerDown = (e: React.PointerEvent, nodeId: string) => {
    const node = network.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    const p = toSvgPoint(e.clientX, e.clientY);
    dragRef.current = { id: nodeId, dx: node.x - p.x, dy: node.y - p.y, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    // Tracking the pointer re-renders the stage, so only do it when the wire
    // preview actually needs it.
    const needsPreview = activeTool === 'edit-inputs' && selectedNodeId !== null;
    if (!drag && !needsPreview) return;

    const p = toSvgPoint(e.clientX, e.clientY);
    if (needsPreview) setPointer(p);
    if (!drag) return;

    const nextX = clamp(p.x + drag.dx, NODE_RADIUS + 6, VIEW_W - NODE_RADIUS - 6);
    const nextY = clamp(p.y + drag.dy, NODE_RADIUS + 6, VIEW_H - NODE_RADIUS - 48);

    const node = network.nodes.find((n) => n.id === drag.id);
    if (!node) return;
    if (!drag.moved) {
      if (Math.hypot(nextX - node.x, nextY - node.y) < DRAG_THRESHOLD) return;
      drag.moved = true;
    }

    onChangeNetwork(
      {
        ...network,
        nodes: network.nodes.map((n) => (n.id === drag.id ? { ...n, x: nextX, y: nextY } : n)),
      },
      'move',
    );
  };

  const handlePointerUp = (e: React.PointerEvent, nodeId: string) => {
    const drag = dragRef.current;
    dragRef.current = null;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    // A pointer that never really moved is a click, not a drag.
    if (drag && !drag.moved && drag.id === nodeId) handleNodeActivate(nodeId);
  };

  /** Click semantics depend on the active tool. */
  const handleNodeActivate = (nodeId: string) => {
    if (activeTool === 'interact' && allowToggleNodes) {
      onChangeNetwork(
        {
          ...network,
          nodes: network.nodes.map((n) => (n.id === nodeId ? { ...n, state: !n.state } : n)),
        },
        'toggle',
      );
      return;
    }

    if (activeTool === 'edit-inputs' && allowEditLogic) {
      if (selectedNodeId === null) {
        setSelectedNodeId(nodeId); // first click picks the TARGET
        return;
      }
      if (selectedNodeId !== nodeId) {
        const target = network.nodes.find((n) => n.id === selectedNodeId);
        if (target) {
          const alreadyWired = target.inputs.includes(nodeId);
          const inputs = alreadyWired
            ? target.inputs.filter((id) => id !== nodeId)
            : [...target.inputs, nodeId];

          const connections = alreadyWired
            ? network.connections.filter((c) => !(c.from === nodeId && c.to === selectedNodeId))
            : network.connections.some((c) => c.from === nodeId && c.to === selectedNodeId)
            ? network.connections
            : [...network.connections, { from: nodeId, to: selectedNodeId, isCut: false }];

          onChangeNetwork(
            {
              nodes: network.nodes.map((n) => (n.id === selectedNodeId ? { ...n, inputs } : n)),
              connections,
            },
            'wire',
          );
        }
      }
      setSelectedNodeId(null);
    }
  };

  const handleConnectionClick = (from: string, to: string) => {
    if (activeTool !== 'scissors' || !allowScissors) return;
    onChangeNetwork(
      {
        ...network,
        connections: network.connections.map((c) =>
          c.from === from && c.to === to ? { ...c, isCut: !c.isCut } : c,
        ),
      },
      'cut',
    );
  };

  const handleGateChange = (nodeId: string, newGate: GateType) => {
    onChangeNetwork(
      {
        ...network,
        nodes: network.nodes.map((n) => (n.id === nodeId ? { ...n, gateType: newGate } : n)),
      },
      'gate',
    );
  };

  const selectTool = (tool: Tool) => {
    setSelectedNodeId(null);
    onChangeActiveTool(tool);
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-full">
      {/* Header + toolbar */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${isPlaying ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}
            aria-hidden="true"
          />
          <h3 className="text-sm font-semibold text-slate-200 tracking-tight font-sans">
            Interactive Network Stage
          </h3>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800/80" role="group" aria-label="Tools">
          <button
            onClick={() => selectTool('interact')}
            aria-pressed={activeTool === 'interact'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTool === 'interact'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Toggle elements on and off by clicking them"
          >
            <MousePointerClick className="w-3.5 h-3.5" aria-hidden="true" />
            Trigger Hand
          </button>

          {allowScissors && (
            <button
              onClick={() => selectTool('scissors')}
              aria-pressed={activeTool === 'scissors'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTool === 'scissors'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Cut or restore connections"
            >
              <Scissors className="w-3.5 h-3.5" aria-hidden="true" />
              Scissors
            </button>
          )}

          {allowEditLogic && (
            <button
              onClick={() => selectTool('edit-inputs')}
              aria-pressed={activeTool === 'edit-inputs'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTool === 'edit-inputs'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Add or remove connections between elements"
            >
              <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
              Graph Wire
            </button>
          )}
        </div>
      </div>

      {/* SVG stage */}
      <div className="relative flex-grow bg-slate-950/40 min-h-[350px] overflow-hidden select-none touch-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full"
          style={{ minHeight: '350px' }}
          onPointerMove={handlePointerMove}
          onPointerLeave={() => {
            dragRef.current = null;
            setPointer(null);
          }}
          role="application"
          aria-label="Network of logic elements. Use the toolbar buttons and the gate dropdowns to modify it."
        >
          <defs>
            {(
              [
                ['arrow-head-standard', '#4f46e5'],
                ['arrow-head-cut', '#f43f5e'],
                ['arrow-head-hovered', '#e11d48'],
                ['arrow-head-wiring', '#fbbf24'],
              ] as const
            ).map(([id, fill]) => (
              <marker
                key={id}
                id={id}
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill={fill} />
              </marker>
            ))}

            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5" />
            </pattern>
          </defs>

          <rect
            width={VIEW_W}
            height={VIEW_H}
            fill="url(#grid)"
            className="opacity-10 pointer-events-none"
          />

          {/* CONNECTIONS */}
          {network.connections.map((conn, index) => {
            const fromNode = network.nodes.find((n) => n.id === conn.from);
            const toNode = network.nodes.find((n) => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) return null;

            const ux = dx / dist;
            const uy = dy / dist;

            const x1 = fromNode.x + ux * NODE_RADIUS;
            const y1 = fromNode.y + uy * NODE_RADIUS;
            const x2 = toNode.x - ux * (NODE_RADIUS + 7);
            const y2 = toNode.y - uy * (NODE_RADIUS + 7);

            const isHovered = hoveredConn?.from === conn.from && hoveredConn?.to === conn.to;
            const isCutMode = activeTool === 'scissors';

            // Reciprocal pairs get bowed apart so both arrows stay visible.
            const isMutual = network.connections.some(
              (c) => c.from === conn.to && c.to === conn.from,
            );

            const cx = (x1 + x2) / 2 - uy * 22;
            const cy = (y1 + y2) / 2 + ux * 22;
            const pathD = isMutual
              ? `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`
              : `M ${x1} ${y1} L ${x2} ${y2}`;

            // Midpoint of the quadratic Bézier at t = 0.5.
            const mx = isMutual ? (x1 + 2 * cx + x2) / 4 : (x1 + x2) / 2;
            const my = isMutual ? (y1 + 2 * cy + y2) / 4 : (y1 + y2) / 2;

            let strokeColor = '#4f46e5';
            let strokeDash = '';
            let markerHead = 'url(#arrow-head-standard)';

            if (conn.isCut) {
              strokeColor = '#f43f5e';
              strokeDash = '6,4';
              markerHead = 'url(#arrow-head-cut)';
            } else if (isHovered && isCutMode) {
              strokeColor = '#e11d48';
              markerHead = 'url(#arrow-head-hovered)';
            } else if (activeTool === 'edit-inputs') {
              strokeColor = '#fbbf24';
              markerHead = 'url(#arrow-head-wiring)';
            }

            return (
              <g
                key={`${conn.from}-${conn.to}-${index}`}
                className={isCutMode ? 'cursor-pointer' : ''}
                onMouseEnter={() => setHoveredConn({ from: conn.from, to: conn.to })}
                onMouseLeave={() => setHoveredConn(null)}
                onClick={() => handleConnectionClick(conn.from, conn.to)}
              >
                <title>
                  {conn.from} → {conn.to}
                  {conn.isCut ? ' (cut)' : ''}
                </title>

                {/* Fat invisible hit area */}
                <path d={pathD} fill="none" stroke="transparent" strokeWidth="20" />

                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 4 : 2}
                  strokeDasharray={strokeDash}
                  markerEnd={markerHead}
                  className="transition-all duration-200"
                />

                {/*
                  Signal pulse — only when the wire is live and the source is firing.
                  Driven by SMIL so the dot follows the *actual* path (including the
                  bowed reciprocal curves) instead of an approximation of it.
                */}
                {!conn.isCut && fromNode.state && (
                  <circle r={4.5} cx={0} cy={0} fill="#fbbf24" className="pointer-events-none">
                    <animateMotion
                      dur={isMutual ? '1.8s' : '1.6s'}
                      repeatCount="indefinite"
                      path={pathD}
                      rotate="0"
                    />
                  </circle>
                )}

                {isHovered && isCutMode && (
                  <g transform={`translate(${mx}, ${my})`} className="pointer-events-none">
                    <circle r="11" fill={conn.isCut ? '#10b981' : '#f43f5e'} />
                    <text
                      textAnchor="middle"
                      y="4"
                      className="text-[11px] font-bold"
                      fill="#ffffff"
                    >
                      {conn.isCut ? '↺' : '✂'}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Live preview wire while choosing a source */}
          {activeTool === 'edit-inputs' &&
            selectedNodeId &&
            pointer &&
            (() => {
              const target = network.nodes.find((n) => n.id === selectedNodeId);
              if (!target) return null;
              return (
                <line
                  x1={pointer.x}
                  y1={pointer.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#fbbf24"
                  strokeWidth="2"
                  strokeDasharray="4,4"
                  markerEnd="url(#arrow-head-wiring)"
                  className="pointer-events-none"
                />
              );
            })()}

          {/* NODES */}
          {network.nodes.map((node) => {
            const isWiringTarget = selectedNodeId === node.id;

            return (
              <g key={node.id}>
                {/* Aura */}
                {node.state && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 10}
                    className="fill-indigo-500/10 stroke-indigo-500/20 stroke-2 pointer-events-none"
                  />
                )}

                {node.state && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS - 6}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.35, 0.7, 0.35] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="fill-indigo-500/25 pointer-events-none"
                  />
                )}

                {/* Body — also the drag handle and the click target */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  onPointerDown={(e) => handlePointerDown(e, node.id)}
                  onPointerUp={(e) => handlePointerUp(e, node.id)}
                  className={`transition-colors duration-300 stroke-2 cursor-grab active:cursor-grabbing ${
                    node.state
                      ? 'fill-indigo-900/90 stroke-indigo-400'
                      : 'fill-slate-900/95 stroke-slate-600'
                  } ${isWiringTarget ? 'stroke-amber-400' : ''}`}
                >
                  <title>
                    {node.label} — {node.gateType}, currently {node.state ? 'ON' : 'OFF'}
                  </title>
                </circle>

                {/* Lightning bolt glyph (drawn inline so it scales with the viewBox) */}
                <g transform={`translate(${node.x - 8}, ${node.y - 20}) scale(0.62)`} className="pointer-events-none">
                  <path
                    d="M13 2 L4.5 14 H11 L9 22 L19.5 10 H13 Z"
                    fill={node.state ? '#facc15' : '#475569'}
                    stroke={node.state ? '#fde68a' : 'none'}
                    strokeWidth="0.8"
                  />
                </g>

                <text
                  x={node.x}
                  y={node.y + 15}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-slate-300 pointer-events-none tracking-tight font-sans"
                >
                  {node.label}
                </text>

                {/* Gate tag / selector */}
                {allowEditLogic ? (
                  <foreignObject x={node.x - 27} y={node.y + 32} width="54" height="26">
                    <select
                      value={node.gateType === 'ON' ? 'HOLD' : node.gateType}
                      onChange={(e) => handleGateChange(node.id, e.target.value as GateType)}
                      aria-label={`Logic gate for ${node.label}`}
                      className={`w-full text-center text-[10px] font-extrabold rounded px-1 py-0.5 bg-slate-800 border cursor-pointer font-mono ${
                        node.state ? 'text-indigo-300 border-indigo-500' : 'text-slate-400 border-slate-700'
                      }`}
                    >
                      {GATE_OPTIONS.map((g) => (
                        <option key={g.value} value={g.value} title={g.hint}>
                          {g.value}
                        </option>
                      ))}
                    </select>
                  </foreignObject>
                ) : (
                  <text
                    x={node.x}
                    y={node.y + 46}
                    textAnchor="middle"
                    className="text-[9px] font-extrabold fill-indigo-400/90 font-mono uppercase tracking-wider pointer-events-none"
                  >
                    {node.gateType === 'ON' ? 'HOLD' : node.gateType}
                  </text>
                )}

                {isWiringTarget && (
                  <text
                    x={node.x}
                    y={node.y - 42}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-amber-400 font-mono tracking-wider"
                  >
                    NOW PICK ITS SOURCE
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Contextual hint */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex justify-center">
          <div className="bg-slate-900/95 border border-slate-800/80 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 max-w-sm backdrop-blur-sm">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
            <p className="text-[11px] font-medium text-slate-300 leading-tight font-sans">
              {activeTool === 'interact' && '👉 Click an element to toggle it, or drag it to reposition.'}
              {activeTool === 'scissors' && '✂️ Click an arrow to cut it — click again to restore it.'}
              {activeTool === 'edit-inputs' && '🔗 Click the receiving element first, then click the one that should feed it.'}
            </p>
          </div>
        </div>
      </div>

      {/* Clock */}
      {allowPulse && (
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            System Clock
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClockTick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700/80 rounded-xl text-xs font-bold transition-all border border-slate-700/80"
              title="Advance the network by one tick"
            >
              <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
              Tick Clock
            </button>

            <button
              onClick={onTogglePlay}
              aria-pressed={isPlaying}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
                  Auto Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" aria-hidden="true" />
                  Auto Run
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
