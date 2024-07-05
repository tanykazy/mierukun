import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ClickButton {
  name: string;
  state: boolean;
  time: number;
}

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {

  @Input() name!: string;
  @Input() state!: boolean;

  @Output() clickButton = new EventEmitter<ClickButton>();

  private toggleState(): void {
    this.state = !this.state;
  }

  public onClick(event: UIEvent): void {
    console.debug(event);

    const now = Date.now();

    this.toggleState();

    this.clickButton.emit({
      name: this.name,
      state: this.state,
      time: now,
    });
  }
}
