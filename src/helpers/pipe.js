export function pipe(source) {
  const args = arguments;
  const len = args.length;
  let x = source;

  for (let i = 1; i < len; i++) {
    x = args[i](x);
  }

  return x;
}
