export interface FluentSetter<T, P extends any[] = any[]>
{
   (...args: P): T
}