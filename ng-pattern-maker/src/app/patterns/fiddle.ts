import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { bail } from "../lib/error";
import { utils } from "../lib/utils";
import { Vector2 } from "../lib/vector2";

const pattern: PatternMaker<never> = {
    fields: [],
    draw(drawable) {
        const radius = 5;

        let vertices = [
            Vector2.x(40),
            Vector2.x(20),
            Vector2.cartesion(0, 20),
            Vector2.cartesion(-90, 20),
            Vector2.cartesion(-20, -20),
            Vector2.cartesion(40, -20),
        ];

        drawable.trace(utils.round_corners(vertices, radius, { flags: utils.FLAGS.NOWRAP }));

        drawable.trace(utils.round_corners(vertices.map(v => v.add(Vector2.y(100))), radius), true);
    },
}

export default pattern