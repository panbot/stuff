import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { Vector2 } from "../lib/vector2";

type FIELDS
    = 'width'
    | 'height'
    | 'offset'
    | 'radius'
    | 'head'
    | 'punch_interval'
    | 'ear'
    | 'fold_top'
;

type CORNERS = [ Vector2, Vector2, Vector2, Vector2 ];

let badge_holder: PatternMaker<FIELDS> = {
    fields: [{
        name: 'width',
        label: 'Card Width',
        unit: 'mm',
        default_value: 54,
    }, {
        name: 'height',
        label: 'Card Height',
        unit: 'mm',
        default_value: 86,
    }, {
        name: 'offset',
        label: 'Offset',
        unit: 'mm',
        default_value: 6,
    }, {
        name: 'radius',
        label: 'Radius',
        unit: 'mm',
        default_value: 4,
    }, {
        name: 'head',
        label: 'Head',
        unit: 'mm',
        default_value: 7,
    }, {
        name: 'punch_interval',
        label: 'Punch Interval',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'ear',
        label: 'Ear',
        unit: 'mm',
        default_value: 9,
    }, {
        name: 'fold_top',
        label: 'Fold Top',
        unit: 'mm',
        default_value: 33,
    }],
    draw(drawable, params) {

        let card_corner = Vector2.cartesion(params.width / 2, params.height / 2);
        let card_corners = get_rect(card_corner);
        drawable.session(() => {
            drawable.ctx.setLineDash([ 5, 3 ]);
            draw_rect(card_corners);
        });
        draw_rect(offset(get_rect(card_corner), -5), 5);

        let offset_corner = Vector2.cartesion(card_corner.x + params.offset, card_corner.y + params.offset);
        let offset_corners = get_rect(offset_corner);

        let corners: CORNERS = [
            offset_corners[0].add(Vector2.y(params.head)),
            offset_corners[1].add(Vector2.y(params.head)),
            offset_corners[2],
            offset_corners[3] ,
        ];
        if (params.head) {
            drawable.line(offset_corners[0], offset_corners[1]);
        }
        draw_rect(corners, params.radius);

        if (params.ear) {
            drawable.line(
                Vector2.cartesion(params.ear / 2, corners[0].y),
                Vector2.cartesion(params.ear / 2, corners[0].y).add(Vector2.y(-5)),
            );
            drawable.line(
                Vector2.cartesion(-params.ear / 2, corners[0].y),
                Vector2.cartesion(-params.ear / 2, corners[0].y).add(Vector2.y(-5)),
            );
        }

        if (params.fold_top) {
            drawable.trace([
                Vector2.cartesion(params.fold_top / 2, corners[0].y),
                Vector2.cartesion(params.fold_top / 2, corners[0].y).add(Vector2.y(10)),
                Vector2.cartesion(-params.fold_top / 2, corners[0].y).add(Vector2.y(10)),
                Vector2.cartesion(-params.fold_top / 2, corners[0].y),
            ])
        }


        const hole_to_edge = 3;
        {
            let punch_corners = offset(corners, -hole_to_edge);
            for (let [ a, b ] of pairs(punch_corners)) {
                stitch(a, b, { skip: 1 });
            }
        }

        function stitch(
            from: Vector2,
            to: Vector2,
            options?: {
                offset?: number,
                angle?: number,
                size?: number,
                skip?: number,
            },
        ) {
            const angle = options?.angle ?? 40;
            const size = options?.size ?? 1.5;

            if (options?.offset) {
                let d = to.subtract(from).scale_to(options.offset).rotate(Angle.degree(-90));
                from = from.add(d);
                to = to.add(d);
            }

            let d = to.subtract(from).scale_to(params.punch_interval);
            const punch = (v: Vector2) => {
                drawable.line(v, v.add(d.scale_to(size / 2).rotate(Angle.degree(angle))));
                drawable.line(v, v.add(d.scale_to(size / 2).rotate(Angle.degree(angle + 180))));
            }

            for (let i = 0; i < (options?.skip ?? 0); ++i) from = from.add(d);

            while (Math.cos(to.subtract(from).theta.radian - d.theta.radian) > 0) {
                punch(from);
                from = from.add(d);
            }
            punch(to);
        }

        function* pairs(vertices: Vector2[]) {
            for (let i = 0; i < vertices.length; ++i) {
                yield [ vertices[i]!, vertices[(i + 1) % vertices.length]! ] as const
            }
        }

        function offset<T extends Vector2[]>(vertices: T, offset: number) {
            return vertices.map((from, i) => {
                let to   = vertices[(i + 1) % vertices.length]!;
                let d = from.subtract(to).scale_to(offset);
                return from.add(d.rotate(Angle.degree(90))).add(d)
            }) as T
        }

        function get_rect(corner: Vector2): CORNERS {
            let [ x, y ]= corner.xy;
            return [
                Vector2.cartesion( x,  y),
                Vector2.cartesion(-x,  y),
                Vector2.cartesion(-x, -y),
                Vector2.cartesion( x, -y),
            ]
        }

        function draw_rect(
            corners: CORNERS,
            radius?: number,
        ){
            if (!radius) {
                drawable.trace(corners, true);
            } else {
                for (let i = 0; i < 4; ++i) {
                    let from = corners[i]!;
                    let to = corners[(i + 1) % 4]!;
                    let start_angle = Angle.degree(Math.floor(from.theta.normalize().degree / 90) * 90);
                    let end_angle = start_angle.add(Angle.degree(90));

                    let r = Vector2.polar(radius, start_angle);

                    drawable.line(from.subtract(r), to.add(r));

                    drawable.line(from.subtract(r), from.subtract(r).add(r.rotate(Angle.degree( 90)).scale_to(0.5)));
                    drawable.line(from.subtract(r), from.subtract(r).add(r.rotate(Angle.degree(-90)).scale_to(0.5)));

                    drawable.line(to.add(r), to.add(r).add(r.rotate(Angle.degree( 90)).scale_to(0.5)));
                    drawable.line(to.add(r), to.add(r).add(r.rotate(Angle.degree(-90)).scale_to(0.5)));

                    drawable.arc(
                        from.subtract(r).add(r.rotate(Angle.degree(-90))),
                        r.r,
                        start_angle,
                        end_angle,
                    );
                }
            }

            return corners;
        }

    },
}

export default badge_holder