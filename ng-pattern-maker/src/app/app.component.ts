import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Drawable } from './lib/drawable';
import { MatInputModule } from '@angular/material/input';
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule} from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { Vector2 } from './lib/vector2';
import { Angle } from './lib/angle';
import { bail } from './lib/error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,

    FormsModule,
    MatButtonToggleModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  providers: [
    {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
  ],
})
export class AppComponent implements OnInit {
  title = 'ng-pattern-maker';

  @ViewChild('canvas', { static: true })
  canvasRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('fields', { static: true })
  formRef?: ElementRef<HTMLCanvasElement>;

  mode: 'print' | 'preview' = 'print';

  query: Record<
    'start_angle' |
    'start_length' |
    'angle1' |
    'radius1' |
    'radius2' |
    'neck_length' |
    'flip',
    number
  > = {
    start_angle: 30,
    start_length: 5,
    angle1: 97,
    radius1: 40,
    radius2: 44,
    neck_length: 6,
    flip: 44,
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe((params: any) => {
      this.query.start_angle = parseFloat(params.start_angle ?? this.query.start_angle);
      this.query.start_length = parseFloat(params.start_length ?? this.query.start_length);
      this.query.angle1 = parseFloat(params.angle1 ?? this.query.angle1);
      this.query.radius1 = parseFloat(params.radius1 ?? this.query.radius1);
      this.query.radius2 = parseFloat(params.radius2 ?? this.query.radius2);
      this.query.neck_length = parseFloat(params.neck_length ?? this.query.neck_length);
      this.query.flip = parseFloat(params.flip ?? this.query.flip);

      this.redraw();
    });

    window.addEventListener('resize', () => this.redraw());
  }

  redraw() {
    const canvas = this.canvasRef?.nativeElement;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;

    let size: [ number, number ];
    let ppm: number;
    switch (this.mode) {
        case 'print':
        ppm = 150 / 25.4; // 150 dpi
        size = [
            210 * ppm,
            297 * ppm,
        ];
        let ratio = size[0] / size[1];
        canvas.style.aspectRatio = `${ ratio }`;
        if (container.clientWidth / container.clientHeight >= ratio) {
            canvas.style.width = 'unset';
            canvas.style.height = '100%';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = 'unset';
        }
        break;

        case 'preview':
        default:
        ppm = 3;
        size = [ container.clientWidth, container.clientHeight ];
        canvas.style.width = '100%';
        canvas.style.height = '100%';
    }

    let drawable = new Drawable(canvas, size, ppm);
    drawable.clear();

    const base = Vector2.y(-100);
    let verticies: Vector2[] = [
      base,
    ];
    let peek = (
      cb?: (v: Vector2) => void,
    ) => {
      let v = verticies[verticies.length - 1] ?? bail('not found');
      cb?.(v);
      return v;
    }
    let pairs = function*() {
      for (let i = 0; i < verticies.length - 1; ++i) {
        yield [ verticies[i]!, verticies[i + 1]! ] satisfies [ Vector2, Vector2 ]
      }
    }
    let last = Vector2.zero;;
    let go = (distance: number, turn: Angle) => {
      last = Vector2.polar(distance, last.theta.add(turn));
      let v = peek().add(last);
      verticies.push(v);
      return v;
    }
    let goto = (v: Vector2) => {
      last = v.subtract(peek());
      verticies.push(v);
    }

    const { start_angle, start_length, angle1, radius1, radius2, neck_length, flip } = this.query;
    const end_angle = start_angle + angle1;

    go(start_length, Angle.degree(start_angle));

    let max_x = Vector2.zero;
    for (let i = 0; i < end_angle - start_angle; ++i) {
      let v = go(Angle.degree(1).radian * radius1, Angle.degree(1));
      if (v.x > max_x.x) max_x = v;
    }
    drawable.text(`${ (max_x.x * 2).toFixed(1) } mm`, Vector2.cartesion(0, max_x.y));

    for (let i = 0; i < end_angle - 90; ++i) {
      go(Angle.degree(1).radian * radius2, Angle.degree(-1));
    }

    go(neck_length / 2, Angle.zero);

    peek(v => {
      let v_mirror = v.add(Vector2.cartesion(-v.x * 2, 0));
      drawable.line(v, v_mirror);
      drawable.text(
        `${ (v.x * 2).toFixed(1) } mm`,
        v.add(Vector2.cartesion(10, 0)),
        { valign: 'middle' },
      );

      {
        let from = Vector2.cartesion(50, base.y);
        let to = Vector2.cartesion(from.x, v.y)
        drawable.line(from, to);
        drawable.text(`${ (to.y - from.y).toFixed(2) } mm`, from.add(to).scale(0.5));
      }

      drawable.ctx.save();
      drawable.ctx.strokeStyle = 'green';
      drawable.line(v, v.add(Vector2.cartesion(0, -50)));
      drawable.line(v_mirror, v_mirror.add(Vector2.cartesion(0, -50)));
      drawable.ctx.restore();

      let to_add: Vector2[] = [];
      for (let i = 0; i < flip; ++i) {
        let m = verticies[verticies.length - 1 - i];
        if (!m) break;
        to_add.push(Vector2.cartesion(m.x, v.y + v.y - m.y));
      }
      verticies = verticies.concat(to_add);
    });

    goto(Vector2.cartesion(1, peek().y));

    for (let i = verticies.length - 1;; --i) {
      let v = verticies[i];
      if (!v) break;
      verticies.push(Vector2.cartesion(-v.x, v.y));
    }

    drawable.trace(verticies);

    {
      drawable.ctx.save();

      drawable.ctx.strokeStyle = 'green';
      let list: Vector2[] = [];
      for (let [ a, b ] of pairs()) {
        let p = b.subtract(a).rotate(Angle.degree(90)).scale_to(5);
        list.push(a.add(p));
        list.push(b.add(p));
      }
      drawable.trace(list);

      drawable.ctx.restore();
    }

    if (this.mode == 'print') {
      let top_right = Vector2.cartesion(210 / 2, 297 / 2);
      let start = top_right.add(Vector2.cartesion(-20, -10));
      let line_end = start.add(Vector2.cartesion(10, 0));

      let height = Vector2.cartesion(0, 2);
      drawable.line(start, line_end);
      drawable.line(start, start.add(height));
      drawable.line(line_end, line_end.add(height));

      drawable.text('1cm', start.add(line_end).scale(0.5).add(height));
      line_end = line_end.add(Vector2.y(-2));

      print_spec( 'Start Angle'  , start_angle  , 'deg' );
      print_spec( 'Start Length' , start_length , 'mm'  );
      print_spec( 'Angle 1'      , angle1       , 'deg' );
      print_spec( 'Radius 1'     , radius1      , 'mm'  );
      print_spec( 'Radius 2'     , radius2      , 'mm'  );
      print_spec( 'Nect Length'  , neck_length  , 'mm'  );
      print_spec( 'flip'         , flip         , 'pts' );


      function print_spec(field: string, value: any, unit?: string) {
        line_end = line_end.add(Vector2.y(-5));
        if (unit) drawable.text(unit, line_end.add(Vector2.x(2)), { align: 'left', valign: 'bottom' });
        drawable.text(field + ':', line_end.add(Vector2.x(-20)), { align: 'right', valign: 'bottom' });
        drawable.text(value.toString(), line_end, { align: 'right', valign: 'bottom' });
        drawable.ctx.save();
        drawable.ctx.strokeStyle = 'gray';
        drawable.line(line_end, line_end.add(Vector2.x(-20)));
        drawable.ctx.restore();
      }
    }
  }

  change_params(field: any, value: any) {
    (this.query as any)[field] = value;
    this.router.navigate([], {
      queryParams: this.query,
    })
  }
}
