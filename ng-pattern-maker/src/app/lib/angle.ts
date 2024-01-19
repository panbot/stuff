
export class Angle {

    #radian: number;

    private constructor(radian: number) {
        this.#radian = radian;
    }

    get radian() {
        return this.#radian;
    }

    get degree() {
        return this.#radian / Math.PI / 2 * 360;
    }

    add(b: Angle) {
        return new Angle(this.radian + b.radian);
    }

    subtract(b: Angle) {
        return new Angle(this.radian - b.radian);
    }

    scale(n: number) {
        return new Angle(this.radian * n);
    }

    mutate_degree(cb: (degree: number) => number) {
        return Angle.degree(cb(this.degree));
    }

    bisect(b: Angle) {
        let center = (this.radian + b.radian) / 2;
        if (Math.cos(this.radian - center) < 0) {
            center += Math.PI;
        }
        return Angle.radian(center);
    }

    abs() {
        return Angle.radian(Math.abs(this.radian));
    }

    sin() {
        return Math.sin(this.radian);
    }

    cos() {
        return Math.cos(this.radian);
    }

    tan() {
        return Math.tan(this.radian);
    }

    normalize() {
        return Angle.degree((this.degree % 360 + 360) % 360)
    }

    static radian(radian: number) {
        return new Angle(radian);
    }

    static degree(degree: number) {
        return new Angle(degree / 360 * Math.PI * 2);
    }

    static atan(n: number) {
        return new Angle(Math.atan(n));
    }

    static zero = Angle.degree(0);
    static PI = Angle.radian(Math.PI);
}
