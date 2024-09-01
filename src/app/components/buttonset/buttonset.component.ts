import { Component, EventEmitter, Input, OnDestroy, Output, QueryList, ViewChildren } from '@angular/core';

import { ButtonComponent, ClickButton } from '../button/button.component';
import { Event } from '../../services/recorder.service';


/** コンポーネント外部に送出するイベントの引数 */
export interface ClickButtonset {
  // ボタンの名前
  button: string;
  // イベント種別
  event: Event;
  // イベント発生時間
  time: Date;
}

@Component({
  selector: 'app-buttonset',
  templateUrl: './buttonset.component.html',
  styleUrls: ['./buttonset.component.css']
})
export class ButtonsetComponent implements OnDestroy {
  constructor() { }

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
        }
      });
    }

    this.clickButtonset.emit({
      button: event.name,
      event: event.state ? 'START' : 'END',
      time: now
    });
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
  }
}
