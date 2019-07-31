export class MinkowskiSpaceCoordinates {
    constructor(
        public s: number,
        public t: number,
    ) {}

    add(s: number, t: number) {
        return new MinkowskiSpaceCoordinates(
            this.s + s,
            this.t + t,
        )
    }

    subtract(s: number, t: number) {
        return this.add(-s, -t);
    }
}

export function st(s: number, t: number) {
  return new MinkowskiSpaceCoordinates(s, t);
}

export const st0 = st(0, 0);

export class LorentzTransformation {
    private gamma: number;

    constructor(
        public boost: number,
    ) {
        this.gamma = 1 / Math.sqrt(1 - boost * boost);
    }

    transform(st: MinkowskiSpaceCoordinates) {
        let { s, t } = st;
        return new MinkowskiSpaceCoordinates(
            this.gamma * (s - this.boost * t),
            this.gamma * (t - this.boost * s),
        )
    }
}

export type XY = { x: number, y: number };


