# wonka

## 6.2.3

### Patch Changes

- ⚠️ Fix overload of `pipe` type not being applied in bundled `d.ts` file, by [@kitten](https://github.com/kitten) (See [#144](https://github.com/0no-co/wonka/pull/144))

## 6.2.2

### Patch Changes

- ⚠️ Fix missing `Symbol.observable` typings and remove `const enum` exports, which aren't usable in isolated modules, by [@kitten](https://github.com/kitten) (See [#141](https://github.com/0no-co/wonka/pull/141))

## 6.2.1

### Patch Changes

- ⚠️ Fix accidental addition of `postinstall` script rather than `prepare` script, by [@kitten](https://github.com/kitten) (See [#138](https://github.com/0no-co/wonka/pull/138))

## 6.2.0

### Minor Changes

- Implement `toAsyncIterable`, converting a Wonka source to a JS Async Iterable, by [@kitten](https://github.com/kitten) (See [#133](https://github.com/0no-co/wonka/pull/133))
- Implement `d.ts` bundling. Only a single `wonka.d.ts` typings file will now be available to TypeScript, by [@kitten](https://github.com/kitten) (See [#135](https://github.com/0no-co/wonka/pull/135))
- Add extensive TSDoc documentation for all `wonka` internals and exports. This will replace the documentation and give consumers more guidance on each of the library's extensive utilities, by [@kitten](https://github.com/kitten) (See [#136](https://github.com/0no-co/wonka/pull/136))

### Patch Changes

- ⚠️ Fix promise timing by adding missing `Promise.resolve()` tick to `toPromise` sink function, by [@kitten](https://github.com/kitten) (See [#131](https://github.com/0no-co/wonka/pull/131))
- ⚠️ Fix implementation of Observable spec as such that Observable.subscribe(onNext, onError, onComplete) becomes valid, by [@kitten](https://github.com/kitten) (See [#132](https://github.com/0no-co/wonka/pull/132))
