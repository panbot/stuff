import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  languages = {
    "en-US": {

    },
    "zh-CN": {
      "Turret Tracking": "炮台追踪",
    },
  };
  translation: any;

  constructor() { }

  ngOnInit() {
    this.translation = this.languages[window.navigator.language];
  }

}
