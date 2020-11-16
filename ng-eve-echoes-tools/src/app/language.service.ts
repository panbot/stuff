import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  constructor() { }

  getLanguage() {
    return window.navigator.language.split(',')[0].split('-')[0];
  }
}
