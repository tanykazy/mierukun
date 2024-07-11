import { Component, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';

import { GeminiService } from '../../services/gemini.service';
import { RecorderService, Event } from '../../services/recorder.service';
import { ButtonComponent, ClickButton } from '../button/button.component';


/** コンポーネント外部に送出するイベントの引数 */
export interface ClickButtonset {
  // ボタンの名前
  button: string;
  // イベント種別
  event: Event;
  // イベント発生時間 Date.now() の返値
  time: Date;
}

@Component({
  selector: 'app-buttonset',
  templateUrl: './buttonset.component.html',
  styleUrls: ['./buttonset.component.css']
})
export class ButtonsetComponent implements OnDestroy {
  constructor(
    private geminiService: GeminiService,
    private recorderService: RecorderService
  ) {
    this.chunks = new Array<Blob>();
  }

  public stream: MediaStream | undefined;
  private mediaRecorder!: MediaRecorder;
  private chunks!: Array<Blob>;

  @ViewChildren(ButtonComponent) buttons!: QueryList<ButtonComponent>;

  // コンポーネント外部から設定されるボタン名のリスト
  // コンポーネント内部で使用するためにMapに登録する
  @Input() buttonset: Array<string> = [];

  // ボタンを複数同時に有効化できるか
  @Input() multiple!: boolean;

  // ボタンが押されたときに発火するイベント
  @Output() clickButtonset = new EventEmitter<ClickButtonset>();

  ngOnDestroy(): void {
    this.deactiveAll();
  }

  /**
   * ボタンがクリックされたときに呼び出されるイベントハンドラ
   * @param {UIEvent} event - DOMのイベントオブジェクト
   * @param {string} button - クリックされたボタンの名前 
   */
  public onClickButton(event: ClickButton): void {
    // 現在時刻
    const now = new Date();

    // 同時に複数のボタンを有効化できない設定の場合、有効化されたボタンを終了する
    if (!this.multiple) {
      this.buttons.forEach((button) => {
        if (button.name !== event.name && button.state) {
          button.state = false;

          this.clickButtonset.emit({
            button: button.name,
            event: 'END',
            time: now
          });

          this.recorderService.stopRecordAudio();
        }
      });
    }

    this.clickButtonset.emit({
      button: event.name,
      event: event.state ? 'START' : 'END',
      time: now
    });

    if (event.state) {
      this.recorderService.startRecordAudio(this.stopRecorderHandler.bind(this));
    } else {
      this.recorderService.stopRecordAudio();
    }
  }

  /**
   * すべてのボタンをOFFにする
   */
  public deactiveAll(): void {
    const now = new Date();
    this.buttons.forEach((button) => {
      if (button.state) {
        button.state = false;

        this.clickButtonset.emit({
          button: button.name,
          event: 'END',
          time: now
        });
      }
    });

    this.recorderService.stopRecordAudio();
  }

  private async stopRecorderHandler(blob: Blob): Promise<void> {
    // console.log(blob);
    const response = await this.geminiService.generateContent(window.localStorage.getItem('API_KEY') || '', [
      await GeminiService.blobToGenerativePart(blob, 'audio/mpeg'), {
        // text: '会話の内容をまとめてください。'
        // text: '会話を文字起こししてください。'
        // text: '会話の概要をまとめてください。'
        text: window.localStorage.getItem('PROMPT'),
      }
    ]);
    console.log(response);

    const text = response.candidates[0].content.parts[0].text;
    console.log(text);

    let lastRecord;
    for (let i = this.recorderService.records.length - 1; i >= 0; i--) {
      lastRecord = this.recorderService.records[i];
      if (lastRecord.event === 'END') {
        break;
      }
    }
    if (lastRecord) {
      lastRecord.audio = blob;
      lastRecord.text = text;
    }
    // console.log(this.recorderService.records);
  }
}
