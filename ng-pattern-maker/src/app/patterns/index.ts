import { Drawable } from "../lib/drawable"

export type PatternMaker<FIELDS extends string = any> = {
    fields: {
        name: FIELDS,
        label: string,
        unit?: string,
        default_value: number,
        place_holder?: string,
    }[],
    draw(drawable: Drawable, params: Record<FIELDS, number>): void
}