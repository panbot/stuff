import { __param } from "tslib";
import { PatternMaker } from "."
import { Vector2 } from "../lib/vector2";
import { Angle } from "../lib/angle";

type FIELDS
    = 'length'
    | 'width'
    | 'offset'
    | 'holes'
    | 'tooth'
    | 'angle'
;

const capsule_hole: PatternMaker<FIELDS> = {
    fields: [{
        name: 'length',
        label: 'Length',
        unit: 'mm',
        default_value: 30,
    }, {
        name: 'width',
        label: 'Width',
        unit: 'mm',
        default_value: 7,
    }, {
        name: 'offset',
        label: 'Offset',
        unit: 'mm',
        default_value: 2,
    }, {
        name: 'holes',
        label: 'Holes',
        default_value: 10,
    }, {
        name: 'tooth',
        label: 'Tooth Size',
        unit: 'mm',
        default_value: 3,
    }, {
        name: 'angle',
        label: 'Angle',
        unit: 'deg',
        default_value: 40,
    }],

    draw(drawable, params) {
        capsule(params.length, params.width);

        drawable.session(() => {
            drawable.ctx.strokeStyle = '#aaa';
            capsule(params.length + params.offset * 2, params.width + params.offset * 2);
        });

        {
            let d = Math.sin(Angle.degree(params.angle).radian) * params.tooth / 2;

            drawable.session(() => {
                drawable.ctx.strokeStyle = '#aaa';
                capsule(params.length + params.offset * 2 + d * 2, params.width + params.offset * 2 + d * 2);
            });

            let h1 = (params.length - params.width) / 2;
            let r = params.width / 2 + params.offset + d;
            let s = h1 + Math.PI * r / 2;
            let interval = s / (params.holes - 1);

            punch(Vector2.x(r), Angle.degree(90));
            punch(Vector2.x(-r), Angle.degree(-90));

            punch(Vector2.y( h1 + r), Angle.degree(180));
            punch(Vector2.y(-h1 - r), Angle.degree(360));

            for (let i = 0; i < s; i += interval) {
                if (i <= h1) {
                    punch(Vector2.cartesion( r,  i), Angle.degree( 90));
                    punch(Vector2.cartesion( r, -i), Angle.degree( 90));
                    punch(Vector2.cartesion(-r,  i), Angle.degree(-90));
                    punch(Vector2.cartesion(-r, -i), Angle.degree(-90));
                } else {
                    let r1 = Vector2.polar(r, Angle.radian((i - h1) / r));
                    let v = Vector2.y(h1).add(r1);
                    punch(v, r1.theta.add(Angle.degree(90)));
                    punch(v.flip_x(), r1.flip_x().theta.add(Angle.degree(90)));

                    v = v.flip_y();
                    r1 = v.subtract(Vector2.y(h1));
                    punch(v, r1.theta.add(Angle.degree(90)));
                    punch(v.flip_x(), r1.flip_x().theta.add(Angle.degree(90)));
                }
            }
        }

        function capsule(length: number, width: number) {
            let r = width / 2;
            let c = length / 2 - r;

            drawable.arc(Vector2.y(-c), r, Angle.degree(180), Angle.zero);
            drawable.line(Vector2.cartesion( r, -c), Vector2.cartesion( r, c));
            drawable.line(Vector2.cartesion(-r, -c), Vector2.cartesion(-r, c));
            drawable.arc(Vector2.y(c), r, Angle.zero, Angle.degree(180));
        }

        function punch(pos: Vector2, direction: Angle) {
            let tooth = Vector2.polar(params.tooth / 2, direction.subtract(Angle.degree(params.angle)));
            drawable.line(pos, pos.add(tooth));
            drawable.line(pos, pos.add(tooth.scale(-1)));
        }
    }
}

export default capsule_hole