
/**
 * 吉他音色合成引擎 - 基于 Web Audio API
 * 通过多谐波叠加 + ADSR包络 + 低通滤波器模拟真实吉他音色
 */

let audioCtx: AudioContext | null = null;
let isAudioUnlocked = false;

// 全局静音开关，从 localStorage 读取
let _muted: boolean = localStorage.getItem('stringglow_muted') === 'true';

export const isMuted = () => _muted;

export const setMuted = (muted: boolean) => {
  _muted = muted;
  localStorage.setItem('stringglow_muted', String(muted));
};

/**
 * 获取或创建 AudioContext
 * 注意：iOS 上必须在用户交互后才能正常播放
 */
export const getAudioCtx = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
};

/**
 * 解锁移动端音频 - 必须在用户交互事件中同步调用
 * iOS Safari 要求：
 * 1. AudioContext 必须在用户交互中创建或恢复
 * 2. 必须播放一个实际的音频节点（不能是空 buffer）
 */
export const unlockAudio = () => {
  if (isAudioUnlocked) return;

  const ctx = getAudioCtx();

  // iOS 需要在用户交互中恢复 suspended 状态的 AudioContext
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  // 播放一个极短的静音振荡器来解锁音频
  // 使用 OscillatorNode 比空 buffer 更可靠
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  gain.gain.value = 0.001; // 几乎静音
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(0);
  osc.stop(ctx.currentTime + 0.001);

  isAudioUnlocked = true;
  console.log('[音频] iOS 音频已解锁, AudioContext state:', ctx.state);
};

/**
 * 吉他泛音结构定义
 * 每个泛音由 [倍频系数, 相对振幅] 组成
 * 模拟钢弦吉他的频谱特征：基频最强，高次泛音逐渐衰减但保留明亮感
 */
const GUITAR_HARMONICS: [number, number][] = [
  [1, 1.0],      // 基频
  [2, 0.5],      // 二次泛音
  [3, 0.35],     // 三次泛音
  [4, 0.15],     // 四次泛音
  [5, 0.08],     // 五次泛音
  [6, 0.04],     // 六次泛音
];

/**
 * 吉他 ADSR 包络参数
 * 拨弦乐器特征：极快的起音、短促的衰减、较低的持续、自然的释放
 */
const GUITAR_ENVELOPE = {
  attack: 0.005,    // 起音时间（秒）- 拨弦瞬间
  decay: 0.25,      // 衰减时间（秒）- 从峰值到持续电平
  sustain: 0.45,    // 持续电平（相对峰值的比例）
  release: 2.5,     // 释放时间（秒）- 音符自然消亡
};

/**
 * 播放单个吉他音符
 * @param frequency 基频（Hz）
 * @param volume 音量（0-1）
 * @param startTime 开始时间（AudioContext时间），默认立即播放
 */
const playGuitarNote = (frequency: number, volume: number = 0.18, startTime?: number, envelopeOverride?: typeof GUITAR_ENVELOPE) => {
  if (_muted) return;
  const ctx = getAudioCtx();

  // 确保 AudioContext 处于运行状态
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const now = startTime ?? ctx.currentTime;
  const { attack, decay, sustain, release } = envelopeOverride ?? GUITAR_ENVELOPE;
  const totalDuration = attack + decay + release + 0.1;

  // 主增益节点 - 控制总音量
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0, now);

  // 低通滤波器 - 模拟琴体共鸣，削去过于尖锐的高频
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  // 滤波器截止频率随音高变化：低音更闷，高音更亮
  const cutoff = Math.min(frequency * 6, 8000);
  filter.frequency.setValueAtTime(cutoff, now);
  // 起音瞬间滤波器打开更多高频，模拟拨弦的明亮感
  filter.frequency.setValueAtTime(cutoff * 1.5, now);
  filter.frequency.exponentialRampToValueAtTime(cutoff * 0.6, now + decay + release);
  filter.Q.setValueAtTime(1.2, now);

  // ADSR 包络
  masterGain.gain.linearRampToValueAtTime(volume, now + attack);                          // Attack
  masterGain.gain.exponentialRampToValueAtTime(volume * sustain, now + attack + decay);    // Decay
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + attack + decay + release);    // Release

  // 创建多个振荡器叠加泛音
  const oscillators: OscillatorNode[] = [];
  GUITAR_HARMONICS.forEach(([multiplier, amplitude]) => {
    const osc = ctx.createOscillator();
    const harmonicGain = ctx.createGain();

    // 基频用三角波（接近吉他基音），高次泛音用正弦波
    osc.type = multiplier === 1 ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(frequency * multiplier, now);

    // 给高次泛音加微小的频率抖动，增加自然感
    if (multiplier > 1) {
      const detune = (Math.random() - 0.5) * 4; // ±2 cents
      osc.detune.setValueAtTime(detune, now);
    }

    harmonicGain.gain.setValueAtTime(amplitude, now);
    // 高次泛音衰减更快，模拟真实弦振动特征
    harmonicGain.gain.exponentialRampToValueAtTime(
      amplitude * 0.01,
      now + totalDuration * (1 / multiplier)
    );

    osc.connect(harmonicGain);
    harmonicGain.connect(filter);

    osc.start(now);
    osc.stop(now + totalDuration);
    oscillators.push(osc);
  });

  // 拨弦噪声 - 模拟手指/拨片触弦的瞬态噪声
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  for (let i = 0; i < noiseData.length; i++) {
    noiseData[i] = (Math.random() * 2 - 1) * 0.3;
  }
  const noiseSource = ctx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(volume * 0.4, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'bandpass';
  noiseFilter.frequency.setValueAtTime(frequency * 2, now);
  noiseFilter.Q.setValueAtTime(2, now);
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseSource.start(now);
  noiseSource.stop(now + 0.04);

  filter.connect(masterGain);
  masterGain.connect(ctx.destination);
};

/**
 * 根据弦号和品位计算频率
 * 标准调弦 MIDI 编号：E4=64, B3=59, G3=55, D3=50, A2=45, E2=40
 */
const getMidiFrequency = (stringIndex: number, fret: number): number => {
  const openStringMidi = [64, 59, 55, 50, 45, 40];
  const midiNote = openStringMidi[stringIndex] + fret;
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

/**
 * 播放指板上单个音符的吉他音色
 */
export const playNoteSound = (stringIndex: number, fret: number) => {
  const freq = getMidiFrequency(stringIndex, fret);
  // 低音弦稍微降低音量，避免低频过于轰鸣
  const volume = stringIndex >= 4 ? 0.14 : 0.18;
  playGuitarNote(freq, volume);
};

/**
 * 播放和弦 - 模拟扫弦效果，从低音弦到高音弦依次拨响
 * @param notes 和弦中的音符数组
 * @param strumSpeed 扫弦速度（秒），每根弦之间的间隔
 */
export const playChordSound = (
  notes: { stringIndex: number; fret: number }[],
  strumSpeed: number = 0.03
) => {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // 按弦号从高到低排序（低音弦先响），模拟下扫弦
  const sorted = [...notes].sort((a, b) => b.stringIndex - a.stringIndex);

  const chordEnvelope = {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.5,
    release: 3.0,
  };

  sorted.forEach((note, i) => {
    const freq = getMidiFrequency(note.stringIndex, note.fret);
    const volume = note.stringIndex >= 4 ? 0.10 : 0.13;
    playGuitarNote(freq, volume, now + i * strumSpeed, chordEnvelope);
  });
};

// === 练习模式音效（保留简洁的反馈音） ===

export const playCorrectSound = (stringIndex: number, fret: number) => {
  // 正确时播放该音符的吉他音色，使用更长的包络让音符更饱满
  const freq = getMidiFrequency(stringIndex, fret);
  const volume = stringIndex >= 4 ? 0.14 : 0.18;
  playGuitarNote(freq, volume, undefined, {
    attack: 0.005,
    decay: 0.3,
    sustain: 0.55,
    release: 3.0,
  });
};

export const playIncorrectSound = () => {
  if (_muted) return;
  const ctx = getAudioCtx();
  const now = ctx.currentTime;
  // 错误反馈：短促的低沉闷响
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(110, now);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.15);
};

export const playSuccessSound = () => {
  // 完成时播放一个 C 大三和弦的扫弦
  playChordSound([
    { stringIndex: 4, fret: 3 },  // C
    { stringIndex: 3, fret: 2 },  // E
    { stringIndex: 2, fret: 0 },  // G
    { stringIndex: 1, fret: 1 },  // C
    { stringIndex: 0, fret: 0 },  // E
  ], 0.04);
};
