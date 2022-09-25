import {FluentSetter} from './fluent-setter.interface';

export interface FluentBuilder
{
   [K: string]: FluentSetter<this>;
}
