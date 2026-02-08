
import { NoteName, ScaleType, ScaleDefinition, ChordShape, ChordCategory, ChordQuality, ChordScaleQuestion, ChordScaleOption } from '../types';

export const ALL_NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standard Tuning: High E (0) to Low E (5)
const STANDARD_TUNING_OFFSETS = [4, 11, 7, 2, 9, 4]; // Indices in ALL_NOTES corresponding to E, B, G, D, A, E

export const getNoteAtFret = (stringIndex: number, fret: number): { note: NoteName; octaveShift: number } => {
  const openNoteIndex = STANDARD_TUNING_OFFSETS[stringIndex];
  const totalSemitones = openNoteIndex + fret;
  const noteIndex = totalSemitones % 12;
  const octaveShift = Math.floor(totalSemitones / 12);
  
  return {
    note: ALL_NOTES[noteIndex],
    octaveShift
  };
};

export const SCALE_PATTERNS: Record<ScaleType, ScaleDefinition> = {
  [ScaleType.MAJOR]: { name: 'Major (大调)', intervals: [0, 2, 4, 5, 7, 9, 11] },
  [ScaleType.MINOR]: { name: 'Natural Minor (小调)', intervals: [0, 2, 3, 5, 7, 8, 10] },
  [ScaleType.PENTATONIC_MAJOR]: { name: 'Major Pentatonic (五声音阶)', intervals: [0, 2, 4, 7, 9] },
  [ScaleType.PENTATONIC_MINOR]: { name: 'Minor Pentatonic (布鲁斯五声)', intervals: [0, 3, 5, 7, 10] },
  [ScaleType.BLUES]: { name: 'Blues (蓝调)', intervals: [0, 3, 5, 6, 7, 10] },
  [ScaleType.CHROMATIC]: { name: 'Chromatic (半音阶)', intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] },
};

export const COMMON_CHORDS: ChordShape[] = [
  // TRIADS - High Popularity
  { name: 'C', popularity: 100, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Cm', popularity: 65, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 1 }, { stringIndex: 3, fret: 5, finger: 3 }, { stringIndex: 2, fret: 5, finger: 4 }, { stringIndex: 1, fret: 4, finger: 2 }, { stringIndex: 0, fret: 3, finger: 1 }] },
  { name: 'D', popularity: 100, category: ChordCategory.TRIAD, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 1 }, { stringIndex: 1, fret: 3, finger: 3 }, { stringIndex: 0, fret: 2, finger: 2 }] },
  { name: 'Dm', popularity: 85, category: ChordCategory.TRIAD, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 3, finger: 3 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'E', popularity: 98, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 2, finger: 3 }, { stringIndex: 2, fret: 1, finger: 1 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Em', popularity: 100, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 2, finger: 3 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'F', popularity: 92, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 1, finger: 1 }, { stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 3, finger: 4 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'Fm', popularity: 60, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 1, finger: 1 }, { stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 3, finger: 4 }, { stringIndex: 2, fret: 1, finger: 1 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'G', popularity: 100, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 3, finger: 2 }, { stringIndex: 4, fret: 2, finger: 1 }, { stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 3, finger: 3 }] },
  { name: 'Gm', popularity: 65, category: ChordCategory.TRIAD, mutedStrings: [], notes: [{ stringIndex: 5, fret: 3, finger: 1 }, { stringIndex: 4, fret: 5, finger: 3 }, { stringIndex: 3, fret: 5, finger: 4 }, { stringIndex: 2, fret: 3, finger: 1 }, { stringIndex: 1, fret: 3, finger: 1 }, { stringIndex: 0, fret: 3, finger: 1 }] },
  { name: 'A', popularity: 98, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 1 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 2, finger: 3 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Am', popularity: 100, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 2, finger: 3 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
  { name: 'B', popularity: 75, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 2, finger: 1 }, { stringIndex: 3, fret: 4, finger: 2 }, { stringIndex: 2, fret: 4, finger: 3 }, { stringIndex: 1, fret: 4, finger: 4 }, { stringIndex: 0, fret: 2, finger: 1 }] },
  { name: 'Bm', popularity: 90, category: ChordCategory.TRIAD, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 2, finger: 1 }, { stringIndex: 3, fret: 4, finger: 3 }, { stringIndex: 2, fret: 4, finger: 4 }, { stringIndex: 1, fret: 3, finger: 2 }, { stringIndex: 0, fret: 2, finger: 1 }] },

  // SEVENTH CHORDS
  { name: 'Cmaj7', popularity: 78, category: ChordCategory.SEVENTH, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'C7', popularity: 82, category: ChordCategory.SEVENTH, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 3, finger: 4 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Dmaj7', popularity: 75, category: ChordCategory.SEVENTH, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 1 }, { stringIndex: 1, fret: 2, finger: 1 }, { stringIndex: 0, fret: 2, finger: 1 }] },
  { name: 'D7', popularity: 88, category: ChordCategory.SEVENTH, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 2, finger: 3 }] },
  { name: 'Dm7', popularity: 80, category: ChordCategory.SEVENTH, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'Emaj7', popularity: 72, category: ChordCategory.SEVENTH, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 1, finger: 1 }, { stringIndex: 2, fret: 1, finger: 1 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'E7', popularity: 85, category: ChordCategory.SEVENTH, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 1, finger: 1 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Em7', popularity: 88, category: ChordCategory.SEVENTH, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'G7', popularity: 90, category: ChordCategory.SEVENTH, mutedStrings: [], notes: [{ stringIndex: 5, fret: 3, finger: 3 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'Am7', popularity: 88, category: ChordCategory.SEVENTH, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
  { name: 'A7', popularity: 85, category: ChordCategory.SEVENTH, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 2, finger: 3 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Bm7', popularity: 75, category: ChordCategory.SEVENTH, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 2, finger: 1 }, { stringIndex: 3, fret: 4, finger: 3 }, { stringIndex: 2, fret: 2, finger: 1 }, { stringIndex: 1, fret: 3, finger: 2 }, { stringIndex: 0, fret: 2, finger: 1 }] },
  { name: 'Bm7b5', popularity: 40, category: ChordCategory.SEVENTH, mutedStrings: [5, 0], notes: [{ stringIndex: 4, fret: 2, finger: 1 }, { stringIndex: 3, fret: 3, finger: 3 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 3, finger: 4 }] },

  // SUS / DIM / AUG - Lower popularity
  { name: 'Csus4', popularity: 50, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 3, finger: 4 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 1, finger: 1 }] },
  { name: 'Csus2', popularity: 55, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 0 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Dsus4', popularity: 75, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 3, finger: 3 }, { stringIndex: 0, fret: 3, finger: 4 }] },
  { name: 'Dsus2', popularity: 72, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 0 }, { stringIndex: 2, fret: 2, finger: 2 }, { stringIndex: 1, fret: 3, finger: 3 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Esus4', popularity: 65, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [], notes: [{ stringIndex: 5, fret: 0 }, { stringIndex: 4, fret: 2, finger: 2 }, { stringIndex: 3, fret: 2, finger: 3 }, { stringIndex: 2, fret: 2, finger: 4 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Asus4', popularity: 68, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 2, finger: 3 }, { stringIndex: 1, fret: 3, finger: 4 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Asus2', popularity: 70, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 0 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 2, finger: 3 }, { stringIndex: 1, fret: 0 }, { stringIndex: 0, fret: 0 }] },
  { name: 'Cdim', popularity: 30, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5, 4], notes: [{ stringIndex: 3, fret: 4, finger: 3 }, { stringIndex: 2, fret: 5, finger: 4 }, { stringIndex: 1, fret: 4, finger: 2 }, { stringIndex: 0, fret: 2, finger: 1 }] },
  { name: 'Caug', popularity: 25, category: ChordCategory.SUS_DIM_AUG, mutedStrings: [5], notes: [{ stringIndex: 4, fret: 3, finger: 3 }, { stringIndex: 3, fret: 2, finger: 2 }, { stringIndex: 2, fret: 1, finger: 1 }, { stringIndex: 1, fret: 1, finger: 1 }, { stringIndex: 0, fret: 0 }] },
];

export const getScaleNotes = (root: NoteName, scaleType: ScaleType): NoteName[] => {
  const rootIndex = ALL_NOTES.indexOf(root);
  const pattern = SCALE_PATTERNS[scaleType];
  
  return pattern.intervals.map(interval => {
    return ALL_NOTES[(rootIndex + interval) % 12];
  });
};

export const getChordNotes = (chord: ChordShape): NoteName[] => {
  const notesSet = new Set<NoteName>();
  chord.notes.forEach(n => {
    const { note } = getNoteAtFret(n.stringIndex, n.fret);
    notesSet.add(note);
  });
  
  const uniqueNotes = Array.from(notesSet);
  
  // Extract chord root from name (e.g. "Cm7" -> "C", "F#" -> "F#")
  const chordRootMatch = chord.name.match(/^[A-G]#?/);
  const rootNote = chordRootMatch ? (chordRootMatch[0] as NoteName) : uniqueNotes[0];
  const rootIndexInAll = ALL_NOTES.indexOf(rootNote);

  // Sort notes by their interval from the chord's root
  uniqueNotes.sort((a, b) => {
    let distA = ALL_NOTES.indexOf(a) - rootIndexInAll;
    if (distA < 0) distA += 12;
    let distB = ALL_NOTES.indexOf(b) - rootIndexInAll;
    if (distB < 0) distB += 12;
    return distA - distB;
  });

  return uniqueNotes;
};

export const getIntervalName = (root: NoteName, note: NoteName): string => {
  const rootIndex = ALL_NOTES.indexOf(root);
  const noteIndex = ALL_NOTES.indexOf(note);
  
  let semitones = noteIndex - rootIndex;
  if (semitones < 0) semitones += 12;

  const intervalMap: Record<number, string> = {
    0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
  };
  return intervalMap[semitones] || '?';
};

export const getFrequency = (stringIndex: number, fret: number): string => {
  const openStringMidi = [64, 59, 55, 50, 45, 40];
  const midiNote = openStringMidi[stringIndex] + fret;
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
  return frequency.toFixed(1);
};

export const getScientificPitch = (stringIndex: number, fret: number): string => {
   const openStringMidi = [64, 59, 55, 50, 45, 40];
   const midiNote = openStringMidi[stringIndex] + fret;
   const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
   const note = noteNames[midiNote % 12];
   const octave = Math.floor(midiNote / 12) - 1;
   return `${note}${octave}`;
}

export const getFullIntervalName = (shortName: string | undefined): string => {
  if (!shortName) return '';
  const map: Record<string, string> = {
    'R': 'Root (根音)',
    'b2': 'Minor 2nd (小二度)',
    '2': 'Major 2nd (大二度)',
    'b3': 'Minor 3rd (小三度)',
    '3': 'Major 3rd (大三度)',
    '4': 'Perfect 4th (纯四度)',
    'b5': 'Diminished 5th (减五度)',
    '5': 'Perfect 5th (纯五度)',
    'b6': 'Minor 6th (小六度)',
    '6': 'Major 6th (大六度)',
    'b7': 'Minor 7th (小七度)',
    '7': 'Major 7th (大七度)'
  };
  return map[shortName] || shortName;
};

// ========== 和弦音阶匹配练习 ==========

// 扩展音阶定义（包含教会调式等，用于和弦音阶匹配练习）
export interface ExtendedScale {
  name: string;        // 显示名称
  nameZh: string;      // 中文名称
  intervals: number[]; // 半音音程
}

export const EXTENDED_SCALES: Record<string, ExtendedScale> = {
  'Ionian':          { name: 'Ionian',          nameZh: '大调',       intervals: [0, 2, 4, 5, 7, 9, 11] },
  'Dorian':          { name: 'Dorian',          nameZh: '多利亚',     intervals: [0, 2, 3, 5, 7, 9, 10] },
  'Phrygian':        { name: 'Phrygian',        nameZh: '弗里几亚',   intervals: [0, 1, 3, 5, 7, 8, 10] },
  'Lydian':          { name: 'Lydian',          nameZh: '利底亚',     intervals: [0, 2, 4, 6, 7, 9, 11] },
  'Mixolydian':      { name: 'Mixolydian',      nameZh: '混合利底亚', intervals: [0, 2, 4, 5, 7, 9, 10] },
  'Aeolian':         { name: 'Aeolian',         nameZh: '自然小调',   intervals: [0, 2, 3, 5, 7, 8, 10] },
  'Locrian':         { name: 'Locrian',         nameZh: '洛克里亚',   intervals: [0, 1, 3, 5, 6, 8, 10] },
  'MajorPentatonic': { name: 'Major Pentatonic', nameZh: '大调五声',  intervals: [0, 2, 4, 7, 9] },
  'MinorPentatonic': { name: 'Minor Pentatonic', nameZh: '小调五声',  intervals: [0, 3, 5, 7, 10] },
  'Blues':           { name: 'Blues',            nameZh: '蓝调',       intervals: [0, 3, 5, 6, 7, 10] },
};

// 和弦质量 → 最佳匹配音阶的映射规则
// 每个和弦质量对应一个"正确答案"音阶（根音相同）
const CHORD_SCALE_MAP: Record<ChordQuality, string> = {
  'major':    'Ionian',
  'minor':    'Dorian',
  'dominant7': 'Mixolydian',
  'minor7':   'Dorian',
  'maj7':     'Ionian',
  'dim':      'Locrian',
  'aug':      'Lydian',
  'sus4':     'Mixolydian',
  'sus2':     'Ionian',
  'm7b5':     'Locrian',
};

// 和弦质量 → 用于生成干扰项的候选音阶池
const DISTRACTOR_POOLS: Record<ChordQuality, string[]> = {
  'major':    ['Mixolydian', 'Lydian', 'Dorian', 'Aeolian', 'MajorPentatonic'],
  'minor':    ['Aeolian', 'Phrygian', 'MinorPentatonic', 'Blues', 'Locrian'],
  'dominant7': ['Ionian', 'Dorian', 'Blues', 'Lydian', 'Phrygian'],
  'minor7':   ['Aeolian', 'Phrygian', 'MinorPentatonic', 'Blues', 'Locrian'],
  'maj7':     ['Lydian', 'Mixolydian', 'Dorian', 'Aeolian', 'MajorPentatonic'],
  'dim':      ['Aeolian', 'Phrygian', 'Dorian', 'MinorPentatonic', 'Blues'],
  'aug':      ['Ionian', 'Mixolydian', 'Dorian', 'Phrygian', 'MajorPentatonic'],
  'sus4':     ['Ionian', 'Dorian', 'Lydian', 'Aeolian', 'MajorPentatonic'],
  'sus2':     ['Lydian', 'Mixolydian', 'Dorian', 'Aeolian', 'MajorPentatonic'],
  'm7b5':     ['Aeolian', 'Phrygian', 'Dorian', 'MinorPentatonic', 'Blues'],
};

// 和弦题库：常见和弦及其质量
interface ChordEntry {
  name: string;
  root: NoteName;
  quality: ChordQuality;
}

const CHORD_POOL: ChordEntry[] = [
  // 大三和弦
  { name: 'C', root: 'C', quality: 'major' },
  { name: 'D', root: 'D', quality: 'major' },
  { name: 'E', root: 'E', quality: 'major' },
  { name: 'F', root: 'F', quality: 'major' },
  { name: 'G', root: 'G', quality: 'major' },
  { name: 'A', root: 'A', quality: 'major' },
  // 小三和弦
  { name: 'Dm', root: 'D', quality: 'minor' },
  { name: 'Em', root: 'E', quality: 'minor' },
  { name: 'Am', root: 'A', quality: 'minor' },
  { name: 'Bm', root: 'B', quality: 'minor' },
  // 属七和弦
  { name: 'C7', root: 'C', quality: 'dominant7' },
  { name: 'D7', root: 'D', quality: 'dominant7' },
  { name: 'E7', root: 'E', quality: 'dominant7' },
  { name: 'G7', root: 'G', quality: 'dominant7' },
  { name: 'A7', root: 'A', quality: 'dominant7' },
  // 小七和弦
  { name: 'Dm7', root: 'D', quality: 'minor7' },
  { name: 'Em7', root: 'E', quality: 'minor7' },
  { name: 'Am7', root: 'A', quality: 'minor7' },
  { name: 'Bm7', root: 'B', quality: 'minor7' },
  // 大七和弦
  { name: 'Cmaj7', root: 'C', quality: 'maj7' },
  { name: 'Dmaj7', root: 'D', quality: 'maj7' },
  { name: 'Emaj7', root: 'E', quality: 'maj7' },
  // 半减七
  { name: 'Bm7b5', root: 'B', quality: 'm7b5' },
];

// 工具函数：随机打乱数组
const shuffleArray = <T>(arr: T[]): T[] => {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

// 构建一个选项
const buildOption = (root: NoteName, scaleKey: string): ChordScaleOption => {
  const scale = EXTENDED_SCALES[scaleKey];
  return {
    key: `${root}-${scaleKey}`,
    label: `${root} ${scale.name} (${scale.nameZh})`,
    rootNote: root,
    intervals: scale.intervals,
  };
};

// 根据音阶音程获取音符列表（用于指板高亮）
export const getScaleNotesFromIntervals = (root: NoteName, intervals: number[]): NoteName[] => {
  const rootIndex = ALL_NOTES.indexOf(root);
  return intervals.map(interval => ALL_NOTES[(rootIndex + interval) % 12]);
};

// 生成一道和弦音阶匹配题
export const generateChordScaleQuestion = (excludeChordName?: string): ChordScaleQuestion => {
  // 从题库中随机选一个和弦（排除上一题）
  let pool = CHORD_POOL;
  if (excludeChordName) {
    pool = pool.filter(c => c.name !== excludeChordName);
  }
  const chord = pool[Math.floor(Math.random() * pool.length)];

  // 正确答案
  const correctScaleKey = CHORD_SCALE_MAP[chord.quality];
  const correctOption = buildOption(chord.root, correctScaleKey);

  // 生成3个干扰项
  const distractorPool = DISTRACTOR_POOLS[chord.quality].filter(s => s !== correctScaleKey);
  const selectedDistractors = shuffleArray(distractorPool).slice(0, 3);
  const distractorOptions = selectedDistractors.map(scaleKey => buildOption(chord.root, scaleKey));

  // 合并并打乱选项
  const options = shuffleArray([correctOption, ...distractorOptions]);

  return {
    chordName: chord.name,
    chordRoot: chord.root,
    chordQuality: chord.quality,
    correctAnswer: correctOption.key,
    options,
  };
};
