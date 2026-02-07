
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

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isLoading?: boolean;
}
