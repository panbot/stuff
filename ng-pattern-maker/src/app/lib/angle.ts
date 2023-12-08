
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

    get normalized_degree() {
        return this.normalize().degree;
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

    bisect(b: Angle) {
        let center = (this.radian + b.radian) / 2;
        if (Math.cos(this.radian - center) < 0) {
            center += Math.PI;
        }
        return Angle.radian(center);
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

    static zero = Angle.degree(0);
}
