import { PatternMaker } from ".";
import { Angle } from "../lib/angle";
import { bail } from "../lib/error";
import { utils } from "../lib/utils";
import { Vector2 } from "../lib/vector2";

const qianyu: PatternMaker<never> = {
    fields: [],
    draw(drawable) {
        circle(Vector2.zero, 54);
        circle(Vector2.cartesion(26, -5), 13);
        circle(Vector2.cartesion(-26, -5), 13);
        circle(Vector2.cartesion(40.8, -12.6), 13);
        circle(Vector2.cartesion(-40.8, -12.6), 13);
        circle(Vector2.y(-11.36), 18);

        drawable.line(Vector2.x(-100), Vector2.x(100));
        drawable.line(Vector2.y(-100), Vector2.y(100));

        function circle(center: Vector2, radius: number) {
            drawable.arc(center.add(Vector2.x(radius)), Vector2.y(1), radius, Angle.PI.scale(2));

        }
    },
}

export default qianyu