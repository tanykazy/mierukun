import { Component, OnInit, ViewChild } from '@angular/core';
import { StepperSelectionEvent } from '@angular/cdk/stepper';

import { marked } from 'marked';

import { InputmoreComponent } from './components/inputmore/inputmore.component';
import { ButtonsetComponent, ClickButtonset } from './components/buttonset/buttonset.component';
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

  @ViewChild(InputmoreComponent) inputmoreComponent!: InputmoreComponent;
  @ViewChild(ButtonsetComponent) buttonsetComponent!: ButtonsetComponent;
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
    if (this.recorderService.isAudioAvailable) {
      console.log('start recording');
      this.recorderService.startRecordAudio(this.stopRecorderHandler.bind(this));
    }
  }

  public onClickStopRecording(event: UIEvent): void {
    this.buttonsetComponent.deactiveAll();
    console.log('stop recording');
    this.recorderService.stopRecordAudio();
  }

  private async stopRecorderHandler(blob: Blob): Promise<void> {
    this.kokubanChart.audio = blob;
    this.kokubanChart.blobUrl = window.URL.createObjectURL(blob);

    let prompt = window.localStorage.getItem('PROMPT') || '';
    prompt = prompt.replaceAll(/<<button>>/gi, this.inputmoreComponent.grade || '') || '';
    prompt = prompt.replaceAll(/<<subject>>/gi, this.inputmoreComponent.subject || '') || '';
    prompt = prompt.replaceAll(/<<note>>/gi, this.inputmoreComponent.note || '') || '';

    // console.log('generateContent');
    const response = await this.geminiService.generateContent({
      text: prompt
    }, await this.geminiService.blobToGenerativePart(blob, 'audio/webm'));

    const text = response;

    this.kokubanChart.text = text;
    console.log(this.kokubanChart.text);
    this.kokubanChart.html = await marked(text);
    console.log(this.kokubanChart.html);
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

  public onChangeFile(event: Event): void {
    console.log(event);
    console.log((event.target as HTMLInputElement).files);
    const blob = (event.target as HTMLInputElement).files?.item(0);

    this.stopRecorderHandler(blob as Blob);
  }
}
