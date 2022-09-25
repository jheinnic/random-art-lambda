export interface BindToBuilder<S>
{
   name: string & keyof S;
   index?: number;
}
