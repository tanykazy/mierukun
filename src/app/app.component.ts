import { Component, OnInit, ViewChild } from '@angular/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { marked } from 'marked';

import { ClickButtonset } from './components/buttonset/buttonset.component';
import { KokubanChartComponent } from './components/kokuban-chart/kokuban-chart.component';
import { RecorderService } from './services/recorder.service';
import { GeminiService } from './services/gemini.service';


export const SEARCHPARAM_KEY_BUTTON = 'b';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  constructor(
    private geminiService: GeminiService,
    public recorderService: RecorderService
  ) { }

  @ViewChild(KokubanChartComponent) kokubanChart!: KokubanChartComponent;

  ngOnInit(): void {
    window.addEventListener('beforeunload', this.onBeforeunload);

    const url = new URL(document.location.href);
    if (url.searchParams.has(SEARCHPARAM_KEY_BUTTON)) {
      const buttons = url.searchParams.getAll(SEARCHPARAM_KEY_BUTTON);
      this.buttonset = buttons;
      this.selectedIndex = 1;
    }
  }

  title = '（仮）みえるくん';
  textValue: string = '';
  selectedIndex: number = 0;
  isButtonEditable: boolean = true;

  treeData = new Map<string, number>();

  // app-buttonset コンポーネントへの入力
  // ボタンの文字列の配列
  public buttonset: string[] = [
    '説明',
    'やりとり',
    '声かけ'
  ];

  onSelectionChange(event: StepperSelectionEvent): void {
    console.log(event);
    if (event.selectedIndex === 1) {
      console.log('selectedIndex:', event.selectedIndex);
    }

    const total = this.recorderService.getAllTotal();
    this.treeData = total;
  }

  /**
   * ボタンがクリックされたときに呼び出されるイベントハンドラ 
   * @param {ClickButtonset} event - クリックされたボタンの情報
   */
  public onClickButtonset(event: ClickButtonset): void {
    console.debug(event);
    this.recorderService.record({
      kind: event.button,
      event: event.event,
      time: event.time
    });

    this.isButtonEditable = false;
  }

  public onClickStartRecording(event: UIEvent): void {
    console.log('start recording');
    this.recorderService.startRecordAudio(this.stopRecorderHandler.bind(this));
  }

  public onClickStopRecording(event: UIEvent): void {
    console.log('stop recording');
    this.recorderService.stopRecordAudio();
  }

  private async stopRecorderHandler(blob: Blob): Promise<void> {
    // let lastRecord;
    // for (let i = this.recorderService.records.length - 1; i >= 0; i--) {
    //   lastRecord = this.recorderService.records[i];
    //   if (lastRecord.event === 'END') {
    //     break;
    //   }
    // }

    this.kokubanChart.audio = blob;
    this.kokubanChart.blobUrl = window.URL.createObjectURL(blob);

    let prompt = window.localStorage.getItem('PROMPT') || '';
    // prompt = prompt?.replaceAll(/<<button>>/gi, lastRecord?.kind || '') || '';

    const response = await this.geminiService.generateContent({
      text: prompt
    }, await this.geminiService.blobToGenerativePart(blob, 'audio/mpeg'));

    // console.log(response);

    // const text = response.candidates[0].content.parts[0].text;
    const text = response;

    this.kokubanChart.text = text;
    this.kokubanChart.html = await marked(text);
    // this.kokubanChart.summary = {
    //   audio: blob,
    //   text: text,
    //   blobUrl: window.URL.createObjectURL(blob),
    //   html: ''
    // };

    // await this.kokubanChart.setSummary(blob, text);
    // this.recorderService.setSummary(blob, text);

    // if (lastRecord) {
    //   lastRecord.audio = blob;
    //   lastRecord.text = text;
    // }
  }

  /**
   * リロードを抑制する
   * @see {@link https://developer.mozilla.org/ja/docs/Web/API/Window/beforeunload_event}
   * @param event - Window: beforeunload イベンドインターフェイス
   * @returns {string} 一部のブラウザが確認ダイアログで表示する文字列
   */
  private onBeforeunload(event: BeforeUnloadEvent): string {
    // this.updateMetadata(this.current.pack, this.current.deck, this.current.discard);
    const confirmationMessage = '';
    // Cancel the event as stated by the standard.
    event.preventDefault();
    // Chrome requires returnValue to be set.
    // Gecko + IE
    (event || window.event).returnValue = confirmationMessage;
    // Safari, Chrome, and other WebKit-derived browsers
    return confirmationMessage;
  }
}
