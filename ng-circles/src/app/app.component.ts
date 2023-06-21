import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'ng-circles';

  inner_ticks = 50;
  min = 10;
  max = 100;
  step = 1;

  @ViewChild('canvas', { static: true })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
  ) {}

  async ngOnInit() {
    this.redraw();

    // window.addEventListener('resize', () => this.redraw());
  }

  redraw() {
    const canvas = this.canvasRef?.nativeElement;
    if (!canvas) return;

    let width = this.hostRef.nativeElement.clientWidth;
    let height = this.hostRef.nativeElement.clientHeight;

    let size: [ number, number ];

    size = [ width, height ];
    canvas.style.width = size[0] + 'px';
    canvas.style.height = size[1] + 'px';

    // big circle
    const ctx = (() => {
      let ctx = canvas.getContext('2d');
      if (!ctx) throw new Error(`failed to get 2d context`);
      return ctx
    })();

    const scale = window.devicePixelRatio || 1;

    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.scale(scale, scale);

    let origin: P = [
      Math.floor(width / 2),
      Math.floor(height / 2),
    ];

    const unit = 10;
    const max = this.max;
    const inner_ticks = this.inner_ticks;

    let i = 0;

    frame();

    function frame() {
      ctx.clearRect(0, 0, width, height);

      draw_circle(max, origin, 0, undefined);

      i += 0.01;

      draw_inner_circle(i);
      draw_outer_circle(i);

      window.requestAnimationFrame(() => frame());
    }

    function draw_circle(
      n: number,
      center: P,
      rotation: number,
      direction: number | undefined,
    ) {
      const r = get_radius_by_ticks(n);
      ctx.beginPath();
      ctx.arc(center[0], center[1], r, 0, Math.PI * 2, true);

      let a = rotation;
      if (direction != null) {
        a += direction;

        ctx.moveTo(center[0], center[1]);
        let x = center[0] - r * Math.cos(a);
        let y = center[1] - r * Math.sin(a);
        ctx.lineTo(x, y);
      }

      for (let i = 0; i < n; ++i) {
        let b = a + 2 * Math.PI / n * i;

        let tick_height = 5;

        let x = center[0] - (r - tick_height) * Math.cos(b);
        let y = center[1] - (r - tick_height) * Math.sin(b);

        ctx.moveTo(x, y);

        x = center[0] - r * Math.cos(b);
        y = center[1] - r * Math.sin(b);

        ctx.lineTo(x, y);

      }
      ctx.stroke();
    }

    function draw_inner_circle(a: number) {
      const R = get_radius_by_ticks(max);
      const r = get_radius_by_ticks(inner_ticks);
      const d = R - r;
      let center: P = [
        origin[0] - d * Math.cos(a),
        origin[1] - d * Math.sin(a),
      ];

      draw_circle(inner_ticks, center, -d * a / r, Math.PI * 2);
    }

    function draw_outer_circle(a: number) {
      const R = get_radius_by_ticks(max);
      const r = get_radius_by_ticks(inner_ticks);
      const d = R + r;
      let center: P = [
        origin[0] - d * Math.cos(a),
        origin[1] - d * Math.sin(a),
      ];

      draw_circle(inner_ticks, center, d * a / r, Math.PI);
    }

    function get_radius_by_ticks(n: number) {
      return unit * n / 2 / Math.PI;
    }
  }

  // redraw1() {
  //   const canvas = this.canvasRef?.nativeElement;
  //   if (!canvas) return;

  //   let width = this.hostRef.nativeElement.clientWidth;
  //   let height = this.hostRef.nativeElement.clientHeight;

  //   canvas.width = width;
  //   canvas.height = height;

  //   let size: [ number, number ];

  //   size = [ width, height ];
  //   canvas.style.width = size[0] + 'px';
  //   canvas.style.height = size[1] + 'px';

  //   // big circle
  //   const ctx = (() => {
  //     let ctx = canvas.getContext('2d');
  //     if (!ctx) throw new Error(`failed to get 2d context`);
  //     return ctx
  //   })();

  //   let origin = [
  //     Math.floor(width / 2),
  //     Math.floor(height / 2),
  //   ];

  //   const r = this.radius;
  //   const R = this.R;

  //   let i = 0;
  //   frame();

  //   function frame() {
  //     ctx.clearRect(0, 0, width, height);

  //     ctx.beginPath();
  //     ctx.arc(origin[0], origin[1], R, 0, Math.PI * 2, true);
  //     ctx.stroke();

  //     draw_inner_circle(i);
  //     draw_outer_circle(i);

  //     i += 0.01;
  //     requestAnimationFrame(() => {
  //       frame();
  //     })
  //   }

  //   function draw_inner_circle(a: number) {
  //     let l = R - r;
  //     let x = origin[0] - Math.cos(a) * l;
  //     let y = origin[1] - Math.sin(a) * l;

  //     ctx.beginPath();
  //     ctx.arc(x, y, r, 0, Math.PI * 2, true);
  //     ctx.stroke();

  //     ctx.beginPath();
  //     ctx.moveTo(x, y);

  //     let b = (l * a) / r;
  //     let u = x - Math.cos(b) * r;
  //     let v = y + Math.sin(b) * r;
  //     ctx.lineTo(u, v);

  //     ctx.stroke();
  //   }

  //   function draw_outer_circle(a: number) {
  //     let l = R + r;
  //     let x = origin[0] - Math.cos(a) * l;
  //     let y = origin[1] - Math.sin(a) * l;

  //     ctx.beginPath();
  //     ctx.arc(x, y, r, 0, Math.PI * 2, true);
  //     ctx.stroke();

  //     ctx.beginPath();
  //     ctx.moveTo(x, y);

  //     let b = (l * a) / r;
  //     let u = x + Math.cos(b) * r;
  //     let v = y + Math.sin(b) * r;
  //     ctx.lineTo(u, v);

  //     ctx.stroke();

  //   }
  // }
}

type P = [ x: number, y: number ];
