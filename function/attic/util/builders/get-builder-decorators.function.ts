import {
   MetadataAccessor, MetadataInspector, MetadataKey, MethodDecoratorFactory, ParameterDecoratorFactory
} from '@loopback/metadata';
import { Builder, Ctor, IBuilder, Instance } from 'fluent-interface-builder';
import { isKeyOf } from 'simplytyped';

import { BindToBuilder } from './bind-to-builder.interface';
import { FluentBuilder } from './fluent-builder.interface';
import { BuilderDecorators } from './builder-decorators.interface';
// import { MixableConstructor } from '@jchptf/mixins';
// import { IDirector, Wild } from '@jchptf/api';


export type MixableConstructor<T = any> = new (...args: any[]) => T;

export type IDirector<IBuilder> = (builder: IBuilder) => void;

export type IMapTo<T, S extends Record<string, unknown>, P extends keyof S = keyof S> = {
   [K in P]: T;
};

export type Wild<P extends keyof any = keyof any> = IMapTo<any, any, P>;


export function getBuilderDecorators<S>(keyName: string): BuilderDecorators<S>
{
   const key = MetadataAccessor.create<BindToBuilder<S>, ParameterDecorator>(keyName);
   const bindInputParam = bindBuilderKey(key);
   const decorateBuildable = fluentlyBuildable(key);

   return {
      key,
      bindInputParam,
      factoryMethod,
      decorateBuildable
   };
}

interface FactoryMethodMarker {}

const FACTORY_METHOD_KEY =
   MetadataAccessor.create<FactoryMethodMarker, MethodDecorator>(
      'factory-method-marker-key');

function factoryMethod(): MethodDecorator
{
   return MethodDecoratorFactory.createDecorator<FactoryMethodMarker>(FACTORY_METHOD_KEY, {});
}


// TODO: Config this next type is unnecessary and remove it if so.
// type FluentSetterParamTypes<Self extends FluentBuilder, K extends StringKeys<Self> = StringKeys<Self>> =
//    Self[K] extends (...args: infer P) => Self ? P : never;
//
// type FluentBuilderState<Self extends FluentBuilder> = {
//    -readonly [K in StringKeys<Self>]+?: Parameters<Self[K]> // FluentSetterParamTypes<Self, K>
// }

function bindBuilderKey<S>(key: MetadataKey<BindToBuilder<S>, ParameterDecorator>):
   ((spec: BindToBuilder<S>) => ParameterDecorator)
{
   return (spec: BindToBuilder<S>): ParameterDecorator =>
   {
      return ParameterDecoratorFactory.createDecorator(key, spec);
   }
}

function fluentlyBuildable<S extends FluentBuilder>(key: MetadataKey<BindToBuilder<S>, ParameterDecorator>): any
{
   // type InternalState = FluentBuilderState<S>
   type InternalBuilder = S & Instance<Wild>

   return function <C extends MixableConstructor>(Target: C): C {
      // return function <TFunction extends Function>(Target: TFunction): TFunction {
      // function FluentTarget(this: any, ...args: any[]): object {
      //    Target.apply(this, ...args);
      //    console.log('constructing ', this);
      //    return this;
      // }

      const allParamMeta: BindToBuilder<S>[] | undefined =
         MetadataInspector.getAllParameterMetadata<BindToBuilder<S>>(key, Target, '');
      if (!!allParamMeta) {
         const builder: IBuilder<Wild, InternalBuilder> =
            new Builder<Wild, InternalBuilder>();
         let nextProp: keyof S;
         for (nextProp of allParamMeta.map(p => p.name)) {
            // We cannot enforce compile time type checks as we define this, but we define the interface
            // based on decorators that link to members of an interface that the generated class will
            // implement, and TypeScript can enforce that use interface at compile time.
            if (typeof nextProp === 'string') {
               builder.cascade(nextProp, (...args: any[]) => (context: Wild) => {
                  context[nextProp] = args;
               });
            }
         }
         const ctor: Ctor<Wild, InternalBuilder> = builder.value;

         const FluentTarget = class FluentTarget extends Target
         {
            static create(director: IDirector<S>): FluentTarget
            {
               let constructorParams: Wild = {};
               let builder: InternalBuilder = new ctor(constructorParams);
               director(builder);
               // constructorParams = builder.value;

               const paramValues = allParamMeta.map((paramMeta: BindToBuilder<S>) => {
                  if (isKeyOf(constructorParams, paramMeta.name)) {
                     const callArgs = constructorParams[paramMeta.name];
                     if (!!callArgs) {
                        return callArgs[(
                           !!paramMeta.index
                        ) ? paramMeta.index : 0];
                     }
                  }

                  return undefined;
               });

               return new FluentTarget(...paramValues);
            }

            clone(director: IDirector<S>): FluentTarget
            {
               // Will need to re-think this if builder behavior ever in any way needs to become
               // contextual on previously inherited and newly minted current state, since
               // it does not currently load builder with a representation of previous state.
               // Retention of clone source values not overridden is currently accomplished with
               // a post-builder call to Object.assign.
               const overrides: any = FluentTarget.create(director);
               for (let prop of Object.getOwnPropertyNames(overrides)) {
                  if (overrides[prop] === undefined) {
                     delete overrides[prop];
                  }
               }
               return Object.assign(overrides, this, overrides);
            }
         };

         // newConstructor.prototype = Object.create(Target.prototype);
         // newConstructor.prototype.constructor = Target;

         const clonePropName: string | undefined =
            Object.getOwnPropertyNames(Target.prototype)
               .find((propName: string) => {
                  if (propName === 'constructor') {
                     return false;
                  }

                  // Inspect a class with the key
                  const factoryMethodData: FactoryMethodMarker | undefined =
                     MetadataInspector.getMethodMetadata(FACTORY_METHOD_KEY, Target.prototype, propName);

                  // console.log(propName, factoryMethodData);
                  return !!factoryMethodData;
               });
         if (!!clonePropName && (
            clonePropName !== 'clone'
         ))
         {
            FluentTarget.prototype[clonePropName] = FluentTarget.prototype.clone;
            // console.log('Found and overrode ' + clonePropName + ' with ' + FluentTarget.prototype.clone);
            delete FluentTarget.prototype.clone;
         }

         const createPropName: string | undefined =
            Object.getOwnPropertyNames(Target)
               .find((propName: string) => {
                  // Inspect a class with the key
                  const factoryMethodData: FactoryMethodMarker | undefined =
                     MetadataInspector.getMethodMetadata(FACTORY_METHOD_KEY, Target, propName);

                  // console.log(propName, factoryMethodData);
                  return !!factoryMethodData;
               });
         if (!!createPropName && (
            createPropName !== 'create'
         ))
         {
            // (FluentTarget as any)[createPropName] = FluentTarget.prototype.constructor.create;
            // if (isKeyOf(FluentTarget, createPropName)) {
            //    FluentTarget[createPropName] = FluentTarget.prototype.constructor.create;
            // }
            FluentTarget.prototype.constructor[createPropName] = FluentTarget.prototype.constructor.create;
            // console.log('Found and overrode ' + createPropName);
            delete FluentTarget.prototype.constructor.create;
         }

         return FluentTarget;
      }

      return Target;
   }
}

