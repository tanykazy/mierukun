import { Component, EventEmitter, Input, Output } from '@angular/core';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipEditedEvent, MatChipInputEvent } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Clipboard } from '@angular/cdk/clipboard';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { SEARCHPARAM_KEY_BUTTON } from 'src/app/app.component';
import { RecorderService } from 'src/app/services/recorder.service'
import { MatOption } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';

const DEFAULT_PROMPT = '音声から会話を文字起こしして';

@Component({
  selector: 'app-inputmore',
  templateUrl: './inputmore.component.html',
  styleUrls: ['./inputmore.component.css']
})
export class InputmoreComponent {
  constructor(
    private recorderService: RecorderService,
    private matSnackBar: MatSnackBar,
    private clipboard: Clipboard
  ) {
    this.apikey = window.localStorage.getItem('API_KEY') || '';
    this.prompt = window.localStorage.getItem('PROMPT') || DEFAULT_PROMPT;
    window.localStorage.setItem('PROMPT', this.prompt);
  }

  grade!: MatOption;
  subject!: string;
  recordeAudio: boolean = false;
  apikey: string;
  prompt: string;

  @Input() label!: string;
  @Input() placeholder!: string;

  @Input() names!: Array<string>;
  @Output() namesChange = new EventEmitter<string[]>();

  readonly addOnBlur: boolean = true;
  readonly separatorKeysCodes = [ENTER, COMMA] as const;

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
    } else {
      this.recorderService.disableAudio();
    }
  }

  onInputApikey(event: Event): void {
    if ((event.target as HTMLInputElement).value.length === 0) {
      this.recordeAudio = false;
    }

    window.localStorage.setItem('API_KEY', (event.target as HTMLInputElement).value);
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
