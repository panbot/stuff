import { Component, OnInit } from '@angular/core';
import { LanguageService } from '../language.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent implements OnInit {

  i18n = {
    "zh": {
      "Turret Tracking": "炮台追踪",
    },
  };
  translation: any;

  constructor(
    private languageService: LanguageService,
  ) { }

  ngOnInit() {
    this.translation = this.i18n[this.languageService.getLanguage()];
  }

}
