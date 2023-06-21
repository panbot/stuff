import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

type Pos = [ number, number ];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ng-capsule-shaped-hole-pattern-maker';

  mode = 'preview';

  capsule = {
    length: 30,
    width: 7,
    holes: 10,
    tooth: 3,
    angle: 30,
    offset: 2,
  };

  @ViewChild('canvas', { static: true })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('fields', { static: true })
  formRef?: ElementRef<HTMLCanvasElement>;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  async ngOnInit() {
    this.redraw();

    window.addEventListener('resize', () => this.redraw());
  }

  onModeChange(mode: string) {
    this.mode = mode;

    this.redraw();
  }

  redraw() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    let width = this.hostRef.nativeElement.clientWidth - (this.formRef?.nativeElement.clientWidth || 0);
    let height = this.hostRef.nativeElement.clientHeight;

    let size: [ number, number ];
    let ppm: number;
    switch (this.mode) {
      case 'print':
      ppm = 150 / 25.4;
      size = [
        210 * ppm,
        297 * ppm,
      ];
      if (width / height >= 210 / 297) {
        canvas.style.width = 'unset';
        canvas.style.height = height + 'px';
      } else {
        canvas.style.width = width + 'px';
        canvas.style.height = 'unset';
      }
      break;

      case 'preview':
      default:
      ppm = 10;
      size = [ width, height ];
      canvas.style.width = size[0] + 'px';
      canvas.style.height = size[1] + 'px';
    }

    let drawable = new Drawable(canvas, size, ppm);

    drawable.clear();

    const style = '';

    const center = drawable.center;

    let capsule = {
      ...this.capsule,
      length: this.capsule.length - this.capsule.width,
    };

    // scale marker
    {
      let pos: Pos = [ 10, 20 ];
      drawable.line(pos, [ pos[0] + 10, pos[1] ], style);
      drawable.line(pos, [ pos[0], pos[1] - 1 ], style);
      drawable.line([ pos[0] + 10, pos[1] ], [ pos[0] + 10, pos[1] - 1 ], style);
      drawable.text('1cm', [ pos[0] + 5, pos[1] - 2 ], [ 'center', 'bottom' ], [ 0, 0 ], '15px "courier new"', style);
    }

    // two verticle lines
    {
      let pos: Pos = [ center[0] - capsule.width / 2, center[1] - capsule.length / 2 ];
      drawable.line(pos, [ pos[0], pos[1] + capsule.length ], style);
      drawable.line([ pos[0] + capsule.width, pos[1] ], [ pos[0] + capsule.width, pos[1] + capsule.length ], style);
    }

    // two half circles
    {
      let pos: Pos = [ center[0], center[1] - capsule.length / 2 ];
      drawable.arc(pos, capsule.width / 2, Math.PI, 2 * Math.PI, style);
      drawable.arc([ pos[0], pos[1] + capsule.length ], capsule.width / 2, 0, Math.PI, style);
    }

    const guideStyle = '#ddd';

    // two verticle punch guides
    {
      let pos: Pos = [ center[0] - capsule.width / 2 - capsule.offset, center[1] - capsule.length / 2 ];
      drawable.line(
        pos,
        [ pos[0], pos[1] + capsule.length ],
        guideStyle);
      drawable.line(
        [ pos[0] + capsule.width + capsule.offset * 2, pos[1] ],
        [ pos[0] + capsule.width + capsule.offset * 2, pos[1] + capsule.length ],
        guideStyle);
    }

    // two half circle punch guides
    {
      let pos: Pos = [ center[0], center[1] - capsule.length / 2 ];
      drawable.arc(pos, capsule.width / 2 + capsule.offset, Math.PI, 2 * Math.PI, guideStyle);
      drawable.arc([ pos[0], pos[1] + capsule.length ], capsule.width / 2 + capsule.offset, 0, Math.PI, guideStyle);
    }

    // punch holes
    {
      let c1 = capsule.length / 2;
      let r = capsule.width / 2 + capsule.offset;
      let c2 = c1 + Math.PI * r;
      let circumference = c2 + capsule.length / 2;
      let c3 = c2 + capsule.length;
      let c4 = c3 + Math.PI * r;
      let c5 = c4 + capsule.length / 2;
      let interval = circumference / capsule.holes;

      for (
        let s = - capsule.tooth * Math.cos(capsule.angle * Math.PI / 180) / 2;
        s < c5;
        s += interval
      ) {

        if (s <= c1) {
          let f: Pos = [
            center[0] + r,
            center[1] + s,
          ]
          let t: Pos = [
            f[0] + capsule.tooth * Math.sin(capsule.angle * Math.PI / 180),
            f[1] + capsule.tooth * Math.cos(capsule.angle * Math.PI / 180),
          ];
          drawable.line(f, t, style);
        } else if (s <= c2) {
          let c = s - c1;
          let theta = c / r;

          let f: Pos = [
            center[0] + r * Math.cos(theta),
            center[1] + capsule.length / 2 + r * Math.sin(theta),
          ];
          let t: Pos = [
            f[0] + capsule.tooth * Math.sin(capsule.angle * Math.PI / 180 - theta),
            f[1] + capsule.tooth * Math.cos(capsule.angle * Math.PI / 180 - theta),
          ];
          drawable.line(f, t, style);
        } else if (s <= c3) {
          let c = s - c2;

          let f: Pos = [
            center[0] - r,
            center[1] + capsule.length / 2 - c,
          ];
          let t: Pos = [
            f[0] + capsule.tooth * Math.sin((180 + capsule.angle) * Math.PI / 180),
            f[1] + capsule.tooth * Math.cos((180 + capsule.angle) * Math.PI / 180),
          ];
          drawable.line(f, t, style);
        } else if (s <= c4) {
          let c = s - c3;
          let theta = c / r;

          let f: Pos = [
            center[0] - r * Math.cos(theta),
            center[1] - capsule.length / 2 - r * Math.sin(theta),
          ];
          let t: Pos = [
            f[0] + capsule.tooth * Math.sin((180 + capsule.angle) * Math.PI / 180 - theta),
            f[1] + capsule.tooth * Math.cos((180 + capsule.angle) * Math.PI / 180 - theta),
          ];
          drawable.line(f, t, style);
        } else {
          let c = s - c4;

          let f: Pos = [
            center[0] + r,
            center[1] - capsule.length / 2 + c,
          ];
          let t: Pos = [
            f[0] + capsule.tooth * Math.sin(capsule.angle * Math.PI / 180),
            f[1] + capsule.tooth * Math.cos(capsule.angle * Math.PI / 180),
          ];
          drawable.line(f, t, style);
        }
      }

    }

    if (this.mode == 'print') {
      const style = '#000';
      let w = size[0] / ppm;
      let h = size[1] / ppm;

      const lineHeight = 3;
      const lineWidth = 30;
      const anchor: Pos = [ w - 3, 1 ];

      let line: Pos = [ anchor[0], anchor[1] + lineHeight ];

      const text = (label: string, value: string | number, unit: string) => {
        let font = '12px "courier new"';
        let align = [ 'right', 'bottom' ] as [ CanvasTextAlign, CanvasTextBaseline ];
        let offset: Pos = [ 0, 0 ];

        drawable.text(unit, line, align, offset, font, style);
        drawable.text(`${value}`, [ line[0] - 5, line[1] ], align, offset, font, style);
        drawable.text(label + ': ', [ line[0] - lineWidth, line[1] ], [ 'left', 'bottom' ], offset, font, style);

        drawable.line(
          [
            line[0],
            line[1],
          ],
          [
            line[0] - lineWidth,
            line[1],
          ],
          style,
        )
      }

      text('paper size', 'A4', '');

      line[1] += lineHeight;
      text('capsule length', this.capsule.length, 'mm');

      line[1] += lineHeight;
      text('capsule width', this.capsule.width, 'mm');

      line[1] += lineHeight;
      text('hole offset', this.capsule.offset, 'mm');

      line[1] += lineHeight;
      text('hole count', this.capsule.holes, '');

      line[1] += lineHeight;
      text('tooth width', this.capsule.tooth, 'mm');

      line[1] += lineHeight;
      text('tooth angle', this.capsule.angle, 'deg');
    }

  }
}

class Drawable {

  public ctx: CanvasRenderingContext2D;

  public get center() {
    return [
      this.size[0] / 2 / this.ppm,
      this.size[1] / 2 / this.ppm,
    ] as Pos
  }

  constructor(
    public canvas: HTMLCanvasElement,
    public size: [ number, number ], // width, height
    public ppm: number, // pixels per millimeter
  ) {
    const scale = window.devicePixelRatio || 1;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`failed to get 2d context`);

    this.ctx = ctx;

    let [ width, height ] = size;

    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.scale(scale, scale);
  }

  clear() {
    let [ w, h ] = this.size;

    this.ctx.clearRect(0, 0, w, h);

    this.ctx.save();
    this.ctx.fillStyle = '#fff';
    this.ctx.fillRect(0, 0, w, h);
    this.ctx.restore();
  }

  line(
    from: Pos,
    to: Pos,
    style: string,
    modifier?: (ctx: CanvasRenderingContext2D) => void,
  ) {
    let ctx = this.ctx;
    if (!ctx) return;

    ctx.save();

    ctx.beginPath();
    ctx.moveTo(from[0] * this.ppm, from[1] * this.ppm);
    ctx.lineTo(to[0] * this.ppm, to[1] * this.ppm);
    ctx.closePath();

    ctx.strokeStyle = style;
    modifier?.(ctx);
    ctx.stroke();

    ctx.restore();
  }

  arc(center: Pos, radius: number, startAngle: number, endAngle: number, style: string, modifier?: (ctx: CanvasRenderingContext2D) => void) {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.arc(center[0] * this.ppm, center[1] * this.ppm, radius * this.ppm, startAngle, endAngle);

    this.ctx.strokeStyle = style;
    modifier?.(this.ctx);
    this.ctx.stroke();

    this.ctx.restore();
  }

  text(
    text: string,
    pos: Pos,
    align: [ CanvasTextAlign, CanvasTextBaseline ],
    offset: [ number, number ],
    font: string,
    style: string,
  ) {
    this.ctx.save();

    this.ctx.fillStyle = style;
    this.ctx.font = font;
    this.ctx.textAlign = align[0];
    this.ctx.textBaseline = align[1];

    this.ctx.fillText(text, pos[0] * this.ppm + offset[0], pos[1] * this.ppm + offset[1]);

    this.ctx.restore();
  }
}