import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatSelectChange } from '@angular/material/select';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { SEARCHPARAM_KEY_BUTTON } from 'src/app/app.component';
import { RecorderService } from 'src/app/services/recorder.service'


const DEFAULT_PROMPT = `あなたは、授業を分析し、より良い授業を実現するためのAIアシスタントです。
これから入力される音声データは、授業中の教師と生徒の発話です。
この音声データを元に、以下の観点で分析し、具体的な行動に基づいたフィードバックを生成してください。

# 授業の概要
対象学年: <<grade>>
教科: <<subject>>
授業の目標: <<note>>

# 観点
授業の目標達成と教師の行動の関係

# 発話内容の詳細 
- 教師は授業中、具体的にどのような言葉を発していますか？ 教師の発言を箇条書きで列挙してください。
- 各発言の意図は何か？（例：授業の導入、指示、説明、質問、励まし、評価など）
`;

@Component({
  selector: 'app-inputmore',
  templateUrl: './inputmore.component.html',
  styleUrls: ['./inputmore.component.css']
})
export class InputmoreComponent implements OnInit {
  constructor(
    private recorderService: RecorderService,
    private matSnackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {
    this.prompt = window.localStorage.getItem('PROMPT') || DEFAULT_PROMPT;
    window.localStorage.setItem('PROMPT', this.prompt);
  }

  grade!: string;
  subject!: string;
  note!: string;
  recordeAudio: boolean = false;
  prompt: string;

  @Input() label!: string;
  @Input() placeholder!: string;

  @Input() names!: Array<string>;
  @Output() namesChange = new EventEmitter<string[]>();

  readonly addOnBlur: boolean = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  ngOnInit(): void {
    this.recorderService.enableAudio();
    this.recordeAudio = this.recorderService.isAudioAvailable;
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      if (!this.names.includes(value)) {
        this.names.push(value);
        this.namesChange.emit(Array.from(this.names));
      } else {
        console.info(`${value} はすでに登録されています。`);
      }
    }
    event.chipInput!.clear();
  }

  remove(name: string): void {
    const index = this.names.indexOf(name);
    if (index !== -1) {
      this.names.splice(index, 1);
      this.namesChange.emit(Array.from(this.names));
    }
  }

  edit(name: string, event: MatChipEditedEvent): void {
    const value = event.value.trim();
    if (!value) {
      this.remove(name);
    } else {
      const index = this.names.indexOf(name);
      if (index !== -1) {
        this.names[index] = value;
        this.namesChange.emit(Array.from(this.names));
      }
    }
  }

  drop(event: CdkDragDrop<string[]>): void {
    moveItemInArray(this.names, event.previousIndex, event.currentIndex);
    this.namesChange.emit(Array.from(this.names));
  }

  onClickCopyButton(event: UIEvent): void {
    if (this.names.length > 0) {
      const url = new URL(document.location.href);
      url.searchParams.delete(SEARCHPARAM_KEY_BUTTON);
      for (const name of this.names) {
        url.searchParams.append(SEARCHPARAM_KEY_BUTTON, name);
      }
      const result = this.clipboard.copy(url.href);
      if (result) {
        this.openSnackBar('Copy succeeded.', 'OK');
      } else {
        this.openSnackBar('Failed to copy.', 'OK');
      }
    }
  }

  onChangeRecordAudio(event: MatSlideToggleChange): void {
    if (event.checked) {
      this.recorderService.enableAudio();
      // this.recordeAudio = true;
    } else {
      this.recorderService.disableAudio();
      // this.recordeAudio = false;
    }
  }

  onInputPrompt(event: Event): void {
    window.localStorage.setItem('PROMPT', (event.target as HTMLInputElement).value);
  }

  onInputSubject(event: Event): void {
    this.recorderService.subject = (event.target as HTMLInputElement).value;
  }

  onChangeGrade(event: MatSelectChange): void {
    this.recorderService.grade = event.value;
  }

  openSnackBar(message: string, action: string): void {
    this.matSnackBar.open(message, action);
  }
}
