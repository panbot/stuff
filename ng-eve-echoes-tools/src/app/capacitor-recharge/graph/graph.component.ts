import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LanguageService } from 'src/app/language.service';
import { PlotCanvas } from 'src/app/plot-canvas';

@Component({
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  plot: PlotCanvas;

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

      "Hide": "隐藏",
    },
  };
  translation: any;

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.translation = this.i18n[this.languageService.getLanguage()];

    this.plot = new PlotCanvas(
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

    this.plot.clear();
    this.plot.setAxes({
      h: {
        range: [ 0, 100 ],
        unit: '%',
        step: 1,
        resolution: 1,
      },
      v: {
        range: [ 0, Math.ceil(cap / time * 3) ],
        unit: ' GJ/s',
        step: 1,
        resolution: 1,
      },
    });
    this.plot.drawGrid();

    this.plot.plotFunction(
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

    let data: { h: number, v: number }[] = [];

    for (let h = 0, v = this.final.cap; h <= 3600; ++h) {
      data.push({ h, v } );

      let rechage = this.getRechargeRate(v, this.final.cap, this.final.time);
      let c1 = v + rechage - this.consumption;
      if (c1 < 0) break;

      v = c1;
    }

    this.plot.clear();

    this.plot.setAxes({
      h: {
        range: [ 0, data[data.length - 1].h ],
        unit: ' s',
        step: 1,
        resolution: 1,
      },
      v: {
        range: [ 0, this.final.cap ],
        unit: ' GJ',
        step: 1,
        resolution: 1,
      },
    });

    this.plot.drawGrid();

    this.plot.plotData(data, 'red');
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
