
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Fretboard from './components/Fretboard';
import AITutor from './components/AITutor';
import { ALL_NOTES, SCALE_PATTERNS, COMMON_CHORDS, getNoteAtFret, generateChordScaleQuestion, getScaleNotesFromIntervals } from './utils/musicTheory';
import { NoteName, ScaleType, ChordShape, ChordCategory, PracticeResult, PracticeStatus, FretRange, ChordScaleQuestion } from './types';
import { Settings, Music2, Grid, Layers, ChevronRight, Filter, Target, RotateCcw, Map, Zap, Shuffle, Timer, Check, X, ArrowRight } from 'lucide-react';
import { playCorrectSound, playIncorrectSound, playSuccessSound, playChordSound } from './utils/audioFeedback';

type ViewMode = 'scale' | 'chord' | 'practice' | 'chordScale';

const FRET_RANGE_PRESETS: FretRange[] = [
  { start: 0, end: 3, label: '0-3品 (开放区)' },
  { start: 4, end: 6, label: '4-6品 (中低区)' },
  { start: 7, end: 9, label: '7-9品 (中高区)' },
  { start: 10, end: 12, label: '10-12品 (高把位)' },
  { start: 0, end: 12, label: '0-12品 (全指板)' }
];

const App: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('scale');
  
  // Scale State
  const [rootNote, setRootNote] = useState<NoteName>('C');
  const [scaleType, setScaleType] = useState<ScaleType>(ScaleType.MAJOR);
  const [showIntervals, setShowIntervals] = useState<boolean>(false);

  // Chord State
  const [activeChordName, setActiveChordName] = useState<string>(COMMON_CHORDS[0].name);
  const [chordFilter, setChordFilter] = useState<ChordCategory>(ChordCategory.ALL);

  // Practice State
  const [practiceTargetNote, setPracticeTargetNote] = useState<NoteName>('C');
  const [practiceResults, setPracticeResults] = useState<PracticeResult>({});
  const [practiceFretRange, setPracticeFretRange] = useState<FretRange>(FRET_RANGE_PRESETS[0]);
  const [randomMode, setRandomMode] = useState<boolean>(false);
  const [includeSharps, setIncludeSharps] = useState<boolean>(false);

  // 根据 includeSharps 过滤可选音符
  const practiceNotes = useMemo(() => {
    return includeSharps ? ALL_NOTES : ALL_NOTES.filter(n => !n.includes('#'));
  }, [includeSharps]);

  // 计时/计分 State
  const [practiceTimer, setPracticeTimer] = useState<number>(0);
  const [practiceTimerRunning, setPracticeTimerRunning] = useState<boolean>(false);
  const [practiceScore, setPracticeScore] = useState<number>(0);
  const [practiceMistakes, setPracticeMistakes] = useState<number>(0);
  const timerRef = useRef<number | null>(null);
  const randomSwitchTimeoutRef = useRef<number | null>(null);

  // 和弦音阶匹配 State
  const [csQuestion, setCsQuestion] = useState<ChordScaleQuestion | null>(null);
  const [csSelectedKey, setCsSelectedKey] = useState<string | null>(null);
  const [csAnswered, setCsAnswered] = useState<boolean>(false);
  const [csCorrectCount, setCsCorrectCount] = useState<number>(0);
  const [csTotalCount, setCsTotalCount] = useState<number>(0);
  const [csShowScale, setCsShowScale] = useState<boolean>(false);

  const clearRandomSwitchTimeout = useCallback(() => {
    if (randomSwitchTimeoutRef.current) {
      clearTimeout(randomSwitchTimeoutRef.current);
      randomSwitchTimeoutRef.current = null;
    }
  }, []);

  const filteredChords = useMemo(() => {
    const list = chordFilter === ChordCategory.ALL 
      ? COMMON_CHORDS 
      : COMMON_CHORDS.filter(c => c.category === chordFilter);
    
    // Sort by popularity for better visual flow
    return [...list].sort((a, b) => b.popularity - a.popularity);
  }, [chordFilter]);

  const activeChord = useMemo(() => {
     if (viewMode !== 'chord') return null;
     return COMMON_CHORDS.find(c => c.name === activeChordName) || null;
  }, [viewMode, activeChordName]);

  const resetPractice = useCallback(() => {
    setPracticeResults({});
    setPracticeScore(0);
    setPracticeMistakes(0);
    setPracticeTimer(0);
    setPracticeTimerRunning(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    clearRandomSwitchTimeout();
  }, [clearRandomSwitchTimeout]);

  // 计时器逻辑
  useEffect(() => {
    if (practiceTimerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setPracticeTimer(prev => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [practiceTimerRunning]);

  // 离开练习模式时暂停计时并清理随机切题任务
  useEffect(() => {
    if (viewMode !== 'practice') {
      setPracticeTimerRunning(false);
      clearRandomSwitchTimeout();
    }
  }, [viewMode, clearRandomSwitchTimeout]);

  // 卸载时兜底清理随机切题任务
  useEffect(() => {
    return () => {
      clearRandomSwitchTimeout();
    };
  }, [clearRandomSwitchTimeout]);

  // 和弦音阶匹配：初始化题目
  useEffect(() => {
    if (viewMode === 'chordScale' && !csQuestion) {
      setCsQuestion(generateChordScaleQuestion());
    }
  }, [viewMode, csQuestion]);

  // 和弦音阶匹配：生成下一题
  const csNextQuestion = useCallback(() => {
    setCsQuestion(generateChordScaleQuestion(csQuestion?.chordName));
    setCsSelectedKey(null);
    setCsAnswered(false);
    setCsShowScale(false);
  }, [csQuestion]);

  // 和弦音阶匹配：选择答案
  const csHandleSelect = useCallback((key: string) => {
    if (csAnswered) return;
    setCsSelectedKey(key);
    setCsAnswered(true);
    setCsTotalCount(prev => prev + 1);
    if (csQuestion && key === csQuestion.correctAnswer) {
      setCsCorrectCount(prev => prev + 1);
      playSuccessSound();
      setCsShowScale(true);
    } else {
      playIncorrectSound();
      // 错误时也显示正确答案的音阶
      setCsShowScale(true);
    }
  }, [csAnswered, csQuestion]);

  // 和弦音阶匹配：当前正确答案对应的音阶音符（用于指板高亮）
  const csScaleNotes = useMemo(() => {
    if (!csQuestion || !csShowScale) return null;
    const correctOption = csQuestion.options.find(o => o.key === csQuestion.correctAnswer);
    if (!correctOption) return null;
    return {
      rootNote: correctOption.rootNote,
      notes: getScaleNotesFromIntervals(correctOption.rootNote, correctOption.intervals),
    };
  }, [csQuestion, csShowScale]);

  // Calculate total notes in current practice range for audio logic
  const totalNotesInCurrentRange = useMemo(() => {
    let count = 0;
    for (let s = 0; s < 6; s++) {
      for (let f = practiceFretRange.start; f <= practiceFretRange.end; f++) {
        const { note } = getNoteAtFret(s, f);
        if (note === practiceTargetNote) count++;
      }
    }
    return count;
  }, [practiceTargetNote, practiceFretRange]);

  // Monitor for completion
  useEffect(() => {
    if (viewMode === 'practice' && totalNotesInCurrentRange > 0) {
      const foundCount = Object.values(practiceResults).filter(v => v === 'correct').length;
      if (foundCount === totalNotesInCurrentRange) {
        playSuccessSound();
        setPracticeTimerRunning(false);
        // 随机模式：完成后自动切换下一个音
        if (randomMode) {
          clearRandomSwitchTimeout();
          randomSwitchTimeoutRef.current = window.setTimeout(() => {
            const otherNotes = practiceNotes.filter(n => n !== practiceTargetNote);
            const nextNote = otherNotes[Math.floor(Math.random() * otherNotes.length)];
            setPracticeTargetNote(nextNote);
            setPracticeResults({});
            setPracticeTimerRunning(true);
            randomSwitchTimeoutRef.current = null;
          }, 1500);
        }
      }
    }
  }, [practiceResults, totalNotesInCurrentRange, viewMode, randomMode, practiceTargetNote, practiceNotes, clearRandomSwitchTimeout]);

  const handlePracticeClick = (stringIndex: number, fret: number) => {
    const { note } = getNoteAtFret(stringIndex, fret);
    const key = `${stringIndex}-${fret}`;

    // 首次点击时启动计时器
    if (!practiceTimerRunning && Object.keys(practiceResults).length === 0) {
      setPracticeTimerRunning(true);
    }

    // Prevent re-clicking already found notes
    if (practiceResults[key] === 'correct') return;

    if (note === practiceTargetNote) {
      playCorrectSound(stringIndex, fret);
      setPracticeResults(prev => ({ ...prev, [key]: 'correct' }));
      setPracticeScore(prev => prev + 1);
    } else {
      playIncorrectSound();
      setPracticeMistakes(prev => prev + 1);
      setPracticeResults(prev => ({ ...prev, [key]: 'incorrect' }));
      // Temporary "incorrect" state
      setTimeout(() => {
        setPracticeResults(prev => {
          const next = { ...prev };
          if (next[key] === 'incorrect') {
            delete next[key];
          }
          return next;
        });
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col font-sans text-neutral-200">
      
      {/* Premium Header */}
      <header className="bg-neutral-900/40 backdrop-blur-2xl border-b border-neutral-800/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 py-3 sm:px-6 sm:py-4 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 group">
             <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-tr from-amber-600 via-orange-500 to-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] group-hover:rotate-6 transition-transform">
                <Music2 className="text-white drop-shadow-lg" size={24} />
             </div>
             <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                   弦萤
                </h1>
                <p className="text-neutral-500 text-[10px] sm:text-xs font-medium tracking-wide uppercase">StringGlow · 吉他新手指板练习</p>
             </div>
          </div>

          <div className="flex bg-neutral-900 p-1 sm:p-1.5 rounded-2xl border border-neutral-800 shadow-inner w-full md:w-auto">
             <button
                onClick={() => setViewMode('scale')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2.5 flex-1 md:flex-none px-3 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'scale' ? 'bg-gradient-to-br from-neutral-700 to-neutral-800 text-white shadow-xl ring-1 ring-neutral-600' : 'text-neutral-500 hover:text-neutral-300'}`}
             >
                <Grid size={18} /> <span className="hidden sm:inline">音阶图</span><span className="sm:hidden">音阶</span>
             </button>
             <button
                onClick={() => setViewMode('chord')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2.5 flex-1 md:flex-none px-3 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'chord' ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white shadow-xl ring-1 ring-purple-500' : 'text-neutral-500 hover:text-neutral-300'}`}
             >
                <Layers size={18} /> <span className="hidden sm:inline">和弦库</span><span className="sm:hidden">和弦</span>
             </button>
             <button
                onClick={() => setViewMode('practice')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2.5 flex-1 md:flex-none px-3 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'practice' ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white shadow-xl ring-1 ring-blue-500' : 'text-neutral-500 hover:text-neutral-300'}`}
             >
                <Target size={18} /> <span className="hidden sm:inline">位置练习</span><span className="sm:hidden">练习</span>
             </button>
             <button
                onClick={() => setViewMode('chordScale')}
                className={`flex items-center justify-center gap-1.5 sm:gap-2.5 flex-1 md:flex-none px-3 sm:px-6 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'chordScale' ? 'bg-gradient-to-br from-teal-600 to-teal-800 text-white shadow-xl ring-1 ring-teal-500' : 'text-neutral-500 hover:text-neutral-300'}`}
             >
                <Zap size={18} /> <span className="hidden sm:inline">和弦配阶</span><span className="sm:hidden">配阶</span>
             </button>
          </div>
        </div>
      </header>

      {/* Control Console */}
      <section className="bg-neutral-900/20 border-b border-neutral-800/50 py-4 sm:py-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          
          {viewMode === 'scale' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-10 items-start animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                  <ChevronRight size={14} className="text-amber-500" /> 选择调式主音 (Key)
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {ALL_NOTES.map(note => (
                    <button
                      key={note}
                      onClick={() => setRootNote(note)}
                      className={`h-11 rounded-xl text-sm font-black transition-all border-2
                        ${rootNote === note 
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}
                      `}
                    >
                      {note}
                    </button>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4 space-y-3 sm:space-y-4">
                <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                   <ChevronRight size={14} className="text-amber-500" /> 音乐调式 (Scale)
                </h3>
                <div className="relative group">
                  <select 
                    value={scaleType} 
                    onChange={(e) => setScaleType(e.target.value as ScaleType)}
                    className="w-full h-12 bg-neutral-900 border-2 border-neutral-800 text-white font-bold text-sm rounded-xl px-4 appearance-none focus:outline-none focus:border-amber-500 transition-colors cursor-pointer shadow-inner"
                  >
                    {Object.values(ScaleType).map((type) => (
                      <option key={type} value={type}>{SCALE_PATTERNS[type as ScaleType].name}</option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500">
                    <ChevronRight size={18} className="rotate-90" />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3 space-y-3 sm:space-y-4">
                <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                   <ChevronRight size={14} className="text-amber-500" /> 显示设置
                </h3>
                <button 
                  onClick={() => setShowIntervals(!showIntervals)}
                  className={`w-full h-12 rounded-xl border-2 font-bold flex items-center justify-center gap-3 text-sm transition-all
                    ${showIntervals 
                      ? 'bg-neutral-800 border-emerald-500 text-emerald-400' 
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'}
                  `}
                >
                  <Settings size={18} className={showIntervals ? 'animate-spin-slow' : ''} />
                  {showIntervals ? "正在显示级数" : "正在显示音名"}
                </button>
              </div>
            </div>
          )}

          {viewMode === 'chord' && (
             <div className="space-y-4 sm:space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Filter size={20} />
                    </div>
                    <div className="flex bg-neutral-900/50 p-1 rounded-xl border border-neutral-800 shadow-inner overflow-x-auto no-scrollbar">
                      {Object.values(ChordCategory).map(cat => (
                        <button
                          key={cat}
                          onClick={() => setChordFilter(cat)}
                          className={`whitespace-nowrap px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${chordFilter === cat ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-neutral-500 hover:text-neutral-300'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                      <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">高频常用</span>
                    </div>
                    <span className="text-[10px] bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-purple-500/20">
                      已加载 {filteredChords.length} 个和弦
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-3 max-h-[180px] overflow-y-auto no-scrollbar p-1">
                   {filteredChords.map(chord => {
                      const isActive = activeChordName === chord.name;
                      let baseColorClass = 'bg-neutral-900 border-neutral-800 text-neutral-600 hover:border-neutral-700 hover:text-neutral-300 opacity-60';
                      
                      if (chord.popularity >= 95) {
                        baseColorClass = 'bg-purple-900/30 border-purple-700/50 text-purple-300 hover:border-purple-500 hover:text-white';
                      } else if (chord.popularity >= 80) {
                        baseColorClass = 'bg-purple-950/20 border-purple-900/40 text-neutral-400 hover:border-purple-700 hover:text-neutral-200';
                      } else if (chord.popularity >= 60) {
                        baseColorClass = 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700';
                      }

                      return (
                        <button
                          key={chord.name}
                          onClick={() => setActiveChordName(chord.name)}
                          className={`px-3 py-2.5 rounded-xl text-sm font-black transition-all border-2
                             ${isActive
                               ? 'bg-purple-600 border-purple-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.5)] scale-105 z-10'
                               : baseColorClass}
                          `}
                        >
                           {chord.name}
                        </button>
                      );
                   })}
                </div>
             </div>
          )}

          {viewMode === 'practice' && (
             <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-10 items-start">
                <div className="lg:col-span-5 space-y-3 sm:space-y-4">
                  <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                    <ChevronRight size={14} className="text-blue-500" /> 1. 选择练习音符 (Note)
                  </h3>
                  <div className="flex items-center justify-between mb-2">
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 flex-1">
                      {practiceNotes.map(note => (
                        <button
                          key={note}
                          onClick={() => { setPracticeTargetNote(note); resetPractice(); }}
                          disabled={randomMode}
                          className={`h-11 rounded-xl text-sm font-black transition-all border-2
                            ${practiceTargetNote === note
                              ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300'}
                            ${randomMode ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        >
                          {note}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* 半音开关 */}
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => {
                        const next = !includeSharps;
                        setIncludeSharps(next);
                        // 关闭半音时，若当前选中的是半音，自动切回 C
                        if (!next && practiceTargetNote.includes('#')) {
                          setPracticeTargetNote('C');
                        }
                        resetPractice();
                      }}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${includeSharps ? 'bg-blue-500' : 'bg-neutral-700'}`}
                      aria-label="包含半音"
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${includeSharps ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-xs text-neutral-400 font-bold">包含半音 (♯)</span>
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-3 sm:space-y-4">
                  <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                    <ChevronRight size={14} className="text-blue-500" /> 2. 选择品格范围 (Fret Range)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FRET_RANGE_PRESETS.map(range => (
                       <button
                         key={range.label}
                         onClick={() => { setPracticeFretRange(range); resetPractice(); }}
                         className={`h-11 px-4 rounded-xl text-xs font-bold transition-all border-2 flex items-center justify-center gap-2
                           ${practiceFretRange.label === range.label
                             ? 'bg-blue-600/10 border-blue-400 text-blue-400'
                             : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                         `}
                       >
                         <Map size={14} className={practiceFretRange.label === range.label ? 'text-blue-400' : 'text-neutral-600'} />
                         {range.label}
                       </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3 space-y-3 sm:space-y-4">
                  <h3 className="text-xs uppercase text-neutral-500 font-black tracking-[0.2em] flex items-center gap-2">
                    <ChevronRight size={14} className="text-blue-500" /> 3. 练习模式
                  </h3>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => { setRandomMode(!randomMode); resetPractice(); }}
                      className={`h-11 rounded-xl border-2 font-bold flex items-center justify-center gap-2 text-xs transition-all
                        ${randomMode
                          ? 'bg-blue-600/20 border-blue-400 text-blue-400'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:border-neutral-700'}
                      `}
                    >
                      <Shuffle size={14} /> {randomMode ? '随机模式 开' : '随机模式 关'}
                    </button>
                    <button
                      onClick={resetPractice}
                      className="h-11 rounded-xl bg-neutral-800 border-2 border-neutral-700 text-neutral-400 font-bold flex items-center justify-center gap-2 hover:bg-red-900/20 hover:text-red-400 hover:border-red-900/30 transition-all text-xs"
                    >
                      <RotateCcw size={14} /> 重置进度
                    </button>
                  </div>
                </div>
                </div>

                {/* 计时/计分面板 */}
                <div className="flex flex-wrap items-center gap-4 sm:gap-8 bg-neutral-900/50 border border-neutral-800/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Timer size={16} className="text-blue-400" />
                    <span className="text-xs text-neutral-500 font-bold">用时</span>
                    <span className="text-lg font-mono font-black text-white min-w-[4rem]">
                      {Math.floor(practiceTimer / 60).toString().padStart(2, '0')}:{(practiceTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-neutral-700" />
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-xs text-neutral-500 font-bold">正确</span>
                    <span className="text-lg font-mono font-black text-emerald-400">{practiceScore}</span>
                  </div>
                  <div className="h-6 w-px bg-neutral-700" />
                  <div className="flex items-center gap-2">
                    <X size={16} className="text-red-400" />
                    <span className="text-xs text-neutral-500 font-bold">错误</span>
                    <span className="text-lg font-mono font-black text-red-400">{practiceMistakes}</span>
                  </div>
                  {randomMode && (
                    <>
                      <div className="h-6 w-px bg-neutral-700" />
                      <div className="flex items-center gap-2">
                        <Shuffle size={14} className="text-blue-400 animate-pulse" />
                        <span className="text-xs text-blue-400 font-bold">随机模式 · 完成后自动切换</span>
                      </div>
                    </>
                  )}
                </div>
             </div>
          )}

          {viewMode === 'chordScale' && csQuestion && (
             <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mb-1">当前和弦</span>
                      <div className="flex items-center gap-3">
                        <div className="min-w-14 h-14 px-2 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-teal-900/40">
                          <span
                            className={`font-black text-white leading-none whitespace-nowrap ${
                              csQuestion.chordName.length >= 5
                                ? 'text-lg'
                                : csQuestion.chordName.length >= 4
                                ? 'text-xl'
                                : 'text-2xl'
                            }`}
                          >
                            {csQuestion.chordName}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-white text-sm font-bold">选择最匹配的音阶</span>
                          <span className="text-neutral-500 text-xs">即兴演奏时，这个和弦上应该用什么音阶？</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-teal-500/10 text-teal-400 px-3 py-1.5 rounded-full font-bold border border-teal-500/20">
                      {csCorrectCount} / {csTotalCount} 正确
                    </span>
                    {csAnswered && (
                      <button
                        onClick={csNextQuestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-teal-900/30"
                      >
                        下一题 <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {csQuestion.options.map(option => {
                    let btnClass = 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-teal-500 hover:text-white';
                    if (csAnswered) {
                      if (option.key === csQuestion.correctAnswer) {
                        btnClass = 'bg-emerald-600/20 border-emerald-400 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
                      } else if (option.key === csSelectedKey) {
                        btnClass = 'bg-red-600/20 border-red-400 text-red-300';
                      } else {
                        btnClass = 'bg-neutral-900 border-neutral-800 text-neutral-600 opacity-50';
                      }
                    }
                    return (
                      <button
                        key={option.key}
                        onClick={() => csHandleSelect(option.key)}
                        disabled={csAnswered}
                        className={`px-5 py-4 rounded-xl border-2 font-bold text-left transition-all flex items-center justify-between ${btnClass} ${csAnswered ? 'cursor-default' : 'cursor-pointer'}`}
                      >
                        <span className="text-sm">{option.label}</span>
                        {csAnswered && option.key === csQuestion.correctAnswer && (
                          <Check size={18} className="text-emerald-400" />
                        )}
                        {csAnswered && option.key === csSelectedKey && option.key !== csQuestion.correctAnswer && (
                          <X size={18} className="text-red-400" />
                        )}
                      </button>
                    );
                  })}
                </div>
             </div>
          )}

        </div>
      </section>

      {/* Main Exhibition Area */}
      <main className="flex-1 flex flex-col items-center justify-center py-6 sm:py-12 px-2 sm:px-4 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_70%)]"></div>
        
        <Fretboard
          rootNote={viewMode === 'chordScale' && csScaleNotes ? csScaleNotes.rootNote : rootNote}
          scaleType={scaleType}
          showIntervals={viewMode === 'chordScale' && csShowScale ? true : showIntervals}
          activeChord={activeChord}
          practiceMode={viewMode === 'practice'}
          practiceTargetNote={practiceTargetNote}
          practiceResults={practiceResults}
          practiceFretRange={practiceFretRange}
          onPracticeClick={handlePracticeClick}
          customScaleNotes={viewMode === 'chordScale' ? (csShowScale && csScaleNotes ? csScaleNotes.notes : []) : undefined}
        />

        {/* Legend Panel */}
        <div className="mt-8 sm:mt-16 bg-neutral-900/50 backdrop-blur border border-neutral-800/80 px-4 py-3 sm:px-8 sm:py-4 rounded-2xl flex flex-wrap gap-3 sm:gap-8 shadow-2xl animate-in fade-in duration-1000">
             {viewMode === 'practice' ? (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-blue-500/30 bg-blue-500/10 group-hover:scale-125 transition-transform"></div>
                    <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">待确认位置</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 border border-emerald-400 group-hover:scale-125 transition-transform"></div>
                    <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">正确</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-600 border border-red-400 group-hover:scale-125 transition-transform"></div>
                    <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">错误</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-neutral-800/80 opacity-50 border border-neutral-700 group-hover:scale-125 transition-transform"></div>
                    <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">非练习区</span>
                  </div>
                </>
             ) : viewMode === 'chordScale' ? (
                <>
                  {csShowScale ? (
                    <>
                      <div className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)] group-hover:scale-125 transition-transform"></div>
                        <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">根音 (Root)</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 border border-emerald-300 group-hover:scale-125 transition-transform"></div>
                        <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">匹配音阶内音</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Zap size={16} className="text-teal-400" />
                      <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">选择答案后，指板将高亮显示正确音阶</span>
                    </div>
                  )}
                </>
             ) : (
                <>
                  <div className="flex items-center gap-2 sm:gap-3 group">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-amber-300 to-amber-600 border border-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.4)] group-hover:scale-125 transition-transform"></div>
                    <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">根音 (Root)</span>
                  </div>
                  {viewMode === 'scale' && (
                      <div className="flex items-center gap-2 sm:gap-3 group">
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 border border-emerald-300 group-hover:scale-125 transition-transform"></div>
                          <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">音阶内音 (In Scale)</span>
                      </div>
                  )}
                  {viewMode === 'chord' && (
                      <div className="flex items-center gap-2 sm:gap-3 group">
                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-purple-500 text-purple-400 flex items-center justify-center text-[10px] group-hover:scale-125 transition-transform font-bold">1</div>
                        <span className="text-neutral-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest">指法 (Fingering)</span>
                      </div>
                  )}
                </>
             )}
        </div>
      </main>

      <footer className="py-8 text-center border-t border-neutral-900">
        <p className="text-neutral-600 text-[10px] font-bold uppercase tracking-[0.3em]">
          弦萤 StringGlow &copy; 2025 Designed by wusimpl
        </p>
      </footer>

      {process.env.SHOW_AI_TUTOR === 'true' && (
        <AITutor
           currentRoot={viewMode === 'practice' ? practiceTargetNote : rootNote}
           currentScale={scaleType}
        />
      )}

    </div>
  );
};

export default App;
