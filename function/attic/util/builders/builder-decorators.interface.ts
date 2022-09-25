import {MetadataKey} from '@loopback/metadata';
import {BindToBuilder} from './bind-to-builder.interface';

export interface BuilderDecorators<S>
{
   key: MetadataKey<BindToBuilder<S>, ParameterDecorator>;
   bindInputParam: (spec: BindToBuilder<S>) => ParameterDecorator;
   factoryMethod: () => MethodDecorator;
   decorateBuildable: ClassDecorator;
}
