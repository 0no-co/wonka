/* pipe definitions for source + operators composition */

type PipeFns<Argument, Args extends [...any[]]> = Args extends [
  (arg: Argument) => infer Return,
  ...infer Tail
]
  ? [(arg: Argument) => Return, ...PipeArgs<Return, Tail>]
  : Args extends [(arg: Argument) => infer Output]
  ? [(arg: Argument) => Output]
  : [];

type PipeReturn<Args extends [...any[]]> = Args extends [infer Tail]
  ? Tail
  : Args extends [any, ...infer Tail]
  ? PipeReturn<Tail>
  : unknown;

type PipeArgs<Input, Args extends any[]> = [Input, ...PipeFns<Input, Args>];

function pipe<Input, Args extends any[]>(...args: PipeArgs<Input, Args>): PipeReturn<Args> {
  let x = args[0];
  for (let i = 1, l = args.length; i < l; i++) x = (args[i] as any)(x);
  return x as any;
}

export { pipe };
