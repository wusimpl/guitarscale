
export type NoteName = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export enum ScaleType {
  MAJOR = 'Major (Ionian)',
  MINOR = 'Natural Minor (Aeolian)',
  PENTATONIC_MAJOR = 'Major Pentatonic',
  PENTATONIC_MINOR = 'Minor Pentatonic',
  BLUES = 'Blues',
  CHROMATIC = 'Chromatic'
}

export enum ChordCategory {
  ALL = 'All Chords',
  TRIAD = 'Triads (三和弦)',
  SEVENTH = '7th Chords (七和弦)',
  SUS_DIM_AUG = 'Sus/Dim/Aug'
}

export type PracticeStatus = 'correct' | 'incorrect' | 'unsolved';

export interface PracticeResult {
  [key: string]: PracticeStatus; // key format: "stringIndex-fret"
}

export interface FretRange {
  start: number;
  end: number;
  label: string;
}

export interface ScaleDefinition {
  name: string;
  intervals: number[]; // Semitones from root
}

export interface FretboardNote {
  stringIndex: number; // 0 (High E) to 5 (Low E)
  fret: number;
  note: NoteName;
  octave: number;
  isRoot: boolean;
  isInScale: boolean;
  interval?: string;
  finger?: number | string; // For chord display
  isMuted?: boolean; // For chord display
}

export interface ChordShape {
  name: string;
  category: ChordCategory;
  popularity: number; // Usage frequency score 0-100
  notes: {
    stringIndex: number;
    fret: number;
    finger?: number; // 1=Index, 2=Middle, 3=Ring, 4=Pinky, or undefined for Open
  }[];
  mutedStrings: number[]; // Indices of strings that should not be played
}

// 和弦音阶匹配练习 - 和弦质量类型
export type ChordQuality = 'major' | 'minor' | 'dominant7' | 'minor7' | 'maj7' | 'dim' | 'aug' | 'sus4' | 'sus2' | 'm7b5';

// 和弦音阶匹配练习 - 题目
export interface ChordScaleQuestion {
  chordName: string;           // 和弦名称，如 "Dm7"
  chordRoot: NoteName;         // 和弦根音
  chordQuality: ChordQuality;  // 和弦质量
  correctAnswer: string;       // 正确答案的音阶key，如 "D-Dorian"
  options: ChordScaleOption[];  // 4个选项
}

export interface ChordScaleOption {
  key: string;                 // 唯一标识，如 "D-Dorian"
  label: string;               // 显示名称，如 "D Dorian"
  rootNote: NoteName;          // 音阶根音
  intervals: number[];         // 音阶音程
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}
