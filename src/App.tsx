import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Brain, Sparkles, Award, RotateCcw, 
  ArrowRight, ArrowLeft, HelpCircle, CheckCircle2, 
  XOctagon, ChevronRight, HelpCircle as HelpIcon 
} from 'lucide-react';
import { chapters } from './data/chapters';
import { Network, NetworkNode, NetworkConnection } from './types';
import { calculatePhi, evaluateGate } from './lib/phi';
import NetworkVisualizer from './components/NetworkVisualizer';
import Gauge from './components/Gauge';

export default function App() {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [network, setNetwork] = useState<Network>(chapters[0].networkPreset);
  const [narrativeIndex, setNarrativeIndex] = useState(0); // For stepping through paragraphs within a chapter
  
  // Interactive Quiz State
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);

  // Simulation Clock control
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<'interact' | 'scissors' | 'edit-inputs'>('interact');

  // Achievements tracked state
  const [achievements, setAchievements] = useState({
    sparked: false, // Φ >= 1.0
    severer: false, // cut a line
    interactor: false, // toggled a light state
    cyclicLoop: false, // auto playing with recursive flow
  });

  const activeChapter = chapters[currentChapterIndex];

  // Refresh / reset chapter state
  useEffect(() => {
    // Deep clone the preset node structures to prevent reference leaks
    const preset = JSON.parse(JSON.stringify(activeChapter.networkPreset));
    setNetwork(preset);
    setNarrativeIndex(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setQuizFeedback(null);
    setIsPlaying(false);
    setActiveTool('interact');
  }, [currentChapterIndex]);

  // Synchronous network clock runner
  const handleClockTick = () => {
    setNetwork((currentNet) => {
      const nextStates = currentNet.nodes.map(node => {
        const inputs: number[] = [];
        for (const inputId of node.inputs) {
          const conn = currentNet.connections.find(c => c.from === inputId && c.to === node.id);
          const isCut = conn ? conn.isCut : true;
          
          if (isCut) {
            inputs.push(0.5); // Cut means receiving pure noise
          } else {
            const srcNode = currentNet.nodes.find(n => n.id === inputId);
            inputs.push(srcNode ? (srcNode.state ? 1 : 0) : 0.5);
          }
        }
        
        const nextVal = evaluateGate(node.gateType, inputs, node.state);
        return { id: node.id, state: nextVal >= 0.5 };
      });

      const updatedNodes = currentNet.nodes.map(node => {
        const stateUpdate = nextStates.find(u => u.id === node.id);
        return stateUpdate ? { ...node, state: stateUpdate.state } : node;
      });

      // Simple achievement check for recursive oscilation
      if (isPlaying) {
        setAchievements(prev => ({ ...prev, cyclicLoop: true }));
      }

      return { ...currentNet, nodes: updatedNodes };
    });
  };

  // Auto Run ticker
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        handleClockTick();
      }, 950);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Real-time Φ indicators
  const { phi, mip, partitions } = calculatePhi(network);

  // Check achievements triggered by changes
  useEffect(() => {
    if (phi >= 0.95 && !achievements.sparked) {
      setAchievements((p) => ({ ...p, sparked: true }));
    }
  }, [phi]);

  // Handle active tool switches
  const handleToolChange = (tool: 'interact' | 'scissors' | 'edit-inputs') => {
    setActiveTool(tool);
    if (tool === 'scissors') {
      setAchievements(p => ({ ...p, severer: true }));
    }
  };

  // Node toggle track
  const handleNetworkChange = (newNet: Network) => {
    setNetwork(newNet);
    setAchievements((p) => ({ ...p, interactor: true }));
  };

  // Step through narrative paragraphs
  const handleNextParagraph = () => {
    if (narrativeIndex < activeChapter.narrative.length - 1) {
      setNarrativeIndex(narrativeIndex + 1);
    }
  };

  // Reset current network
  const handleResetPreset = () => {
    const preset = JSON.parse(JSON.stringify(activeChapter.networkPreset));
    setNetwork(preset);
  };

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null || !activeChapter.quiz) return;
    setQuizSubmitted(true);
    setQuizFeedback(activeChapter.quiz.explanation);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* GLOBAL NAVBAR HEADER */}
      <header className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-md shadow-indigo-500/10">
            <Brain className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight font-display text-white sm:text-base">
              Consciousness Lab
            </h1>
            <p className="text-[10px] text-slate-400 font-mono tracking-wider">
              An Explorable Explanation of IIT
            </p>
          </div>
        </div>

        {/* Dynamic Nav Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-2 max-w-sm sm:max-w-md">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapterIndex(idx)}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 border ${
                idx === currentChapterIndex
                  ? 'bg-indigo-600 border-indigo-400 text-white font-black scale-110 shadow-lg shadow-indigo-600/30'
                  : idx < currentChapterIndex
                  ? 'bg-indigo-950/40 border-indigo-800 text-indigo-400 hover:border-indigo-600'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
              title={ch.title}
            >
              {ch.id}
            </button>
          ))}
        </div>
      </header>

      {/* CORE WORKSPACE CONTENT */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Narrative & Quiz Stepper */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-2xl h-full gap-6">
          <div className="flex flex-col gap-4">
            {/* Header info */}
            <div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">
                {activeChapter.subtitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display mt-0.5">
                {activeChapter.title}
              </h2>
            </div>

            {/* Structured step-by-step scrolling block */}
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {activeChapter.narrative.slice(0, narrativeIndex + 1).map((para, idx) => (
                  <motion.p
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{
                      __html: para
                        .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                        .replace(/`([^`]+)`/g, '<code class="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>

            {/* Paragraph steppers / Case style click trigger */}
            {narrativeIndex < activeChapter.narrative.length - 1 && (
              <button
                onClick={handleNextParagraph}
                className="self-start mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700/80"
              >
                Reveal next clue
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          {/* TRANSITIONING QUIZ BLOCK (Once narrative completes) */}
          {narrativeIndex === activeChapter.narrative.length - 1 && activeChapter.quiz && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3.5 my-2"
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <HelpCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Conceptual Checkup
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200">
                {activeChapter.quiz.question}
              </p>

              <div className="space-y-2">
                {activeChapter.quiz.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => {
                      if (!quizSubmitted) setSelectedAnswer(oIdx);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                      quizSubmitted && oIdx === activeChapter.quiz?.correctIndex
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                        : quizSubmitted && selectedAnswer === oIdx && oIdx !== activeChapter.quiz?.correctIndex
                        ? 'bg-rose-950/60 border-rose-500/80 text-rose-200'
                        : selectedAnswer === oIdx
                        ? 'bg-indigo-900/50 border-indigo-500 text-indigo-100'
                        : 'bg-slate-900 border-slate-800/60 hover:bg-slate-800 text-slate-300'
                    }`}
                    disabled={quizSubmitted}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={selectedAnswer === null}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:hover:bg-indigo-600"
                >
                  Submit Answer
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 ${
                    selectedAnswer === activeChapter.quiz.correctIndex
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-900/50'
                      : 'bg-indigo-950/25 text-indigo-300 border border-indigo-900/50'
                  }`}
                >
                  {selectedAnswer === activeChapter.quiz.correctIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XOctagon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  )}
                  <span>{quizFeedback}</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ACTION / CHALLENGE REQUIREMENT INSTRUCTIONS */}
          <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl space-y-1.5 mt-auto">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300" />
              Active Experiment
            </span>
            <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
              {activeChapter.actionPrompt}
            </p>
          </div>

          {/* BOTTOM STEPPER PROGRESS BAR */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-2">
            <button
              onClick={() => setCurrentChapterIndex(prev => Math.max(0, prev - 1))}
              disabled={currentChapterIndex === 0}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30 border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </button>

            <button
              onClick={() => {
                if (currentChapterIndex < chapters.length - 1) {
                  setCurrentChapterIndex(prev => prev + 1);
                }
              }}
              disabled={currentChapterIndex === chapters.length - 1}
              className="flex items-center gap-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Simulator, Gauge, and Math metrics */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6 h-full">
          
          {/* Top section: The live Network Stage */}
          <div className="flex-grow">
            <NetworkVisualizer
              network={network}
              onChangeNetwork={handleNetworkChange}
              allowEditLogic={activeChapter.allowEditLogic}
              allowToggleNodes={activeChapter.allowToggleNodes}
              allowScissors={activeChapter.allowScissors}
              allowPulse={activeChapter.allowPulse}
              onClockTick={handleClockTick}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              activeTool={activeTool}
              onChangeActiveTool={handleToolChange}
            />
          </div>

          {/* Bottom section: Gauge on Left, Partitions comparison on Right */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-5">
              <Gauge phi={phi} />
            </div>

            {/* Partitions listing showing actual IIT MIP Calculations */}
            <div className="md:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    How Φ is evaluated
                  </span>
                  
                  {/* Reset coordinates easily */}
                  <button
                    onClick={handleResetPreset}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                    title="Restore initial state of this chapter"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Stage
                  </button>
                </div>
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 font-sans">
                  The Minimization Search Space
                </h4>
                <p className="text-[11px] leading-relaxed text-slate-400 font-sans mb-3">
                  We calculate prediction loss for different slices. The slice with the <strong className="text-rose-400">minimum loss</strong> defines our <strong>Minimum Information Partition (MIP)</strong>.
                </p>

                {/* Candidate Partitions list rendering */}
                <div className="space-y-1.5 h-28 overflow-y-auto pr-1">
                  {partitions.length > 0 ? (
                    partitions.slice(0, 5).map((part, pIdx) => {
                      const isMIP = mip?.name === part.name;
                      return (
                        <div
                          key={pIdx}
                          className={`px-3 py-1.5 rounded-lg border flex items-center justify-between text-[11px] font-mono transition-colors ${
                            isMIP
                              ? 'bg-rose-950/20 border-rose-500/50 text-rose-300'
                              : 'bg-slate-950/40 border-slate-800 text-slate-400'
                          }`}
                        >
                          <span className="truncate max-w-[190px]">
                            {isMIP ? '🏆 ' : '• '} {part.name}
                          </span>
                          <span className={`${isMIP ? 'font-bold text-rose-400' : 'text-slate-400'}`}>
                            Loss: {part.loss.toFixed(2)}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-full flex items-center justify-center p-3 text-center border border-dashed border-slate-800 rounded-xl">
                      <p className="text-[10px] font-medium text-slate-500 font-mono">
                        No active feedback channels to partition (Φ = 0).
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Achievements banner to reward interactions */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[9px] font-extrabold text-slate-500 tracking-wider font-mono uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  Your Sandbox Badges:
                </span>
                <div className="flex gap-1.5">
                  <span 
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.interactor 
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/55' 
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title="Toggled a node light state"
                  >
                    💡 Touch
                  </span>
                  <span 
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.severer 
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-700/55' 
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title="Cut a connection link"
                  >
                    ✂️ Sever
                  </span>
                  <span 
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.sparked 
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-700/55' 
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title="Achieve a Φ index of 0.95 or higher!"
                  >
                    ✨ Spark
                  </span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </main>

      {/* FOOTER BAR */}
      <footer className="py-4 border-t border-slate-800 text-center text-[10px] font-mono text-slate-500 mt-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>
          Inspired by Nicky Case's explorable explanations & Giulio Tononi's Integrated Information Theory.
        </span>
        <span>
          Consciousness Lab © 2026 • Real-time Active Learning
        </span>
      </footer>

    </div>
  );
}
