import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { Vector2 } from "../lib/vector2";

type FIELDS
    = 'length'
    | 'width'
    | 'radius'
    | 'tail'
    | 'turned_edge'
    | 'turned_edge_threshold'
    | 'turned_edge_offset'
    // | 'turned_edge_thickness'
;

const tapered_ear: PatternMaker<FIELDS> = {
    fields: [{
        name: 'length',
        label: 'Length',
        unit: 'mm',
        default_value: 70,
    }, {
        name: 'width',
        label: 'Width',
        unit: 'mm',
        default_value: 15,
    }, {
        name: 'tail',
        label: 'Tail',
        unit: 'mm',
        default_value: 20,
    }, {
        name: 'radius',
        label: 'Radius',
        unit: 'mm',
        default_value: 20,
    }, {
        name: 'turned_edge',
        label: 'Turned Edge',
        unit: 'mm',
        default_value: 5,
    }, {
        name: 'turned_edge_threshold',
        label: 'Turned Edge Threshold',
        unit: 'deg',
        default_value: 9,
    }, {
        name: 'turned_edge_offset',
        label: 'Turned Edge Offset',
        unit: 'mm',
        default_value: 1,
    // }, {
    //     name: 'turned_edge_thickness',
    //     label: 'Turned Edge Thickness',
    //     unit: 'mm',
    //     default_value: 2,
    }],
    draw(drawable, params) {
        let vertices: Vector2[] = [
            Vector2.x(params.width / 2),
        ];
        let peek = (cb?: (v: Vector2) => void) => {
            let v = vertices[vertices.length - 1]!;
            cb?.(v);
            return v;
        }

        peek(last => {
            for (let i = 1; i < 90; i += 1) {
                let r = Vector2.polar(params.radius, Angle.degree(i));
                let v = last.subtract(Vector2.x(params.radius)).add(r);
                if (v.x < 0) break;

                vertices.push(v);
            }
        });

        let turned_edge_vertices: Vector2[] = [
            vertices[0]!,
            vertices[1]!,
        ];

        drawable.session(() => {
            for (let i = 2; i < vertices.length; ++i) {
                let a = turned_edge_vertices[turned_edge_vertices.length - 1]!;
                let b = vertices[i]!;
                let l = b.subtract(a);

                let last_seg = a.subtract(turned_edge_vertices[turned_edge_vertices.length - 2]!);

                if (Math.abs(l.theta.degree - last_seg.theta.degree) < params.turned_edge_threshold) {
                    turned_edge_vertices.pop();
                }

                turned_edge_vertices.push(b);
            }
        });

        peek(last => {
            let d = params.length / 2 - last.y;

            vertices = vertices.map(v => v.add(Vector2.y(d)));
            turned_edge_vertices = turned_edge_vertices.map(v => v.add(Vector2.y(d)));
        });

        vertices = complete(vertices);
        turned_edge_vertices = complete(turned_edge_vertices);

        drawable.trace(vertices, true);

        drawable.session(() => {
            if (!params.turned_edge) return;

            drawable.ctx.setLineDash([ 3, 3 ]);

            let segments: [ Vector2, Vector2 ][] = [];

            for (let [ a, b ] of pairs(turned_edge_vertices)) {
                let d = b.subtract(a);
                if (d.r < 1) continue;

                segments.push([ a, b ]);
            };

            for (let [ s1, s2 ] of pairs(segments)) {
                let [ a, b ] = s1;
                let [ c, d ] = s2;

                let d1 = b.subtract(a);
                let d2 = d.subtract(c);
                let bisect = Vector2.polar(
                    params.turned_edge,
                    d2.theta.bisect(d1.theta).add(Angle.degree(90))
                );

                // a = a.add(d1.rotate(Angle.degree(-90)).scale_to(params.turned_edge_offset));
                // b = b.add(d1.rotate(Angle.degree(-90)).scale_to(params.turned_edge_offset));

                // c = c.add(d2.rotate(Angle.degree(-90)).scale_to(params.turned_edge_offset));
                // d = d.add(d2.rotate(Angle.degree(-90)).scale_to(params.turned_edge_offset));

                drawable.line(a, b);

                let v = b.add(c).scale(0.5);

                let inner = v.add(bisect);
                let o1 = inner.mirror(a, b);
                let o2 = inner.mirror(c, d);

                let offset = bisect
                    .rotate(Angle.degree(180))
                    .scale_to(params.turned_edge_offset);

                v = v.add(offset);
                drawable.line(inner, v);
                drawable.line(v, o1);
                drawable.line(v, o2);

                // let t1 = d1.rotate(Angle.degree(-90)).scale_to(params.turned_edge_thickness);
                // let t2 = d2.rotate(Angle.degree(-90)).scale_to(params.turned_edge_thickness);

                // drawable.trace([ v.add(offset), v.add(t1), o1.add(t1) ]);
                // drawable.trace([ v.add(offset), v.add(t2), o2.add(t2) ]);
            }
        });

        function* pairs<T>(vertices: T[]) {
            for (let i = 0; i < vertices.length; ++i) {
                yield [ vertices[i]!, vertices[(i + 1) % vertices.length]! ] satisfies [ T, T ]
            }
        }

        function complete(list: Vector2[]) {
            let ret = list;

            let flip_y: Vector2[] = [];
            for (let i = ret.length - 1; i >= 0; --i) {
                flip_y.push(ret[i]!.flip_y());
            }
            ret = ret.concat(flip_y);

            let flip_x: Vector2[] = [];
            for (let i = ret.length - 1; i >= 0; --i) {
                flip_x.push(ret[i]!.flip_x());
            }
            return ret.concat(flip_x);
        }
    },
}

export default tapered_ear;