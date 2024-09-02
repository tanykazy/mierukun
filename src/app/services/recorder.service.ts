import { Injectable } from '@angular/core';
import { SafeHtml } from '@angular/platform-browser';

import { marked } from 'marked';


/**
 * 記録の発生イベント
 * 記録の開始 -- 'START'
 * 記録の終了 -- 'END'
 */
export type Event = 'START' | 'END';

/**
 * レコード
 * ボタンが押されるごとに発生する
 */
export interface Record {
  kind: string; // 記録の種別
  event: Event; // 記録の発生イベント
  time: Date; // 記録発生時刻
  audio?: Blob; // 記録のオーディオデータ
  text?: string; // 記録のテキストデータ
}

export interface RecordView {
  kind: string; // 記録の種別
  start: Date; // 記録発生時刻
  end: Date; // 記録発生時刻
  audio?: Blob; // 記録のオーディオデータ
  blobUrl?: string;
  text?: string; // 記録のテキストデータ
  html?: SafeHtml; // 記録のHTMLデータ
}

/**
 * 記録種別ごとの合計時間
 */
interface Total {
  time: number; // 合計時間
  lastTime: number; // 直前の記録発生時刻
}

@Injectable({
  providedIn: 'root'
})
export class RecorderService {
  constructor() {
    this.isAudioAvailable = false;
    this.chunks = new Array<Blob>();
    this.grade = 0;
  }

  public records = new Array<Record>();
  private total = new Map<string, Total>();
  public grade: number;
  public subject!: string;

  public isAudioAvailable: boolean;
  public stream: MediaStream | undefined;
  private options = {
    mimeType: 'audio/webm',
    audioBitsPerSecond: '64000',
  };
  private mediaRecorder!: MediaRecorder;
  private chunks!: Array<Blob>;

  /**
   * イベントを記録する
   * @param {Record} data - 記録
   */
  public record(data: Record): void {
    // 記録を追加
    this.records.push(data);

    // イベント種別に対応する現在の合計時間を取得する
    let total = this.total.get(data.kind);
    if (!total) {
      // 合計時間の記録がない場合、空の合計時間を作成する
      total = {
        time: 0,
        lastTime: 0
      };
    }

    // イベントに応じて合計時間を計算する
    switch (data.event) {
      case 'START':
        total.lastTime = data.time.getTime();

        break;

      case 'END':
        const time = data.time.getTime() - total.lastTime;
        total.time = total.time + time;
        total.lastTime = NaN;

        break;

      default:
        throw new Error('未定義のイベント');
    }

    // 合計時間を更新
    this.total.set(data.kind, total);
  }

  /**
   * 指定した種別の現在の合計時間を返す
   * @param {string} kind - 種別
   * @returns {number} 合計時間
   */
  public getTotal(kind: string): number {
    if (!this.total.has(kind)) {
      console.error(`${kind} は登録されていません`);
    }
    return this.total.get(kind)?.time || 0;
  }

  /**
   * すべての種別の現在の合計時間を返す
   * 終了していないイベントは現在時刻までの時間を仮に設定する
   * @returns {Map<string, number>} 全種別の合計時間
   */
  public getAllTotal(): Map<string, number> {
    const all = new Map<string, number>();
    for (const [kind, total] of this.total) {
      let time = total.time;
      if (!isNaN(total.lastTime)) {
        const now = Date.now();
        time = time + now - total.lastTime;
      }
      all.set(kind, time);
    }
    return all;
  }

  public async getAllRecordView(): Promise<Array<RecordView>> {
    const recordView = new Array<RecordView>();
    for (let i = 0; i < this.records.length; i++) {
      if (this.records[i].event === 'START') {
        if (i + 1 < this.records.length) {
          if (this.records[i].kind === this.records[i + 1].kind
            && this.records[i + 1].event === 'END') {
            const view = {
              kind: this.records[i].kind,
              start: this.records[i].time,
              end: this.records[i + 1].time,
              audio: this.records[i + 1].audio,
              text: this.records[i + 1].text,
              blobUrl: this.records[i + 1].audio ? window.URL.createObjectURL(this.records[i + 1].audio as Blob) : undefined,
              html: await marked(this.records[i + 1].text || '')
            };
            recordView.push(view);
          }
        }
      }
    }
    return recordView;
  }

  /**
   * csvフォーマットで書き出す
   * @returns {URL|undefined} csvデータのURL
   */
  public export2csv(): URL | undefined {
    if (this.records.length === 0) {
      console.error('記録がありません');
      return;
    }

    // カンマ区切りのCSVに変換する
    const csv = json2csv(this.records, ',');

    const blob = new Blob([csv], {
      type: 'text/csv;charset=utf-8;'
    });

    return new URL(window.URL.createObjectURL(blob));
  }

  public requestRecordAudio() {
    if (!this.isAudioAvailable) {
      return;
    }

    if (!this.stream) {
      throw new Error('stream is undefined')
    }

    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.requestData();
    }
  }

  public startRecordAudio(handler: (blob: Blob) => void) {
    if (!this.isAudioAvailable) {
      return;
    }

    if (!this.stream) {
      throw new Error('stream is undefined')
    }

    this.mediaRecorder = new MediaRecorder(this.stream);

    this.mediaRecorder.ondataavailable = async (event: BlobEvent) => {
      this.chunks.push(event.data);
    };

    this.mediaRecorder.onstop = async (event) => {
      const blob = new Blob(this.chunks, {
        type: this.mediaRecorder.mimeType
      });

      this.chunks = new Array<Blob>();

      handler(blob);
    };

    if (this.mediaRecorder.state === 'inactive') {
      this.mediaRecorder.start();
    }
  }

  public stopRecordAudio() {
    if (!this.isAudioAvailable) {
      return;
    }

    if (!this.stream) {
      throw new Error('stream is undefined')
    }

    if (this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
  }

  public enableAudio(): void {
    const constraints = {
      audio: true
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream: MediaStream) => {
        this.stream = stream;
      });

    this.isAudioAvailable = true;
  }

  public disableAudio(): void {
    this.stream = undefined;
    this.isAudioAvailable = false;
  }
}

/**
 * オブジェクトをcsvフォーマットされた文字列に変換する
 * @param {Array<Record>} json - jsonに変換可能なオブジェクト
 * @param delimiter - 区切り文字
 * @returns {string} csvフォーマットされた文字列
 */
function json2csv(json: Array<Record>, delimiter: ',' | '\t'): string {
  const header = Object.keys(json[0]).join(delimiter) + '\n';
  const body = json.map((d: any) => {
    return Object.keys(d).map((key: string) => {
      return d[key];
    }).join(delimiter);
  }).join('\n');
  return header + body;
}
