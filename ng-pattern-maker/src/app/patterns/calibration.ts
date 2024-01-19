import { PatternMaker } from ".";
import { Vector2 } from "../lib/vector2";

let calibration: PatternMaker<never> = {
    fields: [],
    draw(drawable) {
        drawable.text(`scale x: ${ drawable.scale[0] }`, Vector2.zero);
        drawable.text(`scale y: ${ drawable.scale[1] }`, Vector2.y(-5));
    }
}

export default calibration