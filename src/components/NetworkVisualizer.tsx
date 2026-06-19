import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, MousePointerClick, RefreshCw, Play, Pause, Zap, Info, PlusCircle } from 'lucide-react';
import { Network, NetworkNode, NetworkConnection } from '../types';

interface NetworkVisualizerProps {
  network: Network;
  onChangeNetwork: (newNet: Network) => void;
  allowEditLogic: boolean;
  allowToggleNodes: boolean;
  allowScissors: boolean;
  allowPulse: boolean;
  onClockTick: () => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  activeTool: 'interact' | 'scissors' | 'edit-inputs';
  onChangeActiveTool: (tool: 'interact' | 'scissors' | 'edit-inputs') => void;
}

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
  onChangeActiveTool
}: NetworkVisualizerProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredConn, setHoveredConn] = useState<{ from: string; to: string } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const NODE_RADIUS = 30;

  // Track dragging locally
  const handleDrag = (nodeId: string, info: any) => {
    const updatedNodes = network.nodes.map(n => {
      if (n.id === nodeId) {
        // Simple relative bounding box constraint
        const boundingWidth = svgRef.current?.clientWidth || 600;
        const boundingHeight = svgRef.current?.clientHeight || 350;
        let newX = n.x + info.delta.x;
        let newY = n.y + info.delta.y;

        // Keep inside canvas bounds
        newX = Math.max(NODE_RADIUS + 10, Math.min(newX, boundingWidth - NODE_RADIUS - 10));
        newY = Math.max(NODE_RADIUS + 10, Math.min(newY, boundingHeight - NODE_RADIUS - 10));

        return { ...n, x: newX, y: newY };
      }
      return n;
    });
    onChangeNetwork({ ...network, nodes: updatedNodes });
  };

  // Node Clicking interaction
  const handleNodeClick = (nodeId: string) => {
    if (activeTool === 'interact' && allowToggleNodes) {
      const updatedNodes = network.nodes.map(n => (n.id === nodeId ? { ...n, state: !n.state } : n));
      onChangeNetwork({ ...network, nodes: updatedNodes });
    } else if (activeTool === 'edit-inputs' && allowEditLogic) {
      if (selectedNodeId === null) {
        setSelectedNodeId(nodeId);
      } else {
        if (selectedNodeId !== nodeId) {
          // Toggle input connection from nodeId to selectedNodeId
          const targetNode = network.nodes.find(n => n.id === selectedNodeId);
          if (targetNode) {
            let updatedInputs = [...targetNode.inputs];
            let updatedConnections = [...network.connections];

            if (updatedInputs.includes(nodeId)) {
              // Remove input node
              updatedInputs = updatedInputs.filter(id => id !== nodeId);
              updatedConnections = updatedConnections.filter(c => !(c.from === nodeId && c.to === selectedNodeId));
            } else {
              // Add input node
              updatedInputs.push(nodeId);
              // Add connection if it doesn't exist
              if (!updatedConnections.some(c => c.from === nodeId && c.to === selectedNodeId)) {
                updatedConnections.push({ from: nodeId, to: selectedNodeId, isCut: false });
              }
            }

            const updatedNodes = network.nodes.map(n =>
              n.id === selectedNodeId ? { ...n, inputs: updatedInputs } : n
            );

            onChangeNetwork({ nodes: updatedNodes, connections: updatedConnections });
          }
        }
        setSelectedNodeId(null);
      }
    }
  };

  // Connection Clicking (Scissors tool)
  const handleConnectionClick = (from: string, to: string) => {
    if (activeTool === 'scissors' && allowScissors) {
      const updatedConns = network.connections.map(c =>
        c.from === from && c.to === to ? { ...c, isCut: !c.isCut } : c
      );
      onChangeNetwork({ ...network, connections: updatedConns });
    }
  };

  // Change Logic Gate of a Node
  const handleGateChange = (nodeId: string, newGate: any) => {
    const updatedNodes = network.nodes.map(n => (n.id === nodeId ? { ...n, gateType: newGate } : n));
    // For specific gate requirements, ensure constraints (e.g. NOT needs at most 1 input)
    onChangeNetwork({ ...network, nodes: updatedNodes });
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden h-full">
      {/* Header bar / visual status indicators */}
      <div className="px-5 py-3.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h3 className="text-sm font-semibold text-slate-200 tracking-tight font-sans">
            Interactive Network Stage
          </h3>
        </div>

        {/* Toolbar Selection */}
        <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => {
              setSelectedNodeId(null);
              onChangeActiveTool('interact');
            }}
            id="tool-interact"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
              activeTool === 'interact'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
            title="Fire/Trigger neurons by clicking them"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            Trigger Hand
          </button>

          {allowScissors && (
            <button
              onClick={() => {
                setSelectedNodeId(null);
                onChangeActiveTool('scissors');
              }}
              id="tool-scissors"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTool === 'scissors'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Cut connection lines with scissors"
            >
              <Scissors className="w-3.5 h-3.5" />
              Scissors
            </button>
          )}

          {allowEditLogic && (
            <button
              onClick={() => onChangeActiveTool('edit-inputs')}
              id="tool-links"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                activeTool === 'edit-inputs'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Add or remove connections between nodes"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Graph Wire
            </button>
          )}
        </div>
      </div>

      {/* SVG Interactive Canvas */}
      <div className="relative flex-grow bg-slate-950/40 min-h-[350px] overflow-hidden select-none">
        <svg
          ref={svgRef}
          className="w-full h-full cursor-crosshair"
          style={{ minHeight: '350px' }}
        >
          {/* Arrowhead markers inside SVG definitions */}
          <defs>
            <marker
              id="arrow-head-standard"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#4f46e5" />
            </marker>
            <marker
              id="arrow-head-cut"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f43f5e" />
            </marker>
            <marker
              id="arrow-head-hovered"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#e11d48" />
            </marker>
            <marker
              id="arrow-head-wiring"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#fbbf24" />
            </marker>
          </defs>

          {/* BACKGROUND GRID GRAPHS */}
          <g className="opacity-10 pointer-events-none">
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <rect width="20" height="20" fill="transparent" />
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6366f1" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </g>

          {/* RENDER CONNECTIONS */}
          {network.connections.map((conn, index) => {
            const fromNode = network.nodes.find(n => n.id === conn.from);
            const toNode = network.nodes.find(n => n.id === conn.to);

            if (!fromNode || !toNode) return null;

            // Geometry calculations for exact clean arrows
            const dx = toNode.x - fromNode.x;
            const dy = toNode.y - fromNode.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist === 0) return null;

            // Normal vectors
            const ux = dx / dist;
            const uy = dy / dist;

            // Shift arrow positions outwards from center of circles to make arrowhead visible
            const x1 = fromNode.x + ux * NODE_RADIUS;
            const y1 = fromNode.y + uy * NODE_RADIUS;
            // Subtract extra offset for target arrowhead
            const x2 = toNode.x - ux * (NODE_RADIUS + 7);
            const y2 = toNode.y - uy * (NODE_RADIUS + 7);

            const isHovered = hoveredConn?.from === conn.from && hoveredConn?.to === conn.to;
            const isCutMode = activeTool === 'scissors';

            // Curve calculation if there is a double/mutual lane to avoid overlap
            const isMutual = network.connections.some(c => c.from === conn.to && c.to === conn.from);
            let pathD = `M ${x1} ${y1} L ${x2} ${y2}`;

            let mx = (x1 + x2) / 2;
            let my = (y1 + y2) / 2;

            if (isMutual) {
              // Offset control point orthogonally to create a curve
              const ox = -uy * 20;
              const oy = ux * 20;
              const cx = (x1 + x2) / 2 + ox;
              const cy = (y1 + y2) / 2 + oy;
              pathD = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
              // middle of quadratic curve
              mx = (x1 + 2 * cx + x2) / 4;
              my = (y1 + 2 * cy + y2) / 4;
            }

            // Connection line color class
            let strokeColor = '#4f46e5'; // Default indigo
            let strokeDash = '';
            let markerHead = 'url(#arrow-head-standard)';

            if (conn.isCut) {
              strokeColor = '#f43f5e'; // Rose-red cut
              strokeDash = '6,4';
              markerHead = 'url(#arrow-head-cut)';
            } else if (isHovered && isCutMode) {
              strokeColor = '#e11d48'; // High highlight
              markerHead = 'url(#arrow-head-hovered)';
            } else if (activeTool === 'edit-inputs') {
              strokeColor = '#fbbf24'; // Amber wiring
              markerHead = 'url(#arrow-head-wiring)';
            }

            return (
              <g
                key={`${conn.from}-${conn.to}-${index}`}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredConn({ from: conn.from, to: conn.to })}
                onMouseLeave={() => setHoveredConn(null)}
                onClick={() => handleConnectionClick(conn.from, conn.to)}
              >
                {/* Thick invisible click helper element to make lines easy to grab */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  className="pointer-events-auto"
                />

                {/* Drawn Visible Connection Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth={isHovered ? 4 : 2}
                  strokeDasharray={strokeDash}
                  markerEnd={markerHead}
                  className="transition-all duration-200"
                />

                {/* Animated Signal Pulses traversing along the system (Only if uncut and from is active) */}
                {!conn.isCut && fromNode.state && (
                  <motion.g>
                    {isMutual ? (
                      // For curves, approximate middle coordinates running
                      <motion.circle
                        r={4.5}
                        fill="#fbbf24"
                        className="filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                        animate={{
                          cx: [x1, (x1 + (x1 - uy*20 + x2)/2)/2, (x1 - uy*20 + x2)/2, (x2 + (x1 - uy*20 + x2)/2)/2, x2],
                          cy: [y1, (y1 + (y1 + ux*20 + y2)/2)/2, (y1 + ux*20 + y2)/2, (y2 + (y1 + ux*20 + y2)/2)/2, y2]
                        }}
                        transition={{
                          duration: 1.8,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                      />
                    ) : (
                      // Perfect straight line sliding particle
                      <motion.circle
                        r={4.5}
                        fill="#fbbf24"
                        className="filter drop-shadow-[0_0_4px_rgba(251,191,36,0.8)]"
                        animate={{
                          cx: [x1, x2],
                          cy: [y1, y2]
                        }}
                        transition={{
                          duration: 1.6,
                          repeat: Infinity,
                          ease: 'linear'
                        }}
                      />
                    )}
                  </motion.g>
                )}

                {/* Scissor icon snippet overlayed when hovered in scissors mode */}
                {isHovered && isCutMode && !conn.isCut && (
                  <g transform={`translate(${mx - 10}, ${my - 10})`} className="pointer-events-none">
                    <circle cx="10" cy="10" r="10" fill="#f43f5e" />
                    <foreignObject x="4" y="4" width="12" height="12">
                      <Scissors className="w-3 h-3 text-white" />
                    </foreignObject>
                  </g>
                )}
              </g>
            );
          })}

          {/* DRAWING PREVIEW WIRE (in wire mode) */}
          {activeTool === 'edit-inputs' && selectedNodeId && (() => {
            const tempFromNode = network.nodes.find(n => n.id === selectedNodeId);
            if (!tempFromNode) return null;
            return (
              <line
                x1={tempFromNode.x}
                y1={tempFromNode.y}
                x2={tempFromNode.x} // simple visual cue
                y2={tempFromNode.y}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="4,4"
              />
            );
          })()}

          {/* RENDER NODES */}
          {network.nodes.map(node => {
            const isSelectedInputSource = selectedNodeId !== null && selectedNodeId !== node.id;
            const isWiringTarget = selectedNodeId === node.id;

            return (
              <motion.g
                key={node.id}
                drag
                dragMomentum={false}
                onDrag={(event, info) => handleDrag(node.id, info)}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-grab active:cursor-grabbing"
              >
                {/* Node Aura / Glowing when active */}
                {node.state && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS + 10}
                    className="fill-indigo-500/10 stroke-indigo-500/20 stroke-2"
                  />
                )}

                {/* Node Outer Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_RADIUS}
                  onClick={() => handleNodeClick(node.id)}
                  className={`transition-colors duration-300 stroke-2 overflow-visible ${
                    node.state
                      ? 'fill-indigo-900/90 stroke-indigo-400'
                      : 'fill-slate-900/95 stroke-slate-600'
                  } ${isWiringTarget ? 'stroke-amber-400 stroke-[3px]' : ''} ${
                    isSelectedInputSource ? 'hover:stroke-amber-300' : ''
                  }`}
                />

                {/* Node Inner Core Glowing pulse */}
                {node.state && (
                  <motion.circle
                    cx={node.x}
                    cy={node.y}
                    r={NODE_RADIUS - 6}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: [0.95, 1.05, 0.95] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="fill-indigo-500/25 pointer-events-none"
                  />
                )}

                {/* Firefly/Bulb visual in node center */}
                <g transform={`translate(${node.x - 11}, ${node.y - 18})`} className="pointer-events-none">
                  {node.state ? (
                    <Zap className="w-5.5 h-5.5 text-yellow-400 fill-yellow-400 filter drop-shadow-[0_0_5px_rgba(250,204,21,1)]" />
                  ) : (
                    <Zap className="w-5.5 h-5.5 text-slate-600" />
                  )}
                </g>

                {/* Central Labels inside node */}
                <text
                  x={node.x}
                  y={node.y + 14}
                  textAnchor="middle"
                  className="text-[11px] font-bold fill-slate-300 pointer-events-none tracking-tight font-sans"
                >
                  {node.label}
                </text>

                {/* Sub-label showing Gate type tag */}
                <g transform={`translate(${node.x - 22}, ${node.y + 35})`}>
                  {allowEditLogic ? (
                    <foreignObject x="0" y="0" width="44" height="24">
                      <select
                        value={node.gateType}
                        onChange={(e) => handleGateChange(node.id, e.target.value as any)}
                        className={`w-full text-center text-[10px] font-extrabold rounded px-1 py-0.5 bg-slate-800 border cursor-pointer border-slate-700 font-mono ${
                          node.state ? 'text-indigo-300 border-indigo-500' : 'text-slate-400'
                        }`}
                      >
                        <option value="COPY">COPY</option>
                        <option value="NOT">NOT</option>
                        <option value="AND">AND</option>
                        <option value="OR">OR</option>
                        <option value="XOR">XOR</option>
                      </select>
                    </foreignObject>
                  ) : (
                    <text
                      x="22"
                      y="12"
                      textAnchor="middle"
                      className="text-[9px] font-extrabold fill-indigo-400/90 font-mono uppercase tracking-wider"
                    >
                      {node.gateType}
                    </text>
                  )}
                </g>

                {/* Selection wire target details */}
                {isWiringTarget && (
                  <text
                    x={node.x}
                    y={node.y - 42}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-amber-400 font-mono tracking-wider animate-bounce"
                  >
                    SELECT SOURCE...
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>

        {/* Floating Instruction Snippet over stage depending on tool */}
        <div className="absolute bottom-3 left-4 right-4 pointer-events-none flex justify-center">
          <div className="bg-slate-900/95 border border-slate-800/80 px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 max-w-sm pointer-events-auto backdrop-blur-sm">
            <Info className="w-4 h-4 text-indigo-400 shrink-0" />
            <p className="text-[11px] font-medium text-slate-300 leading-tight font-sans">
              {activeTool === 'interact' && '👉 Click neurons to toggle light triggers, or Drag them freely!'}
              {activeTool === 'scissors' && '✂️ Click on connection arrows to slice or reconnect channels.'}
              {activeTool === 'edit-inputs' && '🔗 Click node 1, then click node 2 to toggle routing wires.'}
            </p>
          </div>
        </div>
      </div>

      {/* Clock Controls */}
      {allowPulse && (
        <div className="px-5 py-4 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between gap-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
              System Clock
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClockTick}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-200 hover:text-white hover:bg-slate-700/80 rounded-xl text-xs font-bold transition-all border border-slate-700/80"
              title="Advance network logic by one tick step"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Tick Clock
            </button>

            <button
              onClick={onTogglePlay}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-sm shadow-amber-900/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-900/20'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  Auto Pause
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
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
