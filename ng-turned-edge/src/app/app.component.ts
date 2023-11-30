import { Component, ElementRef, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { MatFormFieldModule, MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { Drawable } from './drawable';
import { Vector2 } from './vector2';
import { Angle } from './angle';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,

        FormsModule,

        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonToggleModule,
    ],
    providers: [
        {provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline'}}
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {

    title = 'ng-turned-edge';

    @ViewChild('canvas', { static: true })
    canvasRef?: ElementRef<HTMLCanvasElement>;

    @ViewChild('fields', { static: true })
    formRef?: ElementRef<HTMLCanvasElement>;

    drawable?: Drawable;

    mode = 'print';

    radius = 20;

    angle = 180;

    dx = 1;
    dy = 1;

    width = 10;

    constructor(
        private hostRef: ElementRef<HTMLElement>,
    ) {
    }

    async ngOnInit() {
        this.redraw();

        window.addEventListener('resize', () => this.redraw());
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
            ppm = 150 / 25.4; // 150 dpi
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

        let verticies: Vector2[] = [];
        for (let i = 0; i <= this.angle; i += 30) {
            verticies.push(Vector2.polar(this.radius, Angle.degree(i)));
        }
        drawable.trace(verticies);

        for (let pair of get_pairs()) {
            let middle = pair[0].add(pair[1]).scale(0.5);

            let dy = pair[0].subtract(pair[1]).scale_to(this.dy).rotate(Angle.degree(90));
            let dx = pair[1].subtract(pair[0]).scale_to(this.dx)

            let from = pair[0].add(dx).add(dy);

            let to = mirror(from, [ Vector2.zero, middle ]);
            let outer = middle.add(dy).add(dy.scale_to(this.width))
            let verticies = [ from, to, outer ];

            drawable.trace(verticies, true);
            drawable.trace(verticies.map(v => mirror(v, [ pair[0], pair[1] ])), true);
        }

        if (this.mode == 'print') {
            let top_left = Vector2.cartesion(-210 / 2, 297 / 2);
            let start = top_left.add(Vector2.cartesion(10, -10));
            let end = start.add(Vector2.cartesion(10, 0));

            let height = Vector2.cartesion(0, 2);
            drawable.line(start, end);
            drawable.line(start, start.add(height));
            drawable.line(end, end.add(height));

            drawable.text('1cm', start.add(end).scale(0.5).add(height));
        }

        function* get_pairs() {
            for (let i = 0; i < verticies.length - 1; ++i) {
                yield [ verticies[i]!, verticies[i + 1]! ] satisfies [ Vector2, Vector2 ]
            }
        }

        function mirror(v: Vector2, line: [ from: Vector2, to: Vector2 ]) {
            v = v.subtract(line[0]);
            return v.rotate(v.theta.subtract(line[1].subtract(line[0]).theta).scale(-2)).add(line[0]);
        }
    }
}
