import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { utils } from "../lib/utils";
import { Vector2 } from "../lib/vector2";

type FIELDS
    = 'length'
    | 'width'
    | 'height'
    | 'offset'
;

const tissue_box: PatternMaker<FIELDS> = {
    fields: [{
        name: 'length',
        label: 'Length',
        unit: 'mm',
        default_value: 181.5,
    }, {
        name: 'width',
        label: 'Width',
        unit: 'mm',
        default_value: 106.5,
    }, {
        name: 'height',
        label: 'Height',
        unit: 'mm',
        default_value: 52.5,
    }, {
        name: 'offset',
        label: 'Offset',
        unit: 'mm',
        default_value: 3,
    }],
    draw(drawable, params) {
        const offset = params.offset;
        const skip = 1;
        const start_offset = 1;
        const end_offset = 1;

        {
            let face = utils.get_rect(
                params.width,
                params.length,
                Vector2.cartesion(-37, -35),
            );
            drawable.trace(face, true);

            for (let [ a, b ] of utils.get_pairs(face)) {
                stitch(a, b, { offset, skip, start_offset, end_offset });
            }

            drawable.session(() => turned_edge(face, { width: 10, offset: 1 }));
        }

        {
            let face = utils.get_rect(
                params.height,
                params.length,
                Vector2.cartesion(60, -35),
            );
            drawable.trace(face, true);

            for (let [ a, b ] of utils.get_pairs(face)) {
                stitch(a, b, { offset, skip, start_offset, end_offset });
            }

            drawable.session(() => turned_edge(face, { width: 10, offset: 1 }));
        }

        {
            let face = utils.get_rect(
                params.width,
                params.height,
                Vector2.cartesion(-37, 100),
            );
            drawable.trace(face, true);

            for (let [ a, b ] of utils.get_pairs(face)) {
                stitch(a, b, { offset, skip, start_offset, end_offset });
            }

            drawable.session(() => turned_edge(face, { width: 10, offset: 1 }));
        }

        function stitch(
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
            const interval = options?.interval ?? 3;
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

        function turned_edge(
            vertices: Vector2[],
            options?: {
                width?: number,
                threshold?: number,
                offset?: number,
            },
        ) {
            const threshold = options?.threshold ?? 10;
            const offset_size = options?.offset ?? 1;
            const width = options?.width ?? 5;

            let turned_edge_vertices: Vector2[] = [
                vertices[0]!,
                vertices[1]!,
            ];

            for (let i = 2; i < vertices.length; ++i) {
                let a = turned_edge_vertices[turned_edge_vertices.length - 1]!;
                let b = vertices[i]!;
                let l = b.subtract(a);

                let last_seg = a.subtract(turned_edge_vertices[turned_edge_vertices.length - 2]!);

                if (Math.abs(l.theta.degree - last_seg.theta.degree) < threshold) {
                    turned_edge_vertices.pop();
                }

                turned_edge_vertices.push(b);
            }

            drawable.ctx.setLineDash([ 3, 3 ]);

            let segments: [ Vector2, Vector2 ][] = [];

            for (let [ a, b ] of utils.get_pairs(turned_edge_vertices)) {
                let d = b.subtract(a);
                if (d.r < 1) continue;

                segments.push([ a, b ]);
            };

            for (let [ s1, s2 ] of utils.get_pairs(segments)) {
                let [ a, b ] = s1;
                let [ c, d ] = s2;

                let d1 = b.subtract(a);
                let d2 = d.subtract(c);
                let bisect = Vector2.polar(
                    width,
                    d2.theta.bisect(d1.theta).add(Angle.degree(90))
                );

                drawable.line(a, b);

                let v = b.add(c).scale(0.5);

                let inner = v.add(bisect);
                let o1 = inner.mirror(a, b);
                let o2 = inner.mirror(c, d);

                let offset = bisect
                    .rotate(Angle.degree(180))
                    .scale_to(offset_size);

                v = v.add(offset);
                drawable.line(inner, v);
                drawable.line(v, o1);
                drawable.line(v, o2);
            }
        }
    },
}

export default tissue_box;