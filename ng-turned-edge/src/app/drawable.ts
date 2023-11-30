import { Angle } from "./angle";
import { bail } from "./utils";
import { Vector2 } from "./vector2";

export class Drawable {

    public ctx: CanvasRenderingContext2D;

    constructor(
        public canvas: HTMLCanvasElement,
        public size: [ number, number ], // width, height
        public ppm: number, // pixels per millimeter
    ) {
        this.ctx = canvas.getContext('2d') ?? bail('2d context not supported');

        const scale = window.devicePixelRatio || 1;
        let [ width, height ] = size;

        canvas.width = width * scale;
        canvas.height = height * scale;

        this.ctx.setTransform(scale, 0, 0, scale, width / 2 * scale, height / 2 * scale);
    }

    clear() {
        let [ w, h ] = this.size;

        let region = [
            -0.5 * w,
            -0.5 * h,
            w,
            h,
        ] as const;

        this.ctx.clearRect(...region);

        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(...region);
        this.ctx.restore();
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

        ctx.moveTo(...xy(from));
        ctx.lineTo(...xy(to))

        if (options?.arrow) {
            let angle = options.arrow.angle ?? Angle.degree(60);
            let size = options.arrow.size ?? 1;

            let v = to.subtract(from);
            let arm = v.rotate(Angle.degree(180).subtract(angle.scale(0.5))).scale_to(size * ppm);
            ctx.lineTo(...xy(to.add(arm)));

            arm = arm.rotate(angle);
            ctx.moveTo(...xy(to));
            ctx.lineTo(...xy(to.add(arm)));
        }

        ctx.stroke();
    }

    trace(verticies: Vector2[], close?: boolean) {
        const { ctx, xy } = this;

        let start = verticies[0];
        if (!start) return;

        if (close) ctx.beginPath();

        ctx.moveTo(...xy(start));

        for (let i = 1; i < verticies.length; ++i) {
            ctx.lineTo(...xy(verticies[i]!));
        }

        if (close) ctx.closePath();

        ctx.stroke();
    }

    text(
        text: string,
        pos: Vector2,
        options?: {
            size: string,
            align?: CanvasTextAlign,
            valign?: CanvasTextBaseline,
        },
    ) {
        const { ctx } = this;

        ctx.save();
        ctx.font = options?.size ?? '15px "courier new"';
        ctx.textAlign = options?.align ?? 'center';
        ctx.textBaseline = options?.valign ?? 'bottom';

        let [ x, y ] = this.xy(pos);
        this.ctx.strokeText(text, x, y);

        this.ctx.restore();
    }

    private xy = (v: Vector2): [ number, number ] => {
        return [
            v.x * this.ppm,
            v.y * this.ppm * -1,
        ]
    }
}