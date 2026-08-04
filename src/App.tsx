import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BookOpen, Brain, Sparkles, Award, RotateCcw,
  ArrowRight, ArrowLeft, HelpCircle, CheckCircle2,
  XOctagon, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { chapters } from './data/chapters';
import { Network } from './types';
import { calculatePhi, stepNetwork } from './lib/phi';
import NetworkVisualizer, { ChangeReason } from './components/NetworkVisualizer';
import Gauge, { MAX_PHI } from './components/Gauge';

/** Φ needed to earn the Spark badge. Reachable, but only just — see chapter 5. */
export const SPARK_THRESHOLD = 1.5;

const escapeHtml = (raw: string) =>
  raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Tiny, deliberately restricted markdown renderer.
 * The input is escaped first, so only the tags we generate here can ever reach
 * the DOM — no HTML from the chapter files can leak through.
 */
const renderInlineMarkdown = (raw: string) =>
  escapeHtml(raw)
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em class="text-slate-200 italic">$2</em>')
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded text-xs font-mono">$1</code>',
    );

export default function App() {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [network, setNetwork] = useState<Network>(() =>
    structuredClone(chapters[0].networkPreset),
  );
  const [narrativeIndex, setNarrativeIndex] = useState(0);

  // Interactive quiz state
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Simulation clock control
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTool, setActiveTool] = useState<'interact' | 'scissors' | 'edit-inputs'>('interact');

  const [achievements, setAchievements] = useState({
    sparked: false,    // Φ >= SPARK_THRESHOLD
    severer: false,    // actually cut a wire
    interactor: false, // actually toggled an element
  });

  const activeChapter = chapters[currentChapterIndex];
  const isFirstChapter = currentChapterIndex === 0;
  const isLastChapter = currentChapterIndex === chapters.length - 1;

  // Reset the stage whenever the chapter changes.
  useEffect(() => {
    setNetwork(structuredClone(chapters[currentChapterIndex].networkPreset));
    setNarrativeIndex(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setIsPlaying(false);
    setActiveTool('interact');
  }, [currentChapterIndex]);

  // One synchronous clock tick. Pure state transition — no side effects inside
  // the updater, which would otherwise run twice under React StrictMode.
  const handleClockTick = () => setNetwork((current) => stepNetwork(current));

  // Auto-run ticker. handleClockTick is stable enough because it only uses the
  // functional form of setState, so the interval never reads a stale network.
  const tickRef = useRef(handleClockTick);
  tickRef.current = handleClockTick;
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => tickRef.current(), 950);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Stop the clock if the user navigates to a chapter without clock controls.
  useEffect(() => {
    if (!activeChapter.allowPulse && isPlaying) setIsPlaying(false);
  }, [activeChapter.allowPulse, isPlaying]);

  // Real-time Φ. Memoised so we do not redo the partition search on every
  // unrelated re-render (quiz clicks, narrative steps, ...).
  const { phi, mip, partitions, note } = useMemo(() => calculatePhi(network), [network]);

  useEffect(() => {
    if (phi >= SPARK_THRESHOLD) {
      setAchievements((prev) => (prev.sparked ? prev : { ...prev, sparked: true }));
    }
  }, [phi]);

  /** The visualizer reports *why* the network changed, so badges stay honest. */
  const handleNetworkChange = (newNet: Network, reason: ChangeReason) => {
    setNetwork(newNet);
    if (reason === 'toggle') {
      setAchievements((p) => (p.interactor ? p : { ...p, interactor: true }));
    } else if (reason === 'cut') {
      setAchievements((p) => (p.severer ? p : { ...p, severer: true }));
    }
  };

  const handleNextParagraph = () =>
    setNarrativeIndex((i) => Math.min(i + 1, activeChapter.narrative.length - 1));

  const handleResetPreset = () => setNetwork(structuredClone(activeChapter.networkPreset));

  const handleSubmitQuiz = () => {
    if (selectedAnswer === null || !activeChapter.quiz) return;
    setQuizSubmitted(true);
  };

  const narrativeComplete = narrativeIndex === activeChapter.narrative.length - 1;
  const quiz = activeChapter.quiz;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* GLOBAL NAVBAR HEADER */}
      <header className="px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl shadow-md shadow-indigo-500/10">
            <Brain className="w-5 h-5 text-white" aria-hidden="true" />
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

        <nav aria-label="Chapters" className="flex items-center gap-1.5 sm:gap-2">
          {chapters.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => setCurrentChapterIndex(idx)}
              aria-current={idx === currentChapterIndex ? 'step' : undefined}
              aria-label={`Chapter ${ch.id}: ${ch.subtitle}`}
              className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold font-mono transition-all duration-300 border focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
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
        </nav>
      </header>

      {/* CORE WORKSPACE */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* LEFT COLUMN: narrative & quiz */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900/40 border border-slate-800 p-5 sm:p-6 rounded-2xl h-full gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-[10px] font-bold text-indigo-400 font-mono tracking-widest uppercase">
                {activeChapter.subtitle}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight font-display mt-0.5">
                {activeChapter.title}
              </h2>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {activeChapter.narrative.slice(0, narrativeIndex + 1).map((para, idx) => (
                  <motion.p
                    key={`${activeChapter.id}-${idx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans"
                    dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(para) }}
                  />
                ))}
              </AnimatePresence>

              {narrativeComplete && activeChapter.realityCheck && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start gap-2 p-3 rounded-xl border border-amber-900/50 bg-amber-950/20"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="block text-[9px] font-extrabold text-amber-400 uppercase tracking-widest mb-1">
                      Reality check
                    </span>
                    <p
                      className="text-[11px] leading-relaxed text-amber-100/80"
                      dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(activeChapter.realityCheck) }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            {!narrativeComplete && (
              <button
                onClick={handleNextParagraph}
                className="self-start mt-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all text-xs font-bold rounded-xl flex items-center gap-1.5 border border-slate-700/80"
              >
                Reveal next clue
                <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* QUIZ */}
          {narrativeComplete && quiz && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-3.5 my-2"
            >
              <div className="flex items-center gap-2 text-indigo-400">
                <HelpCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Conceptual Checkup
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-200">{quiz.question}</p>

              <div className="space-y-2">
                {quiz.options.map((opt, oIdx) => (
                  <button
                    key={oIdx}
                    onClick={() => !quizSubmitted && setSelectedAnswer(oIdx)}
                    aria-pressed={selectedAnswer === oIdx}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition-all border ${
                      quizSubmitted && oIdx === quiz.correctIndex
                        ? 'bg-emerald-950/60 border-emerald-500/80 text-emerald-200'
                        : quizSubmitted && selectedAnswer === oIdx
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
                  role="status"
                  className={`p-2.5 rounded-lg text-[11px] leading-relaxed flex items-start gap-2 ${
                    selectedAnswer === quiz.correctIndex
                      ? 'bg-emerald-950/30 text-emerald-300 border border-emerald-900/50'
                      : 'bg-indigo-950/25 text-indigo-300 border border-indigo-900/50'
                  }`}
                >
                  {selectedAnswer === quiz.correctIndex ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                  ) : (
                    <XOctagon className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" aria-hidden="true" />
                  )}
                  <span>
                    {selectedAnswer !== quiz.correctIndex && (
                      <strong className="block mb-1 text-indigo-200">
                        Not quite — the answer is “{quiz.options[quiz.correctIndex]}”.
                      </strong>
                    )}
                    {quiz.explanation}
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ACTION PROMPT */}
          <div className="bg-indigo-950/30 border border-indigo-900/50 p-4 rounded-xl space-y-1.5 mt-auto">
            <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-300" aria-hidden="true" />
              Active Experiment
            </span>
            <p className="text-[11px] leading-relaxed text-slate-300 font-sans">
              {activeChapter.actionPrompt}
            </p>
          </div>

          {/* CHAPTER STEPPER */}
          <div className="flex items-center justify-between border-t border-slate-800/80 pt-4 mt-2">
            <button
              onClick={() => setCurrentChapterIndex((prev) => Math.max(0, prev - 1))}
              disabled={isFirstChapter}
              className="flex items-center gap-1.5 py-1.5 px-3 bg-slate-900 hover:bg-slate-800/80 text-slate-400 hover:text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30 border border-slate-800"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              Back
            </button>

            <span className="text-[10px] font-mono text-slate-600">
              {currentChapterIndex + 1} / {chapters.length}
            </span>

            <button
              onClick={() =>
                setCurrentChapterIndex((prev) => Math.min(chapters.length - 1, prev + 1))
              }
              disabled={isLastChapter}
              className="flex items-center gap-1.5 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-30"
            >
              Next Step
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: simulator, gauge, metrics */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-6 h-full">
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
              onTogglePlay={() => setIsPlaying((p) => !p)}
              activeTool={activeTool}
              onChangeActiveTool={setActiveTool}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            <div className="md:col-span-5">
              <Gauge phi={phi} note={note} />
            </div>

            <div className="md:col-span-7 p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" aria-hidden="true" />
                    How Φ is evaluated
                  </span>
                  <button
                    onClick={handleResetPreset}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors"
                    title="Restore the initial state of this chapter"
                  >
                    <RotateCcw className="w-3 h-3" aria-hidden="true" />
                    Reset Stage
                  </button>
                </div>

                {activeChapter.showPhiCalculations ? (
                  <>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2 font-sans">
                      The Minimisation Search Space
                    </h4>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-sans mb-3">
                      Every way of splitting the elements in two, scored by prediction loss.
                      Candidates are ranked by loss ÷ size of the smaller side; the cheapest is
                      the <strong className="text-rose-400">Minimum Information Partition</strong>,
                      and its raw loss is Φ.
                    </p>

                    <ul className="space-y-1.5 h-28 overflow-y-auto pr-1">
                      {partitions.length > 0 ? (
                        partitions.map((part) => {
                          const isMIP = mip?.name === part.name;
                          return (
                            <li
                              key={part.name}
                              className={`px-3 py-1.5 rounded-lg border flex items-center justify-between gap-2 text-[11px] font-mono transition-colors ${
                                isMIP
                                  ? 'bg-rose-950/20 border-rose-500/50 text-rose-300'
                                  : 'bg-slate-950/40 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span className="truncate">
                                {isMIP ? '🏆 ' : '• '}
                                {part.name}
                              </span>
                              <span className="shrink-0 tabular-nums">
                                <span className={isMIP ? 'font-bold text-rose-400' : ''}>
                                  {part.loss.toFixed(2)}
                                </span>
                                <span className="text-slate-600"> ÷{Math.min(part.partA.length, part.partB.length)} = </span>
                                {part.normalizedLoss.toFixed(2)}
                              </span>
                            </li>
                          );
                        })
                      ) : (
                        <li className="h-full flex items-center justify-center p-3 text-center border border-dashed border-slate-800 rounded-xl">
                          <p className="text-[10px] font-medium text-slate-500 font-mono">
                            Nothing to partition yet (Φ = 0).
                          </p>
                        </li>
                      )}
                    </ul>
                  </>
                ) : (
                  <div className="h-40 flex items-center justify-center px-4 text-center border border-dashed border-slate-800 rounded-xl">
                    <p className="text-[11px] leading-relaxed text-slate-500 font-sans">
                      The partition machinery unlocks in Chapter 4. For now, just notice that
                      independent parts can never add up to a whole.
                    </p>
                  </div>
                )}
              </div>

              {/* BADGES */}
              <div className="border-t border-slate-800/80 pt-3 flex flex-wrap items-center justify-between gap-2.5">
                <span className="text-[9px] font-extrabold text-slate-500 tracking-wider font-mono uppercase flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" aria-hidden="true" />
                  Your Sandbox Badges:
                </span>
                <div className="flex gap-1.5">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.interactor
                        ? 'bg-indigo-950/60 text-indigo-300 border border-indigo-700/55'
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title="Toggle an element on or off"
                  >
                    💡 Touch
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.severer
                        ? 'bg-rose-950/60 text-rose-300 border border-rose-700/55'
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title="Cut a connection with the scissors"
                  >
                    ✂️ Sever
                  </span>
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-md font-bold transition-all ${
                      achievements.sparked
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-700/55'
                        : 'bg-slate-950 text-slate-600 border border-slate-800/50'
                    }`}
                    title={`Reach Φ ≥ ${SPARK_THRESHOLD.toFixed(1)} (the ceiling for three elements is ${MAX_PHI})`}
                  >
                    ✨ Spark
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 border-t border-slate-800 text-center text-[10px] font-mono text-slate-500 mt-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>
          Inspired by Nicky Case's explorable explanations &amp; Giulio Tononi's Integrated
          Information Theory. Φ here is a simplified teaching model — see Chapter 6.
        </span>
        <span>Consciousness Lab • Real-time Active Learning</span>
      </footer>
    </div>
  );
}
