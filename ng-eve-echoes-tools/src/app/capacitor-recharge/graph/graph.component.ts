import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LanguageService } from 'src/app/language.service';

@Component({
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  graph: CanvasGraph;

  capacity: number;
  time: number;
  skills: number;
  rig1: number;
  rig2: number;
  rig3: number;

  consumption: number;

  final: {
    cap: number,
    time: number,
  }

  collapsed = false;

  rigs = [
    [ 'No Rigs', 0 ],

    [ 'SMC Prototype', 10.5 ],
    [ 'SMC I', 17.5 ],
    [ 'SMC II', 20 ],
    [ 'SMC III', 22.5 ],

    [ 'CCC Prototype', -7.5 ],
    [ 'CCC I', -12.5 ],
    [ 'CCC II', -15 ],
    [ 'CCC III', -17.5 ],
  ];

  storeKey = 'capacitor-recharge-parameters';

  i18n = {
    "zh": {
      "Capacity Recharge": "电容充能",
      "Ship Capacity": "舰船电容容量",
      "Ship Recharge Time": "舰船充能时长",
      "Total Cap Bonus From Skills": "总技能容量加成",
      "Rig Slot": "改装位",
      "Final Capacity": "最终电容容量",
      "Final Recharge Time": "最终充能时长",
      "No Rigs": "无",
      "SMC Prototype": "电池原型",
      "SMC I": "电池I",
      "SMC II": "电池II",
      "SMC III": "电池II",
      "CCC Prototype": "电路原型",
      "CCC I": "电路I",
      "CCC II": "电路II",
      "CCC III": "电路III",
      "Plot Recharge vs. %": "绘制充电速率",
      "Plot Consumption": "绘制消耗",
      "Consumption Rate": "消耗速率",

      "Close": "关闭",
    },
  };
  translation: any;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.translation = this.i18n[this.languageService.getLanguage()];

    this.graph = new CanvasGraph(
      this.canvasRef.nativeElement,
      this.hostRef.nativeElement.clientWidth,
      this.hostRef.nativeElement.clientHeight,
    );

    try {
      let paramters = JSON.parse(localStorage.getItem(this.storeKey));
      Object.assign(this, paramters);
    } catch {}
  }

  drawRecharge() {
    this.calculate();
    let { cap, time } = this.final;

    this.graph.clear();
    this.graph.setAxes(
      {
        range: 100,
        unit: '%',
      },
      {
        range: cap / time * 3,
        unit: ' GJ/s'
      },
    );
    this.graph.drawGrid();

    this.graph.plotFunction(
      (p: number) => this.getRechargeRate(p / 100 * cap, cap, time),
      'red',
    );

    localStorage.setItem(this.storeKey, JSON.stringify({
      capacity: this.capacity,
      time: this.time,
      skills: this.skills,
      rig1: this.rig1,
      rig2: this.rig2,
      rig3: this.rig3,
    }));
  }

  drawConsumption() {
    this.calculate();

    let data: XY[] = [];

    for (let t = 0, c = this.final.cap; t <= 3600; ++t) {
      data.push({ x: t, y: c } );

      let rechage = this.getRechargeRate(c, this.final.cap, this.final.time);
      let c1 = c + rechage - this.consumption;
      if (c1 < 0) break;

      c = c1;
    }

    this.graph.clear();

    this.graph.setAxes(
      {
        range: data[data.length - 1].x,
        unit: ' s',
      },
      {
        range: this.final.cap,
        unit: ' GJ'
      },
    );

    this.graph.drawGrid();

    this.graph.plotData(data, 'red');
  }

  getRechargeRate(current: number, capacity: number, time: number) {
    let p = current / capacity;
    return 10 * capacity / time * (Math.sqrt(p) - p);
  }

  private calculate() {
    let cap = this.capacity;

    if (this.skills) cap += this.capacity * this.skills / 100;

    if (this.rig1 > 0) cap += this.capacity * this.rig1 / 100;
    if (this.rig2 > 0) cap += this.capacity * this.rig2 / 100;
    if (this.rig3 > 0) cap += this.capacity * this.rig3 / 100;

    let time = this.time;

    if (this.rig1 < 0) time *= 1 + this.rig1 / 100;
    if (this.rig2 < 0) time *= 1 + this.rig2 / 100;
    if (this.rig3 < 0) time *= 1 + this.rig3 / 100;

    this.final = {
      cap,
      time,
    }
  }
}

type XY = { x: number, y: number };

type Axis = {
  step: number;
  unit: string;
  range: number;
}

class CanvasGraph {

  ctx: CanvasRenderingContext2D;

  origin: XY;

  paddingTop = 30;
  paddingRight = 30;
  paddingLeft = 50;
  paddingBottom = 30;

  gridWidth: number;
  gridHeight: number;

  axis: {
    font: string,
    fontStyle: string,
    gridStyle: string,
    x: Axis,
    y: Axis,
  } = {
    font: '12px',
    fontStyle: 'rgb(100, 100, 100)',
    gridStyle: 'rgba(200, 200, 200, 0.5)',
    x: {
      step: 1,
      unit: '',
      range: 100,
    },
    y: {
      step: 1,
      unit: '',
      range: 100,
    },
  };

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

  setAxes(x: Partial<Axis>, y: Partial<Axis>) {
    Object.assign(this.axis.x, x);
    Object.assign(this.axis.y, y);

    let mag = Math.floor(Math.log10(this.axis.y.range));
    let scale = Math.pow(10, mag);
    this.axis.y.range = Math.ceil(this.axis.y.range / scale) * scale;
  }

  plotFunction(func: (r: number) => number, style: string) {
    let step = this.axis.x.range / this.gridWidth;
    let sMax = -Infinity;
    let rMax: number;
    for (let r0 = 0; r0 <= this.axis.x.range; r0 += step) {
      let s0 = func(r0);
      if (s0 > sMax) {
        sMax = s0;
        rMax = r0;
      }
      let r1 = r0 + step;
      let s1 = func(r1);

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
      `${rMax.toFixed(1)}${this.axis.x.unit}, ${sMax.toFixed(2)}${this.axis.y.unit}`,
    );
  }

  plotData(data: XY[], style: string) {
    for (let i = 0; i < data.length - 1; ++i) {
      this.lineXY(
        this.transform(data[i].x, data[i].y),
        this.transform(data[i + 1].x, data[i + 1].y),
        style,
      );
    }
  }

  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawGrid() {
    this.findMajorStepX();
    this.findMajorStepY();

    // vertical lines
    for (let x = 0 ; x <= this.axis.x.range; x += this.axis.x.step) {
      this.lineXY(
        this.transform(x, 0),
        this.transform(x, this.axis.y.range),
        this.axis.gridStyle,
      );
    }

    // horizontal lines
    for (let y = 0; y <= this.axis.y.range; y += this.axis.y.step) {
      this.lineXY(
        this.transform(0, y),
        this.transform(this.axis.x.range, y),
        this.axis.gridStyle,
      );
    }

    this.ctx.save();
    this.ctx.fillStyle = this.axis.fontStyle;
    this.ctx.font = this.axis.font;

    for (let x = 0; x <= this.axis.x.range; x += this.axis.x.step) {
      const pos = this.transform(x, 0);
      let text = `${x}${this.axis.x.unit}`;
      let measure = this.ctx.measureText(text);
      this.ctx.fillText(text, pos.x, pos.y + measure.actualBoundingBoxAscent + 2);
    }

    for (let y = 0; y <= this.axis.y.range; y += this.axis.y.step) {
      const pos = this.transform(0, y);
      let text = `${y}${this.axis.y.unit}`;
      let measure = this.ctx.measureText(text);
      this.ctx.fillText(
        text,
        pos.x - measure.width - 2,
        pos.y + measure.actualBoundingBoxAscent / 2,
      );

    }

    this.ctx.restore();
  }

  transform(r: number, s: number): XY {
    return {
      x: this.origin.x + r / this.axis.x.range * this.gridWidth,
      y: this.origin.y - s / this.axis.y.range * this.gridHeight,
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
      this.ctx.strokeText(text, x + 2, y - 5);
    }

    this.ctx.restore();
  }

  private findMajorStepX() {
    this.ctx.save();
    this.ctx.font = this.axis.font;

    let size = this.ctx.measureText('100%').width;
    let step = 1;
    for (; this.axis.x.range / step * size > this.gridWidth; step *= 10);
    this.axis.x.step = step;
    this.ctx.restore();
  }

  private findMajorStepY() {
    this.ctx.save();
    this.ctx.font = this.axis.font;

    let size = this.ctx.measureText('GJ/s').actualBoundingBoxAscent * 5;
    let step = 1;
    for (; this.axis.y.range / step * size > this.gridHeight; step *= 10);
    this.axis.y.step = step;
    this.ctx.restore();
  }
}
