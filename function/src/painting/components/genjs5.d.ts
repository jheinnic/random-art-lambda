import './genjs5';

declare module './genjs5' {
   export type GenModel = { };

   export function new_new_picture(prefix: Array<number>, suffix: Array<number>): GenModel;
   export function new_picture(prefix: Array<number>, suffix: Array<number>): GenModel;
   export function old_picture(prefix: string, suffix: string): GenModel;
   export function compute_pixel(genModel: GenModel, x: number, y: number): [red:number, green:number, blue:number];
   export function word_to_seed(word: string): [Array<number>, Array<number>];
   export function full_eval(fn: Function): Function;
   export function partial_eval(fn: Function): Function;
}
