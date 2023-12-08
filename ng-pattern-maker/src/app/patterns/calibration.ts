import { PatternMaker } from ".";
import { Vector2 } from "../lib/vector2";

let calibration: PatternMaker<never> = {
    fields: [],
    draw(drawable) {
        drawable.text(`scale: ${ drawable.scale }`, Vector2.zero);
    }
}

export default calibration