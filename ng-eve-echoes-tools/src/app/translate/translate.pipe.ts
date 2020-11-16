import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'translate'
})
export class TranslatePipe implements PipeTransform {

  transform(value: any, translation: any): any {
    if (!translation) return value;
    return translation[value] || value;
  }

}
