
/**
 * 吉他音高检测引擎 - 基于 Web Audio API + Autocorrelation 算法
 * 通过麦克风收音，实时检测吉他弹奏的单音音高
 */

import { NoteName } from '../types';
import { getAudioCtx } from './audioFeedback';

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
 * 使用 Autocorrelation（自相关）算法从麦克风音频流中提取基频
 */
export class PitchDetector {
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private rafId: number | null = null;
  private running = false;

  // 稳定性检测：连续多帧检测到同一音符才触发
  private lastDetectedMidi: number = -1;
  private stableCount: number = 0;
  private lastTriggeredMidi: number = -1;

  // 回调
  public onNoteDetected: ((result: PitchResult) => void) | null = null;
  public onStatusChange: ((status: MicStatus) => void) | null = null;

  // 参数
  private readonly FFT_SIZE = 4096;
  private readonly RMS_THRESHOLD = 0.015;    // 噪音门限
  private readonly STABLE_FRAMES = 3;        // 稳定帧数
  private readonly MIN_FREQ = 75;            // 最低检测频率 (Hz)，覆盖 E2≈82Hz，留余量
  private readonly MAX_FREQ = 1200;          // 最高检测频率 (Hz)，覆盖 12 品 E5
  private readonly CONFIDENCE_THRESHOLD = 0.9; // 自相关置信度阈值

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
   * 启动麦克风收音和音高检测（内部请求权限，桌面端使用）
   */
  async start(): Promise<void> {
    if (this.running) return;

    try {
      // 请求麦克风权限
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      const ctx = getAudioCtx();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // 创建音频分析节点
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;

      // 连接麦克风到分析器（不连接到 destination，避免回放）
      this.sourceNode = ctx.createMediaStreamSource(this.mediaStream);
      this.sourceNode.connect(this.analyser);

      this.running = true;
      this.lastDetectedMidi = -1;
      this.stableCount = 0;
      this.lastTriggeredMidi = -1;
      this.onStatusChange?.('listening');

      // 启动检测循环
      this.detectLoop();
    } catch (err) {
      console.error('[音高检测] 麦克风启动失败:', err);
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
    if (!this.running || !this.analyser) return;

    const bufferLength = this.analyser.fftSize;
    const buffer = new Float32Array(bufferLength);
    this.analyser.getFloatTimeDomainData(buffer);

    // 计算 RMS（均方根），判断是否有足够音量
    const rms = this.calculateRMS(buffer);

    if (rms > this.RMS_THRESHOLD) {
      const result = this.detectPitch(buffer, getAudioCtx().sampleRate);
      if (result) {
        this.handleDetection(result);
      }
    } else {
      // 静音时重置稳定计数
      this.stableCount = 0;
      this.lastDetectedMidi = -1;
    }

    this.rafId = requestAnimationFrame(this.detectLoop);
  };

  /**
   * 计算音频信号的 RMS（均方根）
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Autocorrelation 音高检测算法
   * 通过自相关函数找到信号的基本周期，从而确定基频
   */
  private detectPitch(buffer: Float32Array, sampleRate: number): PitchResult | null {
    const n = buffer.length;

    // 根据频率范围计算搜索的周期范围（以采样点为单位）
    const minPeriod = Math.floor(sampleRate / this.MAX_FREQ);
    const maxPeriod = Math.floor(sampleRate / this.MIN_FREQ);

    // 计算归一化自相关函数
    let bestCorrelation = 0;
    let bestPeriod = 0;

    for (let period = minPeriod; period <= maxPeriod && period < n; period++) {
      let correlation = 0;
      let norm1 = 0;
      let norm2 = 0;

      // 使用信号的前半部分计算，避免边界效应
      const len = Math.min(n - period, n / 2);
      for (let i = 0; i < len; i++) {
        correlation += buffer[i] * buffer[i + period];
        norm1 += buffer[i] * buffer[i];
        norm2 += buffer[i + period] * buffer[i + period];
      }

      // 归一化
      const normFactor = Math.sqrt(norm1 * norm2);
      if (normFactor > 0) {
        correlation /= normFactor;
      }

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }

    // 置信度不够，丢弃
    if (bestCorrelation < this.CONFIDENCE_THRESHOLD || bestPeriod === 0) {
      return null;
    }

    // 抛物线插值，提高频率精度
    const refinedPeriod = this.parabolicInterpolation(buffer, bestPeriod, sampleRate);
    const frequency = sampleRate / refinedPeriod;

    // 频率转 MIDI 音符号
    const midiNote = Math.round(12 * Math.log2(frequency / 440) + 69);
    const noteIndex = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;

    return {
      note: ALL_NOTES[noteIndex],
      octave,
      frequency,
      confidence: bestCorrelation,
    };
  }

  /**
   * 抛物线插值 - 在自相关峰值附近做二次插值，提高周期估计精度
   */
  private parabolicInterpolation(buffer: Float32Array, period: number, sampleRate: number): number {
    const n = buffer.length;
    if (period <= 1 || period >= n - 1) return period;

    // 计算 period-1, period, period+1 三个点的自相关值
    const calcCorr = (p: number): number => {
      let corr = 0;
      const len = Math.min(n - p, n / 2);
      for (let i = 0; i < len; i++) {
        corr += buffer[i] * buffer[i + p];
      }
      return corr;
    };

    const y0 = calcCorr(period - 1);
    const y1 = calcCorr(period);
    const y2 = calcCorr(period + 1);

    // 抛物线顶点偏移
    const denominator = 2 * (2 * y1 - y0 - y2);
    if (Math.abs(denominator) < 1e-10) return period;

    const shift = (y0 - y2) / denominator;
    return period + shift;
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
