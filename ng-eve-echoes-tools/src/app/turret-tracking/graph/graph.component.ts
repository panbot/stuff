import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { LanguageService } from 'src/app/language.service';
import { CanvasGraph } from './canvas-graph';

@Component({
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.scss']
})
export class GraphComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvasRef: ElementRef<HTMLCanvasElement>;

  collapsed = false;

  graph: CanvasGraph;

  velocity: number;
  tracking: number;
  optimal: number;
  falloff: number;
  signature: number;

  i18n = {
    "zh": {
      "Turrent Tracking": "炮台追踪",
      "Velocity": "速率",
      "Tracking": "追踪",
      "Optimal Range": "最佳射程",
      "Accuracy Falloff": "失准范围",
      "Target Signature Radius": "目标信号半径",
      "Frigate": "护卫",
      "Destroyer": "驱逐",
      "Cruiser": "巡洋",
      "Battlecruiser": "战巡",
      "Battleship": "战列",
      "Draw": "绘制",
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
      let paramters = JSON.parse(localStorage.getItem('parameters'));
      Object.assign(this, paramters);
    } catch {}
  }

  draw() {
    this.graph.clear();

    this.graph.drawGrid(this.optimal + 3 * this.falloff);

    let hitChance = (range: number) => {
      let a = 40 * this.velocity / range / this.tracking / this.signature;
      let b = Math.max(0, range - this.optimal) / this.falloff;

      return Math.pow(0.5, a * a + b * b)
    }
    this.graph.plot(hitChance, 'lightblue');

    let dmg = (range: number) => {
      let chance = hitChance(range);
      return 0.5 * Math.min(
        chance * chance + 0.98 * chance + 0.0501,
        6 * chance
      )
    }
    this.graph.plot(dmg, 'red');

    localStorage.setItem('parameters', JSON.stringify({
      velocity: this.velocity,
      tracking: this.tracking,
      optimal: this.optimal,
      falloff: this.falloff,
      signature: this.signature,
    }));

    if (window.innerWidth < 500) {
      this.collapsed = true;
    }
  }

}
