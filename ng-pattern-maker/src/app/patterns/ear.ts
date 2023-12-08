import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { bail } from "../lib/error";
import { Vector2 } from "../lib/vector2";

type FIELDS
    = 'start_angle'
    | 'start_length'
    | 'angle1'
    | 'radius1'
    | 'radius2'
    | 'neck_length'
    | 'flip'
    | 'offset'
;

const ear_pattern: PatternMaker<FIELDS> = {
    fields: [{
        name: 'start_angle',
        label: 'Start Angle',
        unit: 'deg',
        default_value: 22,
    }, {
        name: 'start_length',
        label: 'Start Length',
        unit: 'mm',
        default_value: 1,
    }, {
        name: 'angle1',
        label: 'Angle 1',
        unit: 'deg',
        default_value: 104,
    }, {
        name: 'radius1',
        label: 'Radius 1',
        unit: 'mm',
        default_value: 31,
    }, {
        name: 'radius2',
        label: 'Radius 2',
        unit: 'mm',
        default_value: 37,
    }, {
        name: 'neck_length',
        label: 'Neck Length',
        unit: 'mm',
        default_value: 12,
    }, {
        name: 'flip',
        label: 'Flip',
        unit: 'pts',
        default_value: 44,
    }, {
        name: 'offset',
        label: 'Offset',
        unit: 'mm',
        default_value: 6,
    }],
    draw(drawable, params) {

        const base = Vector2.y(0);

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
        let pairs = function* () {
            for (let i = 0; i < verticies.length - 1; ++i) {
                yield [verticies[i]!, verticies[i + 1]!] satisfies [Vector2, Vector2]
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

        const { start_angle, start_length, angle1, radius1, radius2, neck_length, flip } = params;
        const end_angle = start_angle + angle1;

        go(start_length, Angle.degree(start_angle));

        let max_x = Vector2.zero;
        for (let i = 0; i < end_angle - start_angle; ++i) {
            let v = go(Angle.degree(1).radian * radius1, Angle.degree(1));
            if (v.x > max_x.x) max_x = v;
        }

        measure_length(
            Vector2.cartesion(max_x.x, -20),
            Vector2.cartesion(-max_x.x, -20),
            {
                offset: Vector2.polar(10, Angle.degree(-45)),
                anchor: 0.9,
                end_size: 100,
            },
        );

        for (let i = 0; i < end_angle - 90; ++i) {
            go(Angle.degree(1).radian * radius2, Angle.degree(-1));
        }

        peek(last => {

            let list: Vector2[] = [];
            for (let [a, b] of pairs()) {
                let p = b.subtract(a).rotate(Angle.degree(90)).scale_to(params.offset);
                list.push(a.add(p));
                list.push(b.add(p));
            }

            drawable.session(() => {
                drawable.ctx.setLineDash([ 3, 3 ]);
                drawable.ctx.strokeStyle = 'gray';
                drawable.trace(list);
                drawable.trace(list.map(v => v.mirror(Vector2.x(last.x), last)));
                drawable.trace(list.map(v => v.mirror(Vector2.x(last.x), last)).map(v => v.mirror(Vector2.zero, Vector2.y(last.y))));
                drawable.trace(list.map(v => v.mirror(Vector2.y(-1), Vector2.zero)));
            });
        })

        go(neck_length / 2, Angle.zero);

        peek(v => {
            let v_mirror = v.mirror(Vector2.zero, Vector2.y(1));

            measure_length(
                Vector2.cartesion(v.x, -5),
                Vector2.cartesion(-v.x, -5), {
                    anchor: 0.9,
                    offset: Vector2.polar(12, Angle.degree(-45)),
                    end_size: 5,
                },
            );

            {
                let from = Vector2.cartesion(50, base.y);
                let to = Vector2.cartesion(from.x, v.y)
                measure_length(from, to, {
                    offset: Vector2.polar(10, Angle.degree(45)),
                    end_size: 100,
                });
            }

            drawable.session(() => {
                // drawable.ctx.setLineDash([ 3, 3 ]);
                drawable.ctx.strokeStyle = 'gray';
                drawable.line(v, Vector2.cartesion(v.x, 0));
                drawable.line(v_mirror, Vector2.cartesion(-v.x, 0));
                drawable.line(verticies[0]!, Vector2.y(v.y))
            })

            let to_add: Vector2[] = [];
            for (let i = 0; i < flip; ++i) {
                let m = verticies[verticies.length - 1 - i];
                if (!m) break;
                to_add.push(Vector2.cartesion(m.x, v.y + v.y - m.y));
            }
            verticies = verticies.concat(to_add);

        });

        goto(Vector2.cartesion(1, peek().y));

        for (let i = verticies.length - 1; ; --i) {
            let v = verticies[i];
            if (!v) break;
            verticies.push(Vector2.cartesion(-v.x, v.y));
        }

        drawable.trace(verticies);

        function measure_length(
            from: Vector2,
            to: Vector2,
            options?: {
                offset?: Vector2,
                anchor?: number,
                end_size?: number
            },
        ) {
            const end_size = options?.end_size ?? 1;

            drawable.session(() => {
                // drawable.ctx.setLineDash([ 3, 3 ]);
                drawable.ctx.strokeStyle = 'gray';

                let length = to.subtract(from);
                drawable.line(from, from.add(length.rotate(Angle.degree( 90)).scale_to(end_size)));
                drawable.line(from, from.add(length.rotate(Angle.degree(-90)).scale_to(end_size)));

                drawable.line(from, to);

                drawable.line(to, to.add(length.rotate(Angle.degree( 90)).scale_to(end_size)));
                drawable.line(to, to.add(length.rotate(Angle.degree(-90)).scale_to(end_size)));

                let text = `${ length.r.toFixed(2) } mm`;
                let anchor = from.add(to.subtract(from).scale(options?.anchor ?? 0.5));
                let text_pos = anchor.add(options?.offset ?? Vector2.zero);
                drawable.line(anchor, text_pos);

                let align: 'right' | 'left';
                let c: number;
                if (text_pos.x < anchor.x) {
                    align = 'right';
                    c = -1;
                } else {
                    align = 'left';
                    c = 1;
                }
                let { width } = drawable.text(text, text_pos, { align });
                drawable.line(text_pos, text_pos.add(Vector2.x(c * width / 2)));

            });
        }
    },
}

export default ear_pattern;