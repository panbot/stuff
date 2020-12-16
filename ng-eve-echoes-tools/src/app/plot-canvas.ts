
type CanvasCoordinates = { x: number, y: number };
type PlotCoordinates = { h: number, v: number, };

type Axis = {
  step: number,
  unit: string,
  range: [ number, number ],
  resolution: number,
}

export class PlotCanvas {

  ctx: CanvasRenderingContext2D;

  scale: number;

  origin: CanvasCoordinates;

  grid: {
    paddings: {
      top: number,
      right: number,
      bottom: number,
      left: number,
    },
    width: number,
    height: number,
  };

  axes: {
    font: string,
    fontStyle: string,
    gridStyle: string,
    labelPadding: number,
    h: Axis,
    v: Axis,
  } = {
    font: '12px',
    fontStyle: 'rgb(100, 100, 100)',
    gridStyle: 'rgba(200, 200, 200, 0.5)',
    labelPadding: 5,
    h: {
      step: 1,
      unit: '',
      range: [ 0, 100 ],
      resolution: 1,
    },
    v: {
      step: 1,
      unit: '',
      range: [ 0, 100 ],
      resolution: 1,
    },
  };

  upscale = 1;

  constructor(
    public canvas: HTMLCanvasElement,
    public width: number,
    public height: number,
  ) {
    this.ctx = canvas.getContext('2d');

    this.scale = (window.devicePixelRatio || 1) * this.upscale;

    this.canvas.width = this.width * this.scale;
    this.canvas.style.width = this.width + 'px';
    this.canvas.height = this.height * this.scale;
    this.canvas.style.height = this.height + 'px';

    this.ctx.scale(this.scale, this.scale);
  }

  setAxes(opts: Partial<PlotCanvas['axes']>) {
    Object.assign(this.axes, opts);

    const hLabelMeasure = this.measureLabel(this.axes.h);
    const vLabelMeasure = this.measureLabel(this.axes.v);

    let paddings = {
      top: 10,
      right: hLabelMeasure[0],
      bottom: hLabelMeasure[1] + 2 * this.axes.labelPadding,
      left: vLabelMeasure[0] + 2 * this.axes.labelPadding,
    };

    this.grid = {
      paddings,
      width: this.width - paddings.left - paddings.right,
      height: this.height - paddings.top - paddings.bottom,
    };

    this.origin = {
      x: paddings.left,
      y: this.height - paddings.bottom,
    };

    this.findMajorStepH();
    this.findMajorStepV();

    return this;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    return this;
  }

  drawGrid() {
    // vertical lines
    for (
      let h = this.axes.h.range[0];
      h <= this.axes.h.range[1];
      h += this.axes.h.step
    ) {
      this.line(
        { h, v: 0 },
        { h, v: this.axes.v.range[1] },
        this.axes.gridStyle,
      );
    }

    // horizontal lines
    for (
      let v = this.axes.v.range[0];
      v <= this.axes.v.range[1];
      v += this.axes.v.step
    ) {
      this.line(
        { h: 0, v },
        { h: this.axes.h.range[1], v },
        this.axes.gridStyle,
      );
    }

    this.ctx.save();
    this.ctx.fillStyle = this.axes.fontStyle;
    this.ctx.font = this.axes.font;

    for (
      let h = this.axes.h.range[0];
      h <= this.axes.h.range[1];
      h += this.axes.h.step
    ) {
      this.text(
        `${h}${this.axes.h.unit}`,
        { h, v: 0 },
        [ 'left', 'top' ],
        [ 0, this.axes.labelPadding ],
        this.axes.font,
        this.axes.fontStyle,
      );
    }

    for (
      let v = this.axes.v.range[0];
      v <= this.axes.v.range[1];
      v += this.axes.v.step
    ) {
      this.text(
        `${v}${this.axes.v.unit}`,
        { h: 0, v },
        [ 'right', 'middle' ],
        [ -this.axes.labelPadding, 0 ],
        this.axes.font,
        this.axes.fontStyle,
      );
    }

    this.ctx.restore();

    return this;
  }

  line(from: PlotCoordinates, to: PlotCoordinates, style: string) {
    this.ctx.save();

    this.ctx.beginPath();
    this.ctx.moveTo(...this.pc2cc(from));
    this.ctx.lineTo(...this.pc2cc(to));
    this.ctx.closePath();
    this.ctx.strokeStyle = style;
    this.ctx.stroke();

    this.ctx.restore();

    return this;
  }

  text(
    text: string,
    pc: PlotCoordinates,
    align: [ CanvasTextAlign, CanvasTextBaseline ],
    offset: [ number, number ],
    font: string,
    style: string,
  ) {
    this.ctx.save();

    this.ctx.fillStyle = style;
    this.ctx.font = font;
    this.ctx.textAlign = align[0];
    this.ctx.textBaseline = align[1];

    let [ x, y ] = this.pc2cc(pc);
    this.ctx.fillText(text, x + offset[0], y + offset[1]);

    this.ctx.restore();

    return this;
  }

  plotFunction(f: (h: number) => number, style) {
    let h0 = this.axes.h.range[0];
    let step = 1 / this.axes.h.resolution;
    while (h0 < this.axes.h.range[1]) {
      let v0 = f(h0);
      let h1 = h0 + step;
      let v1 = f(h1);
      this.line({ h: h0, v: v0 }, { h: h1, v: v1 }, style);
      h0 = h1;
    }
  }

  plotData(data: PlotCoordinates[], style: string) {
    for (let i = 0; i < data.length - 1; ++i) {
      this.line(data[i], data[i + 1], style);
    }
  }

  private pc2cc(pcOrH: PlotCoordinates, v?: number): [ number, number ] {
    let h: number;

    if (typeof pcOrH == 'object') {
      h = pcOrH.h;
      v = pcOrH.v;
    } else {
      h = pcOrH;
      v = v!;
    }

    return [
      this.origin.x + h * this.axes.h.resolution,
      this.origin.y - v * this.axes.v.resolution,
    ]
  }

  private findMajorStepH() {
    this.ctx.save();

    const range = this.axes.h.range[1] - this.axes.h.range[0];

    this.axes.h.resolution = this.grid.width / range;

    this.ctx.font = this.axes.font;
    let [ width ] = this.measureLabel(this.axes.h);
    let step = 1;
    for (; range / step * width > this.grid.width; step *= 10);
    this.axes.h.step = step;

    this.ctx.restore();
  }

  private findMajorStepV() {
    this.ctx.save();

    let range = this.axes.v.range[1] - this.axes.v.range[0];

    this.axes.v.resolution = this.grid.height / range;

    this.ctx.font = this.axes.font;
    let [ , height ] = this.measureLabel(this.axes.v);
    let step = 1;
    for (; range / step * height > this.grid.height; step *= 10);
    this.axes.v.step = step;
    this.ctx.restore();
  }

  private measureLabel(axis: Axis) {
    this.ctx.save();

    this.ctx.font = this.axes.font;

    let measure = this.ctx.measureText(axis.range[1] + axis.unit);

    this.ctx.restore();

    return [ measure.width, measure.actualBoundingBoxAscent ];
  }
}
