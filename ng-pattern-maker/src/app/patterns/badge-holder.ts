import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { utils } from "../lib/utils";
import { Vector2 } from "../lib/vector2";
import capsule_hole from "./capsule";

type FIELDS
    = 'width'
    | 'height'
    | 'offset'
    | 'shoulder'
    | 'radius'
;

type CORNERS = [ Vector2, Vector2, Vector2, Vector2 ];

let badge_holder: PatternMaker<FIELDS> = {
    fields: [{
        name: 'width',
        label: 'Card Width',
        unit: 'mm',
        default_value: 54.5,
    }, {
        name: 'height',
        label: 'Card Height',
        unit: 'mm',
        default_value: 87.5,
    }, {
        name: 'offset',
        label: 'Offset',
        unit: 'mm',
        default_value: 7,
    }, {
        name: 'shoulder',
        label: 'Shoulder',
        unit: 'mm',
        default_value: 7,
    }, {
        name: 'radius',
        label: 'Radius',
        unit: 'mm',
        default_value: 3,
    }],
    draw(drawable, params) {
        const stitch_margin = 2;

        const card_corners = utils.get_rect(params.width, params.height);

        drawable.session((ctx, drawable) => {
            ctx.setLineDash([ 5, 5 ]);
            drawable.trace(card_corners, true);
        });

        let window_offset = 7;
        const window = utils.offset(card_corners, -window_offset);
        drawable.trace(utils.round_corners(window, 5), true);

        const offset = utils.offset(card_corners, params.offset);
        let [ a, b, c, d ] = offset;
        drawable.line(a, b);
        drawable.trace(utils.round_corners(
            [ b, c, d, a ],
            params.radius,
            { flags: utils.FLAGS.NOWRAP }
        ));

        {
            let start_offset = 1;
            let end_offset = 1;
            let offset = stitch_margin;
            let skip = 1;
            utils.stitch(drawable, b, c, { start_offset, end_offset, offset });
            utils.stitch(drawable, c, d, { start_offset, end_offset, offset, skip });
            utils.stitch(drawable, d, a, { start_offset, end_offset, offset, skip });
        }

        // magnets
        {
            let r = 1.5;
            let d = r / Angle.degree(135 / 2).tan();
            let v = card_corners[2].add(Vector2.cartesion(-r, r - d));
            // drawable.arc(v, r, Angle.zero);
            // drawable.text('N', v, { valign: 'middle' });
            // v = card_corners[2].add(Vector2.cartesion(d, -r));
            // drawable.arc(v, r, Angle.zero);
            // drawable.text('S', v, { valign: 'middle' });

            // v = card_corners[3].add(Vector2.cartesion(-d, -r));
            // drawable.arc(v, r, Angle.zero);
            // drawable.text('N', v, { valign: 'middle' });

            // v = card_corners[3].add(Vector2.cartesion(r, r - d));
            // drawable.arc(v, r, Angle.zero);
            // drawable.text('S', v, { valign: 'middle' });
        }

        // capsule
        drawable.session((ctx, d) => {
            let length = 15;
            let width = 4;

            capsule_hole.draw(d, {
                length,
                width,
                offset: 2,
                holes: 5,
                tooth: 2,
                angle: 45,
            })

        }, [ offset[0].add(offset[1]).scale(0.5).add(Vector2.y(7)), Angle.degree(90) ])
        // {
        //     let width = 15;
        //     let height = 4;
        //     let center = offset[0].add(offset[1])
        //                                .scale(0.5)
        //                                .add(Vector2.y(7));

        //     let hole = utils.get_rect(
        //         width,
        //         height,
        //         center,
        //     );
        //     let round_corners = utils.round_corners(hole, height / 2 - 0.1);
        //     drawable.trace(round_corners, true);
        // }

        // shoulder
        {
            let h1 = 9.5;
            let h2 = 5;
            let x1 = 10;
            let x2 = 3;

            let shoulder = [
                offset[0].add(Vector2.zero),
                offset[0].add(Vector2.y(h1)),
                Vector2.cartesion(x1 + x2, offset[0].add(Vector2.y(h1)).y),
                Vector2.cartesion(x1, offset[0].add(Vector2.y(h1 + h2)).y),
            ];

            shoulder = shoulder.concat([ ...shoulder ].reverse().map(v => v.flip_y()));

            {
                let x = shoulder[0]!;
                let y = shoulder[1]!;
                utils.stitch(drawable, x, y, {});

                x = x.flip_y();
                y = y.flip_y();
                utils.stitch(drawable, y, x, { start_offset: 1, skip: 1 });
            }

            {
                let x = shoulder[1]!;
                let y = shoulder[2]!.subtract(Vector2.x(2.2));
                utils.stitch(drawable, x, y, { start_offset: 1, skip: 1 });

                x = x.flip_y();
                y = y.flip_y();
                utils.stitch(drawable, y, x, { start_offset: 1 });
            }

            // let shoulder: Vector2[] = [];
            // let x = offset[0];
            // let y = x.add(Vector2.y(hole_margin + height / 2 + stitch_margin * 2));
            // shoulder.push(x, y);
            // utils.stitch(drawable, x, y, {});

            // x = y;
            // y = Vector2.cartesion(width / 2, y.y);
            // shoulder.push(y);
            // utils.stitch(drawable, x, y, { start_offset: 1, skip: 1 });



            // shoulder = shoulder.concat([ ...shoulder ].reverse().map(v => v.flip_y()));
            drawable.trace(
                utils.round_corners(
                    shoulder,
                    params.radius,
                    { flags: utils.FLAGS.NOWRAP },
                )
            );
        }
    },
}

export default badge_holder