import { Angle } from "./angle";
import { bail } from "./error";
import { Vector2 } from "./vector2";

export class Drawable {

    public ctx: CanvasRenderingContext2D;

    public width: {
        px: number,
        mm: number,
    };
    public height: {
        px: number,
        mm: number,
    };

    get ppm() {
        return this.dpi / 25.4;
    }

    get font_scale() {
        return this.dpi / 150;
    }

    constructor(
        public canvas: HTMLCanvasElement,
        public width_mm: number,
        public height_mm: number,
        public dpi: number,
        public scale: [ number, number ],
    ) {
        this.ctx = canvas.getContext('2d') ?? bail('2d context not supported');

        this.width = {
            mm: width_mm,
            px: width_mm * this.ppm,
        };

        this.height = {
            mm: height_mm,
            px: height_mm * this.ppm,
        };

        canvas.width  = this.width.px;
        canvas.height = this.height.px;

        this.ctx.setTransform(scale[0], 0, 0, scale[1], this.width.px / 2 * scale[0], this.height.px / 2 * scale[1]);
    }

    clear() {
        let w = this.width.px, h = this.height.px;

        let region = [
            -0.5 * w,
            -0.5 * h,
            w,
            h,
        ] as const;

        this.ctx.clearRect(...region);
    }

    line(
        from: Vector2,
        to: Vector2,
        options?: {
            arrow?: {
                angle?: Angle,
                size?: number,
            }
        },
    ) {
        const { ctx, ppm, xy } = this;

        ctx.beginPath();

        ctx.moveTo(...xy(from));
        ctx.lineTo(...xy(to));

        if (options?.arrow) {
            let angle = options.arrow.angle ?? Angle.degree(60);
            let size = options.arrow.size ?? 5;

            let v = to.subtract(from);
            let arm = v.rotate(Angle.degree(180).subtract(angle.scale(0.5))).scale_to(size);
            ctx.lineTo(...xy(to.add(arm)));

            arm = arm.rotate(angle);
            ctx.moveTo(...xy(to));
            ctx.lineTo(...xy(to.add(arm)));
        }

        ctx.stroke();
    }

    trace(vertices: readonly Vector2[], close?: boolean) {
        const { ctx, xy } = this;

        let start = vertices[0];
        if (!start) return;

        ctx.beginPath();

        ctx.moveTo(...xy(start));

        for (let i = 1; i < vertices.length; ++i) {
            ctx.lineTo(...xy(vertices[i]!));
        }

        if (close) ctx.closePath();

        ctx.stroke();
    }

    arc(start: Vector2, direction: Vector2, radius: number, angle: Angle) {
        const { ctx, xy } = this;

        ctx.beginPath();

        ctx.moveTo(...xy(start));

        let center = start.add(direction.rotate(Angle.degree(90)).scale_to(radius));
        let start_deg = start.subtract(center).theta.degree;
        for (let i = 0; i <= angle.degree; ++i) {
            ctx.lineTo(...xy(center.add(Vector2.polar(radius, Angle.degree(start_deg + i)))));
        }

        ctx.stroke();
    }

    text(
        text: string,
        pos: Vector2,
        options?: {
            size?: number,
            font?: string,
            align?: CanvasTextAlign,
            valign?: CanvasTextBaseline,
        },
    ) {
        return this.session(() => {
            const { ctx } = this;

            ctx.font = `${ (options?.size ?? 15) * this.font_scale }px "${ options?.font ?? 'courier new' }"`;
            ctx.textAlign = options?.align ?? 'center';
            ctx.textBaseline = options?.valign ?? 'bottom';

            let [ x, y ] = this.xy(pos);
            this.ctx.fillText(text, x, y);

            let measure = this.ctx.measureText(text);
            let coef = 1 / this.ppm;

            return {
                width: measure.width * coef,
            }
        })
    }

    session<T>(
        cb: (ctx: CanvasRenderingContext2D, drawable: Drawable) => T,
        transform?: [ transition: Vector2, rotation: Angle ],
    ) {
        this.ctx.save();

        try {
            let drawable = Object.create(this);
            let xy = this.xy;
            if (transform) {
                let [ transition, rotation ] = transform;
                drawable.xy = (v: Vector2) => xy(v.rotate(rotation).add(transition));
            }
            return cb(this.ctx, drawable);
        } catch (e) {
            throw e;
        } finally {
            this.ctx.restore();
        }
    }

    private xy = (v: Vector2): [ number, number ] => {
        return [
            v.x * this.ppm,
            v.y * this.ppm * -1,
        ]
    }
}