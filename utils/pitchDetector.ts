
/**
 * 吉他音高检测引擎 - 基于 pitchy (McLeod Pitch Method)
 * 通过麦克风收音，实时检测吉他弹奏的单音音高
 */

import { NoteName } from '../types';
import { getAudioCtx } from './audioFeedback';
import { PitchDetector as PitchyDetector } from 'pitchy';

const ALL_NOTES: NoteName[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** 检测结果 */
export interface PitchResult {
  note: NoteName;    // 音名
  octave: number;    // 八度
  frequency: number; // 实际频率 (Hz)
  confidence: number; // 置信度 (0-1)
}

/** 麦克风状态 */
export type MicStatus = 'idle' | 'listening' | 'error';

/**
 * 音高检测器
 * 使用 pitchy 库（McLeod Pitch Method）从麦克风音频流中提取基频
 */
export class PitchDetector {
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private rafId: number | null = null;
  private running = false;
  private detector: PitchyDetector<Float32Array> | null = null;
  private inputBuffer: Float32Array | null = null;

  // 稳定性检测：连续多帧检测到同一音符才触发
  private lastDetectedMidi: number = -1;
  private stableCount: number = 0;
  private lastTriggeredMidi: number = -1;

  // 回调
  public onNoteDetected: ((result: PitchResult) => void) | null = null;
  public onStatusChange: ((status: MicStatus) => void) | null = null;

  // 参数
  private readonly FFT_SIZE = 4096;
  private readonly CLARITY_THRESHOLD = 0.85;  // pitchy clarity 阈值
  private readonly STABLE_FRAMES = 3;         // 稳定帧数
  private readonly MIN_FREQ = 75;             // 最低检测频率 (Hz)
  private readonly MAX_FREQ = 1200;           // 最高检测频率 (Hz)

  /**
   * 启动音高检测（接收外部已获取的 MediaStream）
   */
  startWithStream(stream: MediaStream): void {
    if (this.running) return;

    try {
      this.mediaStream = stream;

      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // 创建音频分析节点
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;

      // 连接麦克风到分析器（不连接到 destination，避免回放）
      this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      // 创建 pitchy 检测器
      this.detector = PitchyDetector.forFloat32Array(this.analyser.fftSize);
      this.inputBuffer = new Float32Array(this.analyser.fftSize);

      this.running = true;
      this.lastDetectedMidi = -1;
      this.stableCount = 0;
      this.lastTriggeredMidi = -1;
      this.onStatusChange?.('listening');

      // 启动检测循环
      this.detectLoop();
    } catch (err) {
      console.error('[音高检测] 启动失败:', err);
      this.onStatusChange?.('error');
    }
  }

  /**
   * 停止检测，释放资源
   */
  stop(): void {
    this.running = false;

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.analyser = null;
    this.detector = null;
    this.inputBuffer = null;
    this.onStatusChange?.('idle');
  }

  /**
   * 重置已触发的音符记录（切换目标音符时调用）
   */
  resetTriggered(): void {
    this.lastTriggeredMidi = -1;
    this.lastDetectedMidi = -1;
    this.stableCount = 0;
  }

  /**
   * 检测循环 - 每帧分析音频数据
   */
  private detectLoop = (): void => {
    if (!this.running || !this.analyser || !this.detector || !this.inputBuffer) return;

    this.analyser.getFloatTimeDomainData(this.inputBuffer);

    const [pitch, clarity] = this.detector.findPitch(this.inputBuffer, getAudioCtx().sampleRate);

    // clarity 足够高且频率在吉他范围内
    if (clarity >= this.CLARITY_THRESHOLD && pitch >= this.MIN_FREQ && pitch <= this.MAX_FREQ) {
      const result = this.frequencyToNote(pitch, clarity);
      this.handleDetection(result);
    } else {
      // 无效检测时重置稳定计数
      this.stableCount = 0;
      this.lastDetectedMidi = -1;
    }

    this.rafId = requestAnimationFrame(this.detectLoop);
  };

  /**
   * 频率转音符
   */
  private frequencyToNote(frequency: number, confidence: number): PitchResult {
    const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
    const noteIndex = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;

    return {
      note: ALL_NOTES[noteIndex],
      octave,
      frequency,
      confidence,
    };
  }

  /**
   * 处理检测结果 - 稳定性过滤
   */
  private handleDetection(result: PitchResult): void {
    const midiNote = Math.round(12 * Math.log2(result.frequency / 440) + 69);

    if (midiNote === this.lastDetectedMidi) {
      this.stableCount++;
    } else {
      this.lastDetectedMidi = midiNote;
      this.stableCount = 1;
    }

    // 连续检测到同一音符达到稳定帧数，且不是刚触发过的同一个音
    if (this.stableCount >= this.STABLE_FRAMES && midiNote !== this.lastTriggeredMidi) {
      this.lastTriggeredMidi = midiNote;
      this.onNoteDetected?.(result);
    }
  }
}
