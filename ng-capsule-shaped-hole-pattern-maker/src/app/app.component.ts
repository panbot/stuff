import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

type Pos = [ number, number ];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ng-capsule-shaped-hole-pattern-maker';

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

  ppm = 10; // pixels per millimeter

  // center?: Pos;

  constructor(
  ) {}

  async ngOnInit() {

    // let width = 210 * 600 / 25.4;
    // let height = 296 * 600 / 25.4;

    // let width = this.hostRef.nativeElement.clientWidth;
    // let height = this.hostRef.nativeElement.clientHeight;

    // this.PxPerMm = width / 210;

    // this.center = [ width / 2 / this.PxPerMm, height / 2 / this.PxPerMm ];

    this.redraw();

    window.addEventListener('resize', () => this.redraw());
  }

  redraw() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    let drawable = new Drawable(
      canvas,
      [
        canvas.parentElement!.clientWidth,
        canvas.parentElement!.clientHeight,
      ],
      this.ppm,
    );

    drawable.clear();

    const style = '';

    const center = drawable.center;

    let capsule = {
      ...this.capsule,
      length: this.capsule.length - this.capsule.width,
    };

    // scale marker
    {
      let pos: Pos = [ 10, 10 ];
      drawable.line(pos, [ pos[0] + 10, pos[1] ], style);
      drawable.line(pos, [ pos[0], pos[1] - 1 ], style);
      drawable.line([ pos[0] + 10, pos[1] ], [ pos[0] + 10, pos[1] - 1 ], style);
      drawable.text('1cm', [ pos[0] + 5, pos[1] - 2 ], [ 'center', 'bottom' ], [ 0, 0 ], '16px "courier new', style);
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
    canvas.style.width = width + 'px';
    canvas.height = height * scale;
    canvas.style.height = height + 'px';

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