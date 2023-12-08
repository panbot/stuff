import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { Vector2 } from "../lib/vector2";

type fields
    = 'width'
    | 'height'
    | 'offset'
    | 'head'
    | 'fold'
    | 'thickness'
    | 'ear'
;

let badge_holder: PatternMaker<fields> = {
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
        default_value: 5,
    }, {
        name: 'head',
        label: 'Head',
        unit: 'mm',
        default_value: 7,
    }, {
        name: 'fold',
        label: 'Fold',
        unit: 'mm',
        default_value: 5,
    }, {
        name: 'thickness',
        label: 'Thickness',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'ear',
        label: 'Ear',
        unit: 'mm',
        default_value: 8,
    }],
    draw(drawable, params) {

        drawable.session(() => {
            drawable.ctx.setLineDash([ 5, 3 ]);
            drawable.trace([
                Vector2.cartesion( params.width / 2, -params.height / 2),
                Vector2.cartesion( params.width / 2,  params.height / 2),
                Vector2.cartesion(-params.width / 2,  params.height / 2),
                Vector2.cartesion(-params.width / 2, -params.height / 2),
            ], true);
        })



        {
            let vertices: Vector2[] = [];

            const cover = 5;
            const cover_raius = 5;
            let v = Vector2.cartesion(params.width / 2 - cover, 1);

            vertices.push(v);
            vertices.push(v.add(Vector2.y(params.height / 2 - cover - cover_raius)));

            let step = 10;
            let center = Vector2.cartesion(
                params.width  / 2 - cover - cover_raius,
                params.height / 2 - cover - cover_raius,
            );
            for (let i = 0; i < 90; i += step) {
                vertices.push(center.add(Vector2.polar(cover_raius, Angle.degree(i))));
            }

            vertices.push(Vector2.cartesion(
                1,
                params.height / 2 - cover
            ));

            let mirror_x: Vector2[] = [];
            for (let i = vertices.length - 1; i >= 0; --i) {
                let v = vertices[i]!;
                mirror_x.push(Vector2.cartesion(
                    -v.x,
                    v.y,
                ));
            }
            vertices = vertices.concat(mirror_x);

            let mirror_y: Vector2[] = [];
            for (let i = vertices.length - 1; i >= 0; --i) {
                let v = vertices[i]!;
                mirror_y.push(Vector2.cartesion(
                    v.x,
                    -v.y
                ));
            }
            vertices = vertices.concat(mirror_y);

            drawable.trace(vertices, true);

            let offset = params.offset;
            let head = params.head;

            drawable.trace([
                Vector2.cartesion( params.width / 2 + offset, -params.height / 2 - offset),
                Vector2.cartesion( params.width / 2 + offset,  params.height / 2 + offset),
                Vector2.cartesion(-params.width / 2 - offset,  params.height / 2 + offset),
                Vector2.cartesion(-params.width / 2 - offset, -params.height / 2 - offset),
            ], true);
            drawable.trace([
                Vector2.cartesion( params.width / 2 + offset, params.height / 2 + offset),
                Vector2.cartesion( params.width / 2 + offset, params.height / 2 + offset + head),
                Vector2.cartesion(-params.width / 2 - offset, params.height / 2 + offset + head),
                Vector2.cartesion(-params.width / 2 - offset, params.height / 2 + offset),
            ]);

            drawable.line(
                Vector2.cartesion( params.ear / 2, params.height / 2 + offset + head),
                Vector2.cartesion( params.ear / 2, params.height / 2 + offset + head - 3),
            );
            drawable.line(
                Vector2.cartesion(-params.ear / 2, params.height / 2 + offset + head),
                Vector2.cartesion(-params.ear / 2, params.height / 2 + offset + head - 3),
            );

            if (params.fold) {
                let fold = (from: Vector2, to: Vector2) => {
                    let t1 = from.add(to  .subtract(from).rotate(Angle.degree(-90)).scale_to(params.thickness));
                    let t2 =   to.add(from.subtract(to  ).rotate(Angle.degree( 90)).scale_to(params.thickness));
                    let v1 =   t1.add(t2  .subtract(t1  ).rotate(Angle.degree(-45)).scale_to(params.fold * Math.SQRT2));
                    let v2 =   t2.add(t1  .subtract(t2  ).rotate(Angle.degree( 45)).scale_to(params.fold * Math.SQRT2));

                    drawable.trace([ from, t1, v1, v2, t2, to ]);
                }

                fold(
                    Vector2.cartesion(params.width / 2 + offset, -params.height / 2 - offset),
                    Vector2.cartesion(params.width / 2 + offset,  params.height / 2 + offset + head),
                );

                fold(
                    Vector2.cartesion(-params.width / 2 - offset,  params.height / 2 + offset + head),
                    Vector2.cartesion(-params.width / 2 - offset, -params.height / 2 - offset),
                )

                fold(
                    Vector2.cartesion( params.width / 2 + offset, params.height / 2 + offset + head),
                    Vector2.cartesion(-params.width / 2 - offset, params.height / 2 + offset + head),
                );

                fold(
                    Vector2.cartesion(-params.width / 2 - offset, -params.height / 2 - offset),
                    Vector2.cartesion( params.width / 2 + offset, -params.height / 2 - offset),
                )
            }
        }
    },
}

export default badge_holder