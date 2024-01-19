import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { utils } from "../lib/utils";
import { Vector2 } from "../lib/vector2";

type FIELDS
    = 'length'
    | 'width'
    | 'segments'
    | 'interval'
    | 'offset'
    | 'edge_stitch_offset'
    | 'turned_edge'
;

const diamond_grid: PatternMaker<FIELDS> = {
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
        name: 'segments',
        label: 'Grid Segments',
        unit: '',
        default_value: 3,
    }, {
        name: 'interval',
        label: 'Grid Punch Interval',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'offset',
        label: 'Grid Offset',
        unit: 'mm',
        default_value: 10,
    }, {
        name: 'edge_stitch_offset',
        label: 'Edge Stitch Offset',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'turned_edge',
        label: 'Turned Edge',
        unit: 'mm',
        default_value: 10,
    }],
    draw(drawable, params) {
        let face = utils.get_rect(
            params.width,
            params.length,
        );
        drawable.trace(face, true);

        drawable.session(() => {
            if (params.edge_stitch_offset <= 0) return;
            for (let [ a, b ] of utils.get_pairs(face)) {
                utils.stitch(drawable, a, b, {
                    interval: params.interval,
                    offset: params.edge_stitch_offset,
                    skip: 0,
                    start_offset: 1,
                    end_offset: 1,
                });
            }
        })

        drawable.session(() => {
            if (params.segments <= 0) return;

            let offset = utils.get_rect(
                params.width - params.offset * 2,
                params.length - params.offset * 2,
            );

            for (let [ a, b ] of utils.get_pairs(offset)) {
                make_holes_to(a, b);
            }

            let [ a, b, c, d ] = offset;
            make_diagonal_holes(a, c);
            make_diagonal_holes(c, a, 1);
            make_diagonal_holes(b, d);
            make_diagonal_holes(d, b, 1);

            function make_diagonal_holes(
                from: Vector2,
                to: Vector2,
                start?: number,
            ) {
                let r = to.subtract(from);
                let dx = r.x / params.segments;
                let [ interval, n ] = find_interval(r.r, 2);
                let step = r.scale_to(interval);

                for (let i = start ?? 0; i < params.segments; ++i) {
                    make_holes_step(
                        from.add(Vector2.x(dx * i)),
                        step,
                        n * (params.segments - i) / params.segments,
                    )
                }
            }

            function make_holes_to(from: Vector2, to: Vector2) {
                let edge = to.subtract(from);
                let [ interval, n ] = find_interval(edge.r);
                let step = edge.scale_to(interval);

                make_holes_step(from, step, n);
            }

            function make_holes_step(from: Vector2, step: Vector2, n: number) {
                let hole = step.scale_to(0.25);

                for (let i = 0; i <= n; ++i) {
                    let center = from.add(step.scale(i));
                    drawable.line(center.subtract(hole), center.add(hole));
                }
            }

            function find_interval(distance: number, coef = 1) {
                let target = Math.abs(params.interval) || 3;
                coef *= params.segments;
                let n = Math.round(distance / target / coef) * coef;
                return [ distance / n, n ] as const
            }
        });
    }
}


type FIELDS2
    = 'length'
    | 'width'
    | 'length_segments'
    | 'width_segments'
    | 'interval'
    | 'offset'
    | 'edge_stitch_offset'
    | 'turned_edge'
;

const diamond_grid2: PatternMaker<FIELDS2> = {
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
        name: 'length_segments',
        label: 'Grid Segments (Length)',
        unit: '',
        default_value: 3,
    }, {
        name: 'width_segments',
        label: 'Grid Segments (Width)',
        unit: '',
        default_value: 3,
    }, {
        name: 'interval',
        label: 'Grid Punch Interval',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'offset',
        label: 'Grid Offset',
        unit: 'mm',
        default_value: 10,
    }, {
        name: 'edge_stitch_offset',
        label: 'Edge Stitch Offset',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'turned_edge',
        label: 'Turned Edge',
        unit: 'mm',
        default_value: 10,
    }],
    draw(drawable, params) {
        let face = utils.get_rect(
            params.width,
            params.length,
        );
        drawable.trace(face, true);

        drawable.session(() => {
            if (params.edge_stitch_offset <= 0) return;
            for (let [ a, b ] of utils.get_pairs(face)) {
                utils.stitch(drawable, a, b, {
                    interval: params.interval,
                    offset: params.edge_stitch_offset,
                    skip: 0,
                    start_offset: 1,
                    end_offset: 1,
                });
            }
        })

        drawable.session(() => {
            if (
                params.length_segments <= 0 ||
                params.width_segments <= 0
            ) return;

            let offset = utils.get_rect(
                params.width - params.offset * 2,
                params.length - params.offset * 2,
            );

            let [ a, b, c, d ] = offset;

            make_holes_to(a, b, params.width_segments);
            make_holes_to(b, c, params.length_segments);
            make_holes_to(c, d, params.width_segments);
            make_holes_to(d, a, params.length_segments);

            make_diagonal_holes(
                [ a, b, c ],
                [ params.width_segments, params.length_segments ],
            );

            make_diagonal_holes(
                [ a, b, c ],
                [ params.width_segments, params.length_segments ],
                true,
            );

            make_diagonal_holes(
                [ c, d, a ],
                [ params.width_segments, params.length_segments ],
                false,
                1,
            );

            make_diagonal_holes(
                [ c, d, a ],
                [ params.width_segments, params.length_segments ],
                true,
                1,
            );

            make_diagonal_holes(
                [ b, c, d ],
                [ params.length_segments, params.width_segments ],
            );

            make_diagonal_holes(
                [ b, c, d ],
                [ params.length_segments, params.width_segments ],
                true,
            );

            make_diagonal_holes(
                [ d, a, b ],
                [ params.length_segments, params.width_segments ],
                false,
                1,
            );

            make_diagonal_holes(
                [ d, a, b ],
                [ params.length_segments, params.width_segments ],
                true,
                1,
            );

            function make_diagonal_holes(
                corner: [ Vector2, Vector2, Vector2 ],
                segments: [ number, number ],
                clockwise = false,
                skip = 0,
            ) {
                if (clockwise) {
                    corner.reverse();
                    segments.reverse();
                }

                let [ a, b, c ] = corner;
                let [ s0, s1 ] = segments;
                if (s0 == s1 && clockwise) return;

                let ab = b.subtract(a);
                let bc = c.subtract(b);
                let s_ab = ab.scale(1 / s0);
                let s_bc = bc.scale(1 / s1);
                let theta = Angle.atan(s_bc.r / s_ab.r);
                let diagonal = get_diagonal();

                let [ interval ] = find_interval(
                    diagonal.r,
                    Math.min(...segments) * 2,
                );

                let ilen = s0 <= s1 ? s0 : s0 - s1;
                for (let i = skip; i < ilen; ++i) {
                    let ratio = (s0 - i) / s0;
                    let v = get_diagonal(ratio);
                    make_holes_step(
                        a.add(s_ab.scale(i)),
                        v.scale_to(interval),
                        v.r / interval,
                    );
                }

                function get_diagonal(ratio = 1) {
                    let v = ab
                        .rotate(theta.scale(clockwise ? -1 : 1))
                        .scale(1 / theta.cos())
                        .scale(ratio);
                    v = v.scale_to(Math.min(v.r, bc.scale(1 / theta.sin()).r));

                    return v;
                }
            }

            function make_holes_to(from: Vector2, to: Vector2, segments: number) {
                let edge = to.subtract(from);
                let [ interval, n ] = find_interval(edge.r, segments);
                let step = edge.scale_to(interval);

                make_holes_step(from, step, n);
            }

            function make_holes_step(from: Vector2, step: Vector2, n: number) {
                let hole = step.scale_to(0.25);

                for (let i = 0; i <= n; ++i) {
                    let center = from.add(step.scale(i));
                    drawable.line(center.subtract(hole), center.add(hole));
                }
            }

            function find_interval(distance: number, segments: number) {
                let target = Math.abs(params.interval) || 3;
                let n = Math.round(distance / target / segments) * segments;
                return [ distance / n, n ] as const
            }
        });
    }
}

export default diamond_grid2;