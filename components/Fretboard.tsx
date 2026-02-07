
import React, { useMemo, useState, useEffect } from 'react';
import { NoteName, ScaleType, FretboardNote, ChordShape, PracticeResult, PracticeStatus, FretRange } from '../types';
import { getNoteAtFret, getScaleNotes, getIntervalName, getFrequency, getScientificPitch, getFullIntervalName, getChordNotes } from '../utils/musicTheory';
import { Activity, Info } from 'lucide-react';
import { playNoteSound, playChordSound } from '../utils/audioFeedback';

interface FretboardProps {
  rootNote: NoteName;
  scaleType: ScaleType;
  showIntervals: boolean;
  activeChord?: ChordShape | null;
  practiceMode?: boolean;
  practiceTargetNote?: NoteName;
  practiceResults?: PracticeResult;
  practiceFretRange?: FretRange;
  onPracticeClick?: (stringIndex: number, fret: number) => void;
}

const STRINGS = 6;
const FRETS = 12;

const Fretboard: React.FC<FretboardProps> = ({ 
  rootNote, scaleType, showIntervals, activeChord, 
  practiceMode, practiceTargetNote, practiceResults = {}, practiceFretRange, onPracticeClick 
}) => {
  const [selectedNote, setSelectedNote] = useState<FretboardNote | null>(null);

  useEffect(() => {
    setSelectedNote(null);
  }, [activeChord, rootNote, scaleType, practiceMode, practiceTargetNote, practiceFretRange]);

  const fretboardData = useMemo(() => {
    const data: FretboardNote[] = [];
    const scaleNotes = getScaleNotes(rootNote, scaleType);

    for (let s = 0; s < STRINGS; s++) {
      let chordNoteDef = null;
      let isMuted = false;

      if (activeChord) {
        if (activeChord.mutedStrings.includes(s)) {
          isMuted = true;
        } else {
          chordNoteDef = activeChord.notes.find(n => n.stringIndex === s);
        }
      }

      for (let f = 0; f <= FRETS; f++) {
        const { note, octaveShift } = getNoteAtFret(s, f);
        let isInScale = false;
        let isRoot = false;
        let finger: number | string | undefined = undefined;

        if (activeChord) {
           if (isMuted && f === 0) {
              isInScale = true; 
           } else if (chordNoteDef && chordNoteDef.fret === f) {
              isInScale = true;
              const chordRootMatch = activeChord.name.match(/^[A-G]#?/);
              const chordRoot = chordRootMatch ? chordRootMatch[0] : '';
              isRoot = note === chordRoot; 
              finger = chordNoteDef.finger || (f === 0 ? 'O' : undefined);
           }
        } else {
           isInScale = scaleNotes.includes(note);
           isRoot = note === rootNote;
        }
        
        data.push({
          stringIndex: s,
          fret: f,
          note,
          octave: octaveShift,
          isInScale,
          isRoot,
          interval: (!activeChord && isInScale) ? getIntervalName(rootNote, note) : undefined,
          finger,
          isMuted: (activeChord && isMuted && f === 0)
        });
      }
    }
    return data;
  }, [rootNote, scaleType, activeChord]);

  // Calculate total notes in current practice range
  const totalNotesInRange = useMemo(() => {
    if (!practiceMode || !practiceTargetNote || !practiceFretRange) return 0;
    return fretboardData.filter(n => 
      n.note === practiceTargetNote && 
      n.fret >= practiceFretRange.start && 
      n.fret <= practiceFretRange.end
    ).length;
  }, [fretboardData, practiceMode, practiceTargetNote, practiceFretRange]);

  const fretMarkers = [3, 5, 7, 9, 12];

  const renderInfoBar = () => {
    if (practiceMode) {
      const foundCount = Object.values(practiceResults).filter(v => v === 'correct').length;
      return (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full px-3 sm:px-8 py-2 sm:py-0 h-full animate-in fade-in duration-300 gap-2 sm:gap-0">
           <div className="flex items-center gap-3 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Target Note</span>
                <div className="flex items-center gap-2 sm:gap-3">
                   <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-lg shadow-blue-900/40">
                      {practiceTargetNote}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-white text-xs sm:text-sm font-bold">找到所有 {practiceTargetNote}</span>
                   </div>
                </div>
              </div>
           </div>

           <div className="flex items-center gap-4 sm:gap-8">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Progress</span>
                <div className="flex items-center gap-2">
                   <span className="text-xl sm:text-3xl font-mono font-black text-white">{foundCount}</span>
                   <span className="text-neutral-600 text-base sm:text-xl">/</span>
                   <span className="text-neutral-500 text-base sm:text-xl font-bold">{totalNotesInRange}</span>
                </div>
              </div>
              <div className="w-20 sm:w-32 h-2 bg-neutral-800 rounded-full overflow-hidden border border-neutral-700">
                 <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                    style={{ width: `${Math.min((foundCount / (totalNotesInRange || 1)) * 100, 100)}%` }}
                 ></div>
              </div>
           </div>
        </div>
      );
    }

    if (!selectedNote && activeChord) {
        const chordNotes = getChordNotes(activeChord);
        return (
            <div className="flex items-center justify-between w-full px-3 sm:px-8 h-full animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 sm:gap-8">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-purple-400 font-bold uppercase tracking-[0.2em] mb-1">Chord Structure</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            {chordNotes.map((n, i) => (
                                <React.Fragment key={n}>
                                    <span className="text-xl sm:text-3xl font-black text-white">{n}</span>
                                    {i < chordNotes.length - 1 && <span className="text-neutral-600 font-light text-base sm:text-xl">/</span>}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                      onClick={() => playChordSound(activeChord.notes.map(n => ({ stringIndex: n.stringIndex, fret: n.fret })))}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/40 hover:border-purple-400 rounded-xl text-purple-300 hover:text-white font-bold text-xs transition-all active:scale-95 shadow-lg shadow-purple-900/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
                      扫弦试听
                    </button>
                    <div className="hidden lg:flex items-center gap-3 bg-neutral-800/50 px-4 py-2 rounded-xl border border-neutral-700/50">
                        <Info size={16} className="text-purple-400" />
                        <span className="text-xs text-neutral-400 font-medium">点击指板上的单个圆圈可查看其具体的音高数据</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!selectedNote) {
        return (
            <div className="flex items-center justify-center h-full text-neutral-500 gap-3 animate-pulse">
                <Activity size={20} strokeWidth={1.5} className="text-amber-500/50" />
                <span className="text-sm font-medium tracking-wide">点击指板上的音符查看实时音频数据</span>
            </div>
        );
    }

    const freq = getFrequency(selectedNote.stringIndex, selectedNote.fret);
    const scientific = getScientificPitch(selectedNote.stringIndex, selectedNote.fret);
    const fullInterval = getFullIntervalName(selectedNote.interval);
    const stringNum = selectedNote.stringIndex + 1;

    return (
        <div className="flex items-center justify-between w-full px-3 sm:px-8 h-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-amber-500/70 font-bold uppercase tracking-[0.2em] mb-1">Scientific Pitch</span>
                  <div className="text-2xl sm:text-4xl font-black text-white font-mono tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
                      {scientific}
                  </div>
                </div>

                <div className="h-8 sm:h-10 w-[1px] bg-neutral-700 mx-1 sm:mx-2" />

                <div className="flex flex-col">
                    <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest mb-1">Frequency</span>
                    <span className="text-base sm:text-xl font-bold text-neutral-200 font-mono leading-none">
                      {freq} <span className="text-xs text-neutral-500 font-normal ml-0.5">Hz</span>
                    </span>
                </div>
            </div>

            <div className="hidden md:flex flex-col items-center">
                 {fullInterval ? (
                    <>
                      <span className="text-[10px] text-emerald-500/70 font-bold uppercase tracking-widest mb-1.5">Interval Relation</span>
                      <div className="px-6 py-2 bg-neutral-900 border border-neutral-700 rounded-full text-emerald-100 font-bold text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                          {fullInterval}
                      </div>
                    </>
                 ) : activeChord && (
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] text-purple-500/70 font-bold uppercase tracking-widest mb-1.5">Note Name</span>
                        <div className="px-6 py-2 bg-neutral-900 border border-neutral-700 rounded-full text-purple-100 font-bold text-sm shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                            {selectedNote.note}
                        </div>
                    </div>
                 )}
            </div>

            <div className="flex items-center gap-3 sm:gap-6">
                <div className="text-right">
                    <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Position</div>
                    <div className="text-sm sm:text-lg text-white font-bold flex items-center gap-1 sm:gap-2">
                        <span className="bg-neutral-900 px-1.5 sm:px-2 py-0.5 rounded border border-neutral-800 text-amber-500">{stringNum} 弦</span>
                        <span className="text-neutral-700">/</span>
                        <span className="bg-neutral-900 px-1.5 sm:px-2 py-0.5 rounded border border-neutral-800 text-amber-500">{selectedNote.fret} 品</span>
                    </div>
                </div>
            </div>
        </div>
    );
  };
  
  return (
    <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
      {/* Dynamic Info Panel */}
      <div className="min-h-[4rem] sm:h-28 bg-neutral-900/90 backdrop-blur-xl border border-neutral-800 rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] mb-4 sm:mb-10 flex items-center overflow-hidden relative group">
          <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${
            practiceMode ? 'from-blue-500 to-indigo-600' : 
            activeChord ? 'from-purple-500 to-indigo-600' : 
            'from-amber-500 to-orange-600'
          }`}></div>
          {renderInfoBar()}
      </div>

      <div className="w-full overflow-x-auto fretboard-scroll pb-8 sm:pb-12 select-none">
        <div className="min-w-[700px] relative bg-[#0a0a0a] p-1.5 sm:p-2 rounded-2xl shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-neutral-800/50">
            
            <div className="relative h-72 rounded-xl shadow-inner overflow-hidden" 
                 style={{ 
                   background: 'linear-gradient(to right, #1a1a1a, #261e1a, #1a1a1a)',
                   backgroundImage: `url('https://www.transparenttextures.com/patterns/dark-wood.png'), linear-gradient(to bottom, #1e1b19, #2d2420 50%, #1e1b19)`
                 }}>
            
            <div className="absolute inset-0 flex">
                <div className={`w-14 border-r-[8px] border-neutral-300 bg-gradient-to-r from-neutral-200 via-neutral-400 to-neutral-200 flex-shrink-0 z-30 shadow-[10px_0_20px_rgba(0,0,0,0.5)] relative transition-opacity duration-500 ${practiceMode && practiceFretRange && practiceFretRange.start > 0 ? 'opacity-20' : 'opacity-100'}`}>
                    <div className="absolute inset-0 bg-white/10 opacity-50"></div>
                </div>
                
                {Array.from({ length: FRETS }).map((_, i) => {
                  const fretNum = i + 1;
                  const isOutOfPracticeRange = practiceMode && practiceFretRange && (fretNum < practiceFretRange.start || fretNum > practiceFretRange.end);
                  
                  return (
                    <div key={`fret-${i}`} className={`flex-1 border-r-[4px] border-[#c4a484]/20 relative z-10 transition-all duration-500 ${isOutOfPracticeRange ? 'opacity-20 saturate-50' : 'opacity-100'}`}>
                        {/* Zone Mask */}
                        {isOutOfPracticeRange && (
                           <div className="absolute inset-0 bg-black/40 z-0"></div>
                        )}
                        
                        <div className="absolute right-0 top-0 bottom-0 w-[3px] bg-gradient-to-r from-[#888] via-[#e5e5e5] to-[#888] shadow-[2px_0_5px_rgba(0,0,0,0.5)]"></div>
                        <span className={`absolute -bottom-8 left-full -translate-x-1/2 text-[11px] font-black font-mono tracking-tighter transition-colors ${isOutOfPracticeRange ? 'text-neutral-700' : 'text-neutral-500'}`}>{fretNum}</span>
                        
                        {fretMarkers.includes(fretNum) && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-12 pointer-events-none">
                            {fretNum === 12 ? (
                                <div className="flex flex-col gap-14 translate-y-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 border border-black/20 shadow-lg opacity-40"></div>
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-400 border border-black/20 shadow-lg opacity-40"></div>
                                </div>
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-300 border border-black/20 shadow-xl opacity-30 blur-[0.5px]"></div>
                            )}
                            </div>
                        )}
                    </div>
                  );
                })}
            </div>

            <div className="absolute inset-0 flex flex-col justify-between py-6 px-0 pointer-events-none z-20">
                {Array.from({ length: STRINGS }).map((_, i) => {
                const thickness = 1.5 + (i * 0.8); 
                return (
                    <div 
                        key={`string-line-${i}`} 
                        className="w-full relative group/string"
                        style={{ height: `${thickness}px` }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-stone-400 via-stone-100 to-stone-500 shadow-[0_2px_4px_rgba(0,0,0,0.6)]"></div>
                        {i >= 2 && (
                            <div className="absolute inset-0 opacity-40" 
                                 style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 1.5px, rgba(0,0,0,0.5) 2px)' }}>
                            </div>
                        )}
                    </div>
                );
                })}
            </div>

            <div className="absolute inset-0 flex flex-col justify-between py-2.5 z-40">
                {Array.from({ length: STRINGS }).map((_, sIndex) => {
                const notesOnString = fretboardData.filter(n => n.stringIndex === sIndex).sort((a,b) => a.fret - b.fret);
                
                return (
                    <div key={`string-row-${sIndex}`} className="flex relative h-8 items-center">
                        <div className="w-14 flex-shrink-0 flex justify-center items-center relative z-50">
                            {(() => {
                                const note = notesOnString.find(n => n.fret === 0);
                                if (!note) return null;
                                const isOutOfPracticeRange = practiceMode && practiceFretRange && (0 < practiceFretRange.start || 0 > practiceFretRange.end);

                                return <NoteCircle 
                                  note={note} 
                                  showInterval={showIntervals} 
                                  isChordMode={!!activeChord} 
                                  onSelect={setSelectedNote} 
                                  isNut 
                                  practiceMode={practiceMode}
                                  practiceStatus={practiceResults[`${sIndex}-0`]}
                                  isOutOfRange={isOutOfPracticeRange}
                                  onPracticeClick={() => onPracticeClick?.(sIndex, 0)}
                                />;
                            })()}
                        </div>

                        {Array.from({ length: FRETS }).map((_, fIndex) => {
                        const fretNum = fIndex + 1;
                        const note = notesOnString.find(n => n.fret === fretNum);
                        const isOutOfPracticeRange = practiceMode && practiceFretRange && (fretNum < practiceFretRange.start || fretNum > practiceFretRange.end);
                        
                        return (
                            <div key={`fret-cell-${sIndex}-${fretNum}`} className="flex-1 flex justify-center items-center relative">
                                {note && (
                                    <NoteCircle 
                                        note={note} 
                                        showInterval={showIntervals} 
                                        isChordMode={!!activeChord}
                                        onSelect={setSelectedNote} 
                                        practiceMode={practiceMode}
                                        practiceStatus={practiceResults[`${sIndex}-${fretNum}`]}
                                        isOutOfRange={isOutOfPracticeRange}
                                        onPracticeClick={() => onPracticeClick?.(sIndex, fretNum)}
                                    />
                                )}
                            </div>
                        );
                        })}
                    </div>
                );
                })}
            </div>

            </div>
        </div>
      </div>
    </div>
  );
};

interface NoteCircleProps { 
  note: FretboardNote; 
  showInterval: boolean; 
  isChordMode: boolean;
  isNut?: boolean;
  onSelect: (note: FretboardNote | null) => void;
  practiceMode?: boolean;
  practiceStatus?: PracticeStatus;
  isOutOfRange?: boolean;
  onPracticeClick?: () => void;
}

const NoteCircle: React.FC<NoteCircleProps> = ({ 
  note, showInterval, isChordMode, isNut, onSelect, 
  practiceMode, practiceStatus, isOutOfRange, onPracticeClick 
}) => {
  const isRoot = note.isRoot;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (practiceMode) {
      if (!isOutOfRange) {
        onPracticeClick?.();
      }
    } else {
      // 点击音符时播放对应音高的吉他音色
      if (note.isInScale || note.isMuted === false) {
        playNoteSound(note.stringIndex, note.fret);
      }
      onSelect(note);
    }
  };

  // Practice Mode UI
  if (practiceMode) {
    if (isOutOfRange) {
      return (
        <div className="w-12 h-12 flex items-center justify-center opacity-0 pointer-events-none"></div>
      );
    }

    let content = null;
    let bgClass = "bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20";
    
    if (practiceStatus === 'correct') {
      bgClass = "bg-emerald-600 border-emerald-400 scale-110 shadow-[0_0_20px_rgba(16,185,129,0.5)]";
      content = <span className="text-white font-black text-sm">{note.note}</span>;
    } else if (practiceStatus === 'incorrect') {
      bgClass = "bg-red-600 border-red-400 animate-shake";
      content = <span className="text-white font-black text-sm">✕</span>;
    }

    return (
      <div className="group relative flex justify-center items-center w-12 h-12" onClick={handleClick}>
         <div className={`
            w-8 h-8 rounded-full border-2 flex items-center justify-center 
            transition-all duration-300 cursor-pointer shadow-inner
            ${bgClass}
         `}>
            {content}
         </div>
      </div>
    );
  }

  if (note.isMuted) {
    return (
      <div className="w-10 h-10 flex items-center justify-center cursor-pointer" onClick={handleClick}>
        <span className="text-red-500 font-black text-2xl drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">✕</span>
      </div>
    );
  }

  // Only show background note names at the nut if NOT in chord mode and NOT in practice mode
  if (!note.isInScale && isNut && !isChordMode && !practiceMode) {
      return (
        <div className="group relative flex justify-center items-center w-10 h-10 cursor-pointer" onClick={handleClick}>
            <span className="text-neutral-600 font-bold text-xs font-mono drop-shadow-md select-none transition-colors uppercase hover:text-neutral-400">
                {note.note}
            </span>
        </div>
      );
  }

  if (isChordMode) {
    // If not in scale/part of the chord shape, hide it completely for a clean look
    if (!note.isInScale) return null;

    const isOpenString = note.finger === 'O';
    const circleBg = isRoot 
      ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 border-amber-200'
      : 'bg-gradient-to-br from-purple-500 via-purple-600 to-purple-800 border-purple-300';

    return (
      <div className="group relative flex justify-center items-center w-12 h-12" onClick={handleClick}>
          <div className={`
              w-9 h-9 rounded-full border-2 flex items-center justify-center 
              transition-all duration-300 shadow-[0_10px_20px_rgba(0,0,0,0.5)] cursor-pointer
              ${isOpenString 
                ? 'bg-transparent border-purple-400 text-purple-400' 
                : `${circleBg} text-white`}
              active:scale-95 group-hover:shadow-[0_0_25px_rgba(168,85,247,0.7)]
            `}>
            <span className="text-[13px] font-black drop-shadow-md">{note.note}</span>
          </div>
      </div>
    );
  }

  const bgStyle = isRoot 
    ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 border-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.8),inset_0_2px_5px_rgba(255,255,255,0.4)]' 
    : 'bg-gradient-to-br from-emerald-300 via-emerald-600 to-emerald-900 border-emerald-400 shadow-[0_5px_15px_rgba(0,0,0,0.4),inset_0_2px_5px_rgba(255,255,255,0.3)]';

  if (!note.isInScale) return null;

  return (
    <div className="group relative flex justify-center items-center w-12 h-12" onClick={handleClick}>
        <div className={`
            w-9 h-9 rounded-full border-2 flex items-center justify-center 
            transition-all duration-300 cursor-pointer relative overflow-hidden
            ${bgStyle}
            active:scale-95 group-hover:brightness-110 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]
          `}>
          <div className="absolute top-0 left-0 w-full h-1/2 bg-white/20 rounded-t-full"></div>
          <span className="text-[13px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] z-10">
            {showInterval ? note.interval : note.note}
          </span>
        </div>
    </div>
  );
};

export default Fretboard;
