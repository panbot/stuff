import { Angle } from "./angle";
import { Drawable } from "./drawable";
import { Vector2 } from "./vector2";

export namespace utils {

    export function get_rect(
        length: number,
        width: number,
        center?: Vector2,
    ) {
        type RECT = [
            top_right    : Vector2,
            top_left     : Vector2,
            bottom_left  : Vector2,
            bottom_right : Vector2,
        ];

        let t = center ?? Vector2.zero;
        let x = length / 2, y = width / 2;
        let rect: RECT = [
            Vector2.cartesion( x,  y),
            Vector2.cartesion(-x,  y),
            Vector2.cartesion(-x, -y),
            Vector2.cartesion( x, -y),
        ];

        return rect.map(v => v.add(t)) as RECT;
    }

    export function round_corners(
        vertices: readonly Vector2[],
        offset: number,
        options?: {
            step_degree?: number,
            flags?: FLAGS
        },
    ) {
        const flags = options?.flags ?? 0;

        let ret: Vector2[] = [];

        if (flags & FLAGS.NOWRAP) ret.push(vertices[0]!);

        for (let [ a, b, c ] of get_triplets(vertices, flags)) {
            let l1 = a.subtract(b);
            let l2 = c.subtract(b);

            let b1 = b.add(l1.scale_to(offset));
            ret.push(b1);
            let b2 = b.add(l2.scale_to(offset));

            let bisect = l2.theta.bisect(l1.theta);
            let alpha = bisect.subtract(l1.theta);

            let center = b.add(Vector2.polar(offset / alpha.cos(), bisect));
            let r1 = b1.subtract(center);
            let r2 = b2.subtract(center);

            let ilen = r1.theta.subtract(r2.theta).abs().degree;
            if (ilen > 180) ilen = 360 - ilen;
            let sign = c.subtract(b).theta.subtract(b.subtract(a).theta).normalize().radian > Math.PI ? -1 : 1;
            for (let i = 0; i < ilen; i += options?.step_degree ?? 1) {
                ret.push(center.add(Vector2.polar(
                    r1.r,
                    r1.theta.add(Angle.degree(i * sign)),
                )))
            }

            ret.push(b2);
        }

        if (flags & FLAGS.NOWRAP) ret.push(vertices[vertices.length - 1]!);

        return ret;
    }

    export function offset<T extends Vector2[]>(
        vertices: T,
        offset: number,
        flags: FLAGS = 0,
    ) {
        let ret: Vector2[] = [];
        for (let [ a, b, c ] of get_triplets(vertices, flags)) {
            let d1 = a.subtract(b).scale_to(offset).rotate(Angle.degree(90));
            let d2 = b.subtract(c).scale_to(offset).rotate(Angle.degree(90));

            let cross = Vector2.find_cross(
                [ a.add(d1), b.add(d1) ],
                [ b.add(d2), c.add(d2) ],
            );
            if (cross) ret.push(cross);
        }
        return ret as T;
    }

    export function * get_pairs<T>(vectors: readonly T[], flags: FLAGS = 0) {
        let ilen = vectors.length;
        if (flags & FLAGS.NOWRAP) ilen -= 1;
        for (let i = 0; i < ilen; ++i) {
            yield [ vectors[i]!, vectors[(i + 1) % vectors.length]! ] as const;
        }
    }

    export function * get_triplets<T>(elements: readonly T[], flags: FLAGS = 0) {
        let ilen = elements.length;
        let offset = -1 + elements.length;
        if (flags & FLAGS.NOWRAP) {
            ilen -= 2;
            offset = 0;
        }
        for (let i = 0; i < ilen; ++i) {
            yield [
                elements[(i + offset) % elements.length]!,
                elements[(i + offset + 1) % elements.length]!,
                elements[(i + offset + 2) % elements.length]!,
            ] as const
        }
    }

    export enum FLAGS {
        ZERO = 0,
        NOWRAP = 1,
    };

    export function stitch(
        drawable: Drawable,
        from: Vector2, to: Vector2,
        options?: {
            offset?: number,
            interval?: number,
            skip?: number,
            angle?: number,
            size?: number,
            start_offset?: number,
            end_offset?: number,
        },
    ) {
        const interval = Math.abs(options?.interval ?? 3) || 3;
        const offset = options?.offset ?? 2;
        const angle = options?.angle ?? 45;
        const size = options?.size ?? 2;
        const skip = options?.skip ?? 0;

        let direction = to.subtract(from).scale_to(interval);

        let hole = from.add(
            direction.rotate(Angle.degree(90)).scale_to(offset)
        ).add(
            direction.scale_to(skip * interval + (options?.start_offset ?? 0) * offset)
        );

        to = to.add(from.subtract(to).scale_to((options?.end_offset ?? 0) * offset));
        while (true) {
            let hole_end = hole.add(direction.rotate(Angle.degree(angle)).scale_to(size));
            if (to.subtract(hole_end).theta.subtract(direction.theta).cos() < 0) break;

            drawable.line(hole, hole_end);
            hole = hole.add(direction);
        }
    }
}