import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { Drawable } from './lib/drawable';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS, MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { PatternMaker } from './patterns';
import ear_pattern from './patterns/ear';
import badge_holder from './patterns/badge-holder';
import { Vector2 } from './lib/vector2';
import calibration from './patterns/calibration';
import capsule_hole from './patterns/capsule';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,

        FormsModule,
        MatSelectModule,
        MatInputModule,
        MatFormFieldModule,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    providers: [
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline' } }
    ],
})
export class AppComponent implements OnInit {
    title = 'ng-pattern-maker';

    @ViewChild('canvas', { static: true })
    canvasRef?: ElementRef<HTMLCanvasElement>;

    @ViewChild('fields', { static: true })
    formRef?: ElementRef<HTMLCanvasElement>;

    patterns: Record<string, PatternMaker> = {
        'Ear': ear_pattern,
        'Badge Holder': badge_holder,
        'Capsule Hole': capsule_hole,
        'Calibration': calibration,
    };

    pattern_entries = Object.entries(this.patterns);
    selected_pattern_name?: string;
    pattern?: PatternMaker;
    query: any = {};

    constructor(
        private router: Router,
        private route: ActivatedRoute,
    ) {
    }

    ngOnInit() {
        this.route.queryParams.subscribe((params: any) => {
            let pattern = this.pattern = this.patterns[params.pattern];
            this.query = {};

            if (!pattern) {
                this.redraw();
                this.selected_pattern_name = undefined;
                return;
            }

            this.selected_pattern_name = params.pattern;

            for (let field of pattern.fields) {
                this.query[field.name]
                    = params[field.name] != null
                    ? parseFloat(params[field.name])
                    : field.default_value
                ;
            }

            this.redraw();
        });

        window.addEventListener('resize', () => this.redraw());
    }

    redraw() {
        const canvas = this.canvasRef?.nativeElement;
        const container = canvas?.parentElement;
        if (!canvas || !container) return;

        let dpi = 300;
        let size = Vector2.cartesion(210, 297);
        let ratio = size.x / size.y;
        canvas.style.aspectRatio = `${ratio}`;
        if (container.clientWidth / container.clientHeight >= ratio) {
            canvas.style.width = 'unset';
            canvas.style.height = '100%';
        } else {
            canvas.style.width = '100%';
            canvas.style.height = 'unset';
        }

        let drawable = new Drawable(canvas, size.x, size.y, dpi, size.y / 289);
        drawable.clear();

        if (!this.pattern) return;

        this.pattern.draw(drawable, this.query);

        {
            let top_left = Vector2.cartesion(-size.x / 2 + 2, size.y / 2 - 1);
            drawable.line(top_left, top_left.add(Vector2.x(300)));
            drawable.line(top_left, top_left.add(Vector2.y(-300)));
            for (let i = 0; i < 300; ++i) {
                let size = (() => {
                    if (i % 10 == 0) {
                        return 3;
                    } else if (i % 5 == 0) {
                        return 2;
                    } else {
                        return 1;
                    }
                })();
                drawable.line(top_left.add(Vector2.x( i)), top_left.add(Vector2.x( i)).add(Vector2.y(-size)));
                drawable.line(top_left.add(Vector2.y(-i)), top_left.add(Vector2.y(-i)).add(Vector2.x( size)));
            }
        }

        {
            let top_right = Vector2.cartesion(size.x / 2, size.y / 2).add(Vector2.cartesion(-5, -5));
            let line_end = top_right.add(Vector2.x(-10));

            for (let f of this.pattern.fields) {
                print_spec(f.label, this.query[f.name], f.unit);
            }

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
        this.update_router();
    }

    change_pattern(name: string) {
        this.selected_pattern_name = name;
        this.query = {};
        this.update_router();
    }

    update_router() {
        this.router.navigate([], {
            queryParams: {
                pattern: this.selected_pattern_name,
                ...this.query,
            }
        });
    }
}
