import { Angle } from "./angle";

export class Vector2 {

    #x: number;
    #y: number;

    #r?: number;
    #theta?: Angle;

    private constructor(
        x: number,
        y: number,
        r?: number,
        theta?: Angle,
    ) {
        this.#x = x;
        this.#y = y;
        this.#r = r;
        this.#theta = theta;
    }

    get r() {
        if (this.#r == null) {
            this.#r = Math.sqrt(this.x * this.x + this.y * this.y);
        }

        return this.#r
    }

    get theta() {
        if (this.#theta == null) {
            let rad = Math.acos(this.x / this.r);
            if (this.y < 0) rad = Math.PI * 2 - rad;

            this.#theta = Angle.radian(rad);
        }

        return this.#theta;
    }

    get x() {
        return this.#x;
    }

    get y() {
        return this.#y;
    }

    get xy() {
        return [ this.#x, this.#y ] satisfies [ x: number, y: number ]
    }

    add(v: Vector2) {
        return Vector2.cartesion(
            this.x + v.x,
            this.y + v.y,
        )
    }

    subtract(v: Vector2) {
        return Vector2.cartesion(
            this.x - v.x,
            this.y - v.y,
        )
    }

    scale(s: number) {
        return Vector2.cartesion(
            this.x * s,
            this.y * s,
        )
    }

    scale_to(r: number) {
        return Vector2.polar(
            r,
            this.theta,
        );
    }

    unit() {
        return Vector2.polar(
            1,
            this.theta,
        )
    }

    rotate(r: Angle) {
        if (this.r == 0) return Vector2.zero;

        return Vector2.polar(
            this.r,
            Angle.radian(this.theta.radian + r.radian),
        )
    }

    flip_x() {
        return Vector2.cartesion(this.x, -this.y);
    }

    flip_y() {
        return Vector2.cartesion(-this.x, this.y);
    }

    mirror(from: Vector2, to: Vector2) {
        let v = this.subtract(from);
        return v.rotate(v.theta.subtract(to.subtract(from).theta).scale(-2)).add(from);
    }

    static cartesion(x: number, y: number) {
        return new Vector2(x, y);
    }

    static x(x: number) {
        return new Vector2(x, 0);
    }

    static y(y: number) {
        return new Vector2(0, y);
    }

    static polar(r: number, theta: Angle) {
        return new Vector2(
            r * Math.cos(theta.radian),
            r * Math.sin(theta.radian),
            r,
            theta,
        );
    }

    static zero = new Vector2(0, 0, 0, Angle.zero);
}