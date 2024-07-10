import { AfterViewInit, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
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
export class ButtonComponent implements AfterViewInit {
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

  ngAfterViewInit(): void {
    if (this.recorder.stream) {
      this.canvasCtx = this.visualizer.nativeElement.getContext('2d');

      this.visualize(this.recorder.stream);
    }

    // window.onresize = () => {
    // this.visualizer.nativeElement.width = mainSection.offsetWidth;
    // };

    // window.onresize();
  }
  // Set up basic variables for app
  // const record = document.querySelector(".record");
  // const stop = document.querySelector(".stop");
  // const soundClips = document.querySelector(".sound-clips");
  // const canvas = document.querySelector(".visualizer");
  // const mainSection = document.querySelector(".main-controls");

  // Disable stop button while not recording
  // stop.disabled = true;

  // Visualiser setup - create web audio api context and canvas
  // const canvasCtx = canvas.getContext("2d");

  // Main block for doing the audio recording
  private visualize(stream: MediaStream) {
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
      const WIDTH = this.visualizer.nativeElement.width;
      const HEIGHT = this.visualizer.nativeElement.height;

      this.requestAnimationFrameId = requestAnimationFrame(draw);

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

    this.clickButton.emit({
      name: this.name,
      state: this.state,
      time: now,
      button: this,
    });
  }
}
