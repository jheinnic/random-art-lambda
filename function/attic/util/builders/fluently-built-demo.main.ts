import * as util from 'util';
import {IDirector, getBuilderDecorators} from '.';

export interface BuildFoo
{
   one(param: number, param2: string[]): this;

   two(param: number): this;
}

const builderDecorators = getBuilderDecorators<BuildFoo>('bind-param-to-builder-foo-key');
const bindFooParam = builderDecorators.bindInputParam;
const fluentlyBuilt = builderDecorators.decorateBuildable;
const factoryMethod = builderDecorators.factoryMethod;

@fluentlyBuilt
export class Dook
{
   constructor(
      @bindFooParam({
         name: 'one',
         index: 0
      })
      public readonly fooOne: number,
      @bindFooParam({
         name: 'two',
         index: 0
      })
      public readonly several: number,
      @bindFooParam({
         name: 'one',
         index: 1
      })
      public readonly fooTwo: string[]
   )
   { }

   @factoryMethod()
   public static create(director: IDirector<BuildFoo>): Dook
   {
      throw director;
   }

   @factoryMethod()
   public clone(director: IDirector<BuildFoo>): Dook
   {
      throw director;
   }
}

export let sampleOne: Dook = Dook.create((builder: BuildFoo) => {
   builder.one(5, ["a", "b", "c"])
      .two(13);
});
export let sampleTwo: Dook = sampleOne.clone((builder: BuildFoo) => {
   builder.one(2, ["x", "y", "z"]);
});
export let sampleThree: Dook = sampleOne.clone((builder: BuildFoo) => {
   builder.two(-5);
});
export let sampleFour: Dook = Dook.create((builder: BuildFoo) => {
   builder.two(6)
      .two(7)
      .one(0, ["empty"])
      .two(2);
});
console.log(util.inspect(sampleOne, true, 6, true));
console.log(util.inspect(sampleTwo, true, 6, true));
console.log(util.inspect(sampleThree, true, 6, true));
console.log(util.inspect(sampleFour, true, 6, true));
