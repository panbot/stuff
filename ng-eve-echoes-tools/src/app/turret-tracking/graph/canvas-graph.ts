
export type XY = { x: number, y: number };

export class CanvasGraph {

  ctx: CanvasRenderingContext2D;

  origin: XY;

  paddingTop = 30;
  paddingRight = 30;
  paddingLeft = 50;
  paddingBottom = 30;

  gridWidth: number;
  gridHeight: number;

  range: number;

  constructor(
    public canvas: HTMLCanvasElement,
    public width: number,
    public height: number,
  ) {
    this.origin = {
      x: this.paddingLeft,
      y: height - this.paddingBottom,
    };

    this.ctx = canvas.getContext('2d');

    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = this.width * dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.height = this.height * dpr;
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(dpr, dpr);

    this.gridWidth = width - this.paddingLeft - this.paddingRight;
    this.gridHeight = height - this.paddingTop - this.paddingBottom;
  }

  plot(func: (r: number) => number, style: string) {
    let step = this.range / this.gridWidth;
    let sMax = -Infinity;
    let rMax: number;
    for (let r0 = 0; r0 < this.range; r0 += step) {
      let s0 = func(r0) * 100;
      if (s0 > sMax) {
        sMax = s0;
        rMax = r0;
      }
      let r1 = r0 + step;
      let s1 = func(r1) * 100;

      this.lineXY(
        this.transform(r0, s0),
        this.transform(r1, s1),
        style,
      );
    }

    this.dotXY(
      this.transform(rMax, sMax),
      3,
      style,
      `${rMax.toFixed(1)}km, ${sMax.toFixed(2)}%`,
    );
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid(range: number) {
    this.range = range;

    let style = 'rgba(200, 200, 200, 0.5)';

    for (let r = 0 ; r <= this.range; ++r) {
      this.lineXY(
        this.transform(r, 0),
        this.transform(r, 100),
        style,
      );
    }

    for (let s = 0; s <= 100; ++s) {
      this.lineXY(
        this.transform(0, s),
        this.transform(this.range, s),
        style,
      );
    }

    this.ctx.save();

    style = 'rgb(100, 100, 100)';

    this.ctx.fillStyle = style;

    this.ctx.font = '12px';

    let labelWidth = this.ctx.measureText(`${this.range}km`).width;
    let step = 1;
    for (; this.range / step * labelWidth > this.gridWidth; step *= 10);

    for (let r = 0; r <= this.range; r += step) {
      const { x, y } = this.transform(r, 0);
      let text = `${r}km`;
      let mesure = this.ctx.measureText(text);
      this.ctx.fillText(text, x, y + mesure.actualBoundingBoxAscent + 2);
    }

    for (let s = 0; s <= 100; s += 5) {
      const { x, y } = this.transform(0, s);
      let text = `${s}%`;
      let mesure = this.ctx.measureText(text);
      this.ctx.fillText(`${s}%`, x - mesure.width - 2, y + mesure.actualBoundingBoxAscent / 2);
    }

    this.ctx.restore();

    this.lineXY(
      this.transform(0, 0),
      this.transform(0, 100),
      style,
    );

    this.lineXY(
      this.transform(0, 0),
      this.transform(this.range, 0),
      style,
    );
  }

  transform(r: number, s: number): XY {
    return {
      x: this.origin.x + r / this.range * this.gridWidth,
      y: this.origin.y - s / 100 * this.gridHeight,
    }
  }

  lineXY(from: XY, to: XY, style: any) {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.moveTo(from.x, from.y);
    this.ctx.lineTo(to.x, to.y);
    this.ctx.closePath();
    this.ctx.strokeStyle = style;
    this.ctx.stroke();

    this.ctx.restore();
  }

  dotXY(xy: XY, size: number, style: any, text?: string) {
    this.ctx.save();

    const { x, y } = xy;

    this.ctx.beginPath();
    this.ctx.arc(x, y, size, 0, 2 * Math.PI);
    this.ctx.closePath();
    this.ctx.fillStyle = style;
    this.ctx.fill();

    if (text) {
      this.ctx.strokeStyle = style;
      this.ctx.strokeText(text, x + 2, y + 10);
    }

    this.ctx.restore();
  }

}