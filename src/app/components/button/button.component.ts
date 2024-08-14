import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

import { RecorderService } from '../../services/recorder.service';


export interface ClickButton {
  name: string;
  state: boolean;
  time: Date;
  button: ButtonComponent;
}

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  constructor(
    private recorder: RecorderService
  ) { }

  @ViewChild('visualizer') visualizer!: ElementRef;

  @Input() name!: string;
  @Input() state!: boolean;

  @Output() clickButton = new EventEmitter<ClickButton>();

  canvasCtx!: CanvasRenderingContext2D;
  audioCtx!: AudioContext;
  analyser!: AnalyserNode;
  bufferLength!: number;
  dataArray!: Uint8Array;
  requestAnimationFrameId!: number;

  private visualize(stream: MediaStream) {
    if (this.recorder.stream) {
      this.canvasCtx = this.visualizer.nativeElement.getContext('2d');
    }

    if (!this.audioCtx) {
      this.audioCtx = new AudioContext();
    }

    const source = this.audioCtx.createMediaStreamSource(stream);

    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(this.bufferLength);

    source.connect(this.analyser);

    const draw = () => {
      if (!this.state) {
        window.cancelAnimationFrame(this.requestAnimationFrameId);
        return;
      }

      const WIDTH = this.visualizer.nativeElement.width;
      const HEIGHT = this.visualizer.nativeElement.height;

      this.requestAnimationFrameId = window.requestAnimationFrame(draw);

      this.analyser.getByteTimeDomainData(this.dataArray);

      this.canvasCtx.fillStyle = "rgba(255, 255, 255, 1)";
      this.canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

      this.canvasCtx.lineWidth = 1;
      this.canvasCtx.strokeStyle = "rgb(0, 0, 0)";

      this.canvasCtx.beginPath();

      const sliceWidth = (WIDTH * 1.0) / this.bufferLength;
      let x = 0;

      for (let i = 0; i < this.bufferLength; i++) {
        let v = this.dataArray[i] / 128.0;
        let y = (v * HEIGHT) / 2;

        if (i === 0) {
          this.canvasCtx.moveTo(x, y);
        } else {
          this.canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      this.canvasCtx.lineTo(this.visualizer.nativeElement.width, this.visualizer.nativeElement.height / 2);
      this.canvasCtx.stroke();
    };

    draw();
  }

  private toggleState(): void {
    this.state = !this.state;
  }

  public onClick(event: UIEvent): void {
    console.debug(event);

    const now = new Date();

    this.toggleState();
    if (this.state) {
      if (this.recorder.stream) {
        this.visualize(this.recorder.stream);
      }
    }

    this.clickButton.emit({
      name: this.name,
      state: this.state,
      time: now,
      button: this,
    });
  }
}
