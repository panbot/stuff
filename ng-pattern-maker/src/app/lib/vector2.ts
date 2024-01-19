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
            Math.abs(r),
            r >= 0 ? theta : theta.add(Angle.PI),
        );
    }

    static zero = new Vector2(0, 0, 0, Angle.zero);
}

export namespace Vector2 {

    export type TWO = [ Vector2, Vector2 ];
    export type FOUR = [ ...TWO, ...TWO ];

    export function find_cross(
        [ a, b ]: [ Vector2, Vector2 ],
        [ c, d ]: [ Vector2, Vector2 ],
    ) {
        check_line(a, b);
        check_line(c, d);

        let l1 = b.subtract(a);
        let l2 = d.subtract(c);

        let a1 = l1.theta.normalize().radian;
        let a2 = l2.theta.normalize().radian;

        // parallel
        if (Math.abs(a1 - a2) < 1e-9) return;

        // transform to new axis where a is the center, l1 points to y
        let rotation = Angle.degree(90 - l1.theta.degree);
        let transition = a.scale(-1);

        [ c, d ] = transform([ c, d ], transition, rotation);
        // y = kx + l
        let k = (c.y - d.y) / (c.x - d.x);
        let l = c.y - k * c.x;
        let cross = Vector2.y(l);

        return transform([ cross ], transition, rotation, true)[0]

        function check_line(a: Vector2, b: Vector2) {
            if (a.subtract(b).r < 1e-9) throw new Error(`[ ${ a.xy }, ${b.xy} ] is not a line`);
        }

        function transform<T extends Vector2[]>(
            vertices: T,
            transition: Vector2,
            rotate: Angle,
            reverse = false
        ): T {
            if (!reverse) return vertices.map(v => v.add(transition).rotate(rotate)) as any
            return vertices.map(v => v.rotate(rotate.scale(-1)).subtract(transition)) as any
        }
    }
}