open Jest;
open Wonka_types;

let it = test;

describe("source factories", () => {
  describe("fromList", () => {
    open Expect;
    open! Expect.Operators;

    it("sends list items to a puller sink", () => {
      let source = Wonka.fromList([10, 20, 30]);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | Push(_) => ignore(Js.Array.push(signal, signals))
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(signals) == [|Push(10), Push(20), Push(30), End|];
    });
  });

  describe("fromArray", () => {
    open Expect;
    open! Expect.Operators;

    it("sends array items to a puller sink", () => {
      let source = Wonka.fromArray([|10, 20, 30|]);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = ref([||]);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          signals := Array.append(signals^, [|signal|]);
          talkback^(. Pull);
        | End => signals := Array.append(signals^, [|signal|])
        }
      );

      expect(signals^) == [|Push(10), Push(20), Push(30), End|];
    });

    it("does not blow up the stack when iterating something huge", () => {
      let arr = Array.make(100000, 123);
      let source = Wonka.fromArray(arr);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let values = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(x) =>
          ignore(Js.Array.push(x, values));
          talkback^(. Pull);
        | End => ()
        }
      );

      expect(Array.length(values)) == Array.length(arr);
    });
  });

  describe("fromValue", () => {
    open Expect;
    open! Expect.Operators;

    it("sends a single item to a puller sink", () => {
      let source = Wonka.fromValue(123);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | Push(_) => ignore(Js.Array.push(signal, signals))
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull); /* one extra to check whether no signal comes back after it has ended */

      expect(signals) == [|Push(123), End|];
    });
  });

  describe("empty", () => {
    open Expect;
    open! Expect.Operators;

    it("ends immediately", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      Wonka.empty((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, signals))
        }
      );

      let _signals = Array.copy(signals);

      talkback^(. Pull);
      talkback^(. Pull);

      expect((_signals, signals)) == ([|End|], [|End|]);
    });
  });

  describe("never", () => {
    open Expect;
    open! Expect.Operators;

    it("does not end", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let ended = ref(false);

      Wonka.never((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | End => ended := true
        | _ => ()
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);

      expect(ended^) === false;
    });
  });

  describe("fromObservable", () =>
    Expect.(
      testPromise("creates a source from an observable", () => {
        let observable = Wonka_thelpers.observableFromArray([|1, 2|]);

        Wonka_thelpers.testSource(Wonka.fromObservable(observable))
        |> Js.Promise.then_(x =>
             expect(x)
             |> toEqual([|Push(1), Push(2), End|])
             |> Js.Promise.resolve
           );
      })
    )
  );

  describe("fromCallbag", () => {
    open Expect;

    testPromise("creates a source from a callbag (observable)", () => {
      let observable = Wonka_thelpers.observableFromArray([|1, 2|]);
      let callbag = Wonka_thelpers.callbagFromObservable(observable);

      Wonka_thelpers.testSource(Wonka.fromCallbag(callbag))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual([|Push(1), Push(2), End|])
           |> Js.Promise.resolve
         );
    });

    testPromise("creates a source from a callbag (iterable)", () => {
      let callbag = Wonka_thelpers.callbagFromArray([|1, 2|]);

      Wonka_thelpers.testSource(Wonka.fromCallbag(callbag))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual([|Push(1), Push(2), End|])
           |> Js.Promise.resolve
         );
    });
  });
});

describe("operator factories", () => {
  describe("map", () => {
    open Expect;

    it("maps all emissions of a source", () => {
      let num = ref(1);
      let nums = [||];
      let talkback = ref((. _: Wonka_types.talkbackT) => ());

      Wonka.map(
        (. _) => {
          let res = num^;
          num := num^ + 1;
          res;
        },
        sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull => sink(. Push(1))
                | _ => ()
                },
            ),
          ),
        (. signal) =>
          switch (signal) {
          | Start(x) =>
            talkback := x;
            x(. Pull);
          | Push(x) when num^ < 6 =>
            ignore(Js.Array.push(x, nums));
            talkback^(. Pull);
          | _ => ()
          },
      );

      expect(nums) |> toEqual([|1, 2, 3, 4|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.map((. x) => x))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.map((. x) => x))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("filter", () => {
    open Expect;

    it("filters emissions according to a predicate", () => {
      let i = ref(1);
      let nums = [||];
      let talkback = ref((. _: Wonka_types.talkbackT) => ());

      Wonka.filter(
        (. x) => x mod 2 === 0,
        sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let num = i^;
                  i := i^ + 1;
                  sink(. Push(num));
                | _ => ()
                },
            ),
          ),
        (. signal) =>
          switch (signal) {
          | Start(x) =>
            talkback := x;
            x(. Pull);
          | Push(x) when x < 6 =>
            ignore(Js.Array.push(x, nums));
            talkback^(. Pull);
          | _ => ()
          },
      );

      expect(nums) |> toEqual([|2, 4|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.filter((. _) => true))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise("follows the spec for listenables when filtering", () =>
      Wonka_thelpers.testWithListenable(Wonka.filter((. _) => false))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull|], [|End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.filter((. _) => true))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("sample", () => {
    open Expect;
    open! Expect.Operators;

    afterEach(() => Jest.useRealTimers());

    it("should sample the last emitted value from a source", () => {
      Jest.useFakeTimers();
      let a = Wonka.interval(50);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = Wonka.sample(Wonka.interval(100), a);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(200);

      expect(signals) == [|Push(1), Push(3)|];
    });

    it("should emit an End signal when the source has emitted all values", () => {
      Jest.useFakeTimers();
      let a = Wonka.interval(50);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = Wonka.sample(Wonka.interval(100), a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(300);

      expect(signals) == [|Push(1), Push(3), Push(5), End|];
    });
  });

  describe("scan", () => {
    open Expect;

    it("folds emissions using an initial seed value", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.scan(
          (. acc, x) => acc + x,
          0,
          sink =>
            sink(.
              Start(
                (. signal) =>
                  switch (signal) {
                  | Pull =>
                    let i = num^;
                    if (i <= 3) {
                      num := num^ + 1;
                      sink(. Push(i));
                    } else {
                      sink(. End);
                    };
                  | _ => ()
                  },
              ),
            ),
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res) |> toEqual([|Push(1), Push(3), Push(6), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.scan((. _, x) => x, 0))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.scan((. _, x) => x, 0))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("merge", () => {
    open Expect;
    open! Expect.Operators;

    it("merges different sources into a single one", () => {
      let a = Wonka.fromList([1, 2, 3]);
      let b = Wonka.fromList([4, 5, 6]);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];
      let source = Wonka.merge([|a, b|]);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      expect(signals)
      == [|Push(1), Push(2), Push(3), Push(4), Push(5), Push(6), End|];
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(source => Wonka.merge([|source|]))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Pull|], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () =>
      Wonka_thelpers.testTalkbackEnd(source => Wonka.merge([|source|]))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Close|], [|Push(1)|]))
           |> Js.Promise.resolve
         )
    );
  });

  describe("concat", () => {
    open Expect;
    open! Expect.Operators;

    it("concatenates different sources into a single one", () => {
      let a = Wonka.fromList([1, 2, 3]);
      let b = Wonka.fromList([4, 5, 6]);
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];
      let source = Wonka.concat([|a, b|]);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      expect(signals)
      == [|Push(1), Push(2), Push(3), Push(4), Push(5), Push(6), End|];
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(source => Wonka.concat([|source|]))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Pull|], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () =>
      Wonka_thelpers.testTalkbackEnd(source => Wonka.concat([|source|]))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Close|], [|Push(1)|]))
           |> Js.Promise.resolve
         )
    );
  });

  describe("share", () => {
    open Expect;

    it("shares an underlying source with all sinks", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let aborterTb = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);
      let nums = [||];

      let source =
        Wonka.share(sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let i = num^;
                  if (i <= 2) {
                    num := num^ + 1;
                    sink(. Push(i));
                  } else {
                    sink(. End);
                  };
                | _ => ()
                },
            ),
          )
        );

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, nums))
        }
      );

      source((. signal) =>
        switch (signal) {
        | Start(_) => ()
        | _ => ignore(Js.Array.push(signal, nums))
        }
      );

      source((. signal) =>
        switch (signal) {
        | Start(tb) => aborterTb := tb
        | _ =>
          ignore(Js.Array.push(signal, nums));
          aborterTb^(. Close);
        }
      );

      talkback^(. Pull);
      let numsA = Array.copy(nums);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect((numsA, nums))
      |> toEqual((
           [|Push(1), Push(1), Push(1)|],
           [|Push(1), Push(1), Push(1), Push(2), Push(2), End, End|],
         ));
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.share)
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.share)
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("combine", () => {
    open Expect;

    it("combines the latest values of two sources", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());

      let makeSource = (factor: int) => {
        let num = ref(1);

        sink => {
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  if (num^ <= 2) {
                    let i = num^ * factor;
                    num := num^ + 1;
                    sink(. Push(i));
                  } else {
                    sink(. End);
                  }
                | _ => ()
                },
            ),
          );
        };
      };

      let sourceA = makeSource(1);
      let sourceB = makeSource(2);
      let source = Wonka.combine(sourceA, sourceB);
      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res)
      |> toEqual([|Push((1, 2)), Push((2, 2)), Push((2, 4)), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(source => {
        let shared = Wonka.share(source);
        Wonka.combine(shared, shared);
      })
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual((
                [||],
                [|Push((1, 1)), Push((2, 1)), Push((2, 2)), End|],
              ))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(source => {
        let shared = Wonka.share(source);
        Wonka.combine(shared, shared);
      })
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push((1, 1))|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("take", () => {
    open Expect;

    it("only lets a maximum number of values through", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.take(2, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let i = num^;
                  num := num^ + 1;
                  sink(. Push(i));
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res) |> toEqual([|Push(1), Push(2), End|]);
    });

    it(
      "accepts the end of the source when max number of emissions is not reached",
      () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.take(2, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let i = num^;
                  if (i < 2) {
                    num := num^ + 1;
                    sink(. Push(i));
                  } else {
                    sink(. End);
                  };
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res) |> toEqual([|Push(1), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.take(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise("follows the spec for listenables when ending the source", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testWithListenable(Wonka.take(1))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1), End|]))
           |> Js.Promise.resolve
         );
    });

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.take(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("takeLast", () => {
    open Expect;

    it("only lets the last n values through on an entirely new source", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.takeLast(2, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull when num^ <= 4 =>
                  let i = num^;
                  num := num^ + 1;
                  sink(. Push(i));
                | Pull => sink(. End)
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res) |> toEqual([|Push(3), Push(4), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.takeLast(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual((
                [|Pull, Pull, Pull|],
                [|/* empty since the source is a pullable */|],
              ))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () =>
      Wonka_thelpers.testTalkbackEnd(Wonka.takeLast(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull|], [||]))
           |> Js.Promise.resolve
         )
    );
  });

  describe("takeWhile", () => {
    open Expect;

    it("only lets the last n values through on an entirely new source", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.takeWhile(
          (. x) => x <= 2,
          sink =>
            sink(.
              Start(
                (. signal) =>
                  switch (signal) {
                  | Pull =>
                    let i = num^;
                    num := num^ + 1;
                    sink(. Push(i));
                  | _ => ()
                  },
              ),
            ),
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|Push(1), Push(2), End|]);
    });

    it(
      "accepts the end of the source when max number of emissions is not reached",
      () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.takeWhile(
          (. x) => x <= 5,
          sink =>
            sink(.
              Start(
                (. signal) =>
                  switch (signal) {
                  | Pull =>
                    let i = num^;
                    if (i < 2) {
                      num := num^ + 1;
                      sink(. Push(i));
                    } else {
                      sink(. End);
                    };
                  | _ => ()
                  },
              ),
            ),
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|Push(1), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.takeWhile((. _) => true))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise("follows the spec for listenables when ending the source", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testWithListenable(Wonka.takeWhile((. _) => false))
      |> Js.Promise.then_(x =>
           expect(x) |> toEqual(([|end_|], [|End|])) |> Js.Promise.resolve
         );
    });

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.takeWhile((. _) => true))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("takeUntil", () => {
    open Expect;

    it("only lets the last n values through on an entirely new source", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let notify = ref((_: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let notifier = sink => {
        notify :=
          (
            signal =>
              switch (signal) {
              | Pull => sink(. Push(0))
              | _ => ()
              }
          );

        sink(. Start(Wonka_helpers.talkbackPlaceholder));
      };

      let source =
        Wonka.takeUntil(notifier, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull when num^ <= 4 =>
                  let i = num^;
                  if (i === 3) {
                    notify^(Pull);
                  };
                  num := num^ + 1;
                  sink(. Push(i));
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|Push(1), Push(2), End|]);
    });

    it(
      "accepts the end of the source when max number of emissions is not reached",
      () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);
      let notifier = sink =>
        sink(. Start(Wonka_helpers.talkbackPlaceholder));

      let source =
        Wonka.takeUntil(notifier, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let i = num^;
                  if (num^ <= 2) {
                    num := num^ + 1;
                    sink(. Push(i));
                  } else {
                    sink(. End);
                  };
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|Push(1), Push(2), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.takeUntil(Wonka.never))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise("follows the spec for listenables when ending the source", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testWithListenable(Wonka.takeUntil(Wonka.fromValue(0)))
      |> Js.Promise.then_(x =>
           expect(x) |> toEqual(([|end_|], [|End|])) |> Js.Promise.resolve
         );
    });

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.takeUntil(Wonka.never))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("skip", () => {
    open Expect;

    it(
      "only lets values through after a number of values have been filtered out",
      () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let source =
        Wonka.skip(2, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull when num^ <= 4 =>
                  let i = num^;
                  num := num^ + 1;
                  sink(. Push(i));
                | Pull => sink(. End)
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      expect(res) |> toEqual([|Push(3), Push(4), End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.skip(0))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "follows the spec for listenables when skipping the source", () =>
      Wonka_thelpers.testWithListenable(Wonka.skip(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull|], [|End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.skip(10))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, end_|], [||]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("skipWhile", () => {
    open Expect;

    it(
      "only lets values through after the predicate returned false, including the first such value",
      () => {
        let talkback = ref((. _: Wonka_types.talkbackT) => ());
        let num = ref(1);

        let source =
          Wonka.skipWhile(
            (. x) => x <= 2,
            sink =>
              sink(.
                Start(
                  (. signal) =>
                    switch (signal) {
                    | Pull when num^ <= 4 =>
                      let i = num^;
                      num := num^ + 1;
                      sink(. Push(i));
                    | Pull => sink(. End)
                    | _ => ()
                    },
                ),
              ),
          );

        let res = [||];

        source((. signal) =>
          switch (signal) {
          | Start(x) => talkback := x
          | _ => ignore(Js.Array.push(signal, res))
          }
        );

        talkback^(. Pull);
        talkback^(. Pull);
        talkback^(. Pull);
        expect(res) |> toEqual([|Push(3), Push(4), End|]);
      },
    );

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.skipWhile((. _) => false))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([||], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "follows the spec for listenables when skipping the source", () =>
      Wonka_thelpers.testWithListenable(Wonka.skipWhile((. _) => true))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull|], [|End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.skipWhile((. _) => false))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("skipUntil", () => {
    open Expect;

    it("only lets values through after the notifier emits a value", () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let notify = ref((_: Wonka_types.talkbackT) => ());
      let num = ref(1);

      let notifier = sink => {
        notify :=
          (
            signal =>
              switch (signal) {
              | Pull => sink(. Push(0))
              | _ => ()
              }
          );

        sink(. Start(Wonka_helpers.talkbackPlaceholder));
      };

      let source =
        Wonka.skipUntil(notifier, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull when num^ <= 4 =>
                  let i = num^;
                  if (i === 3) {
                    notify^(Pull);
                  };
                  num := num^ + 1;
                  sink(. Push(i));
                | Pull => sink(. End)
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|Push(3), Push(4), End|]);
    });

    it(
      "accepts the end of the source when max number of emissions is not reached",
      () => {
      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let num = ref(1);
      let notifier = sink =>
        sink(. Start(Wonka_helpers.talkbackPlaceholder));

      let source =
        Wonka.skipUntil(notifier, sink =>
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull =>
                  let i = num^;
                  if (i < 2) {
                    num := num^ + 1;
                    sink(. Push(i));
                  } else {
                    sink(. End);
                  };
                | _ => ()
                },
            ),
          )
        );

      let res = [||];

      source((. signal) =>
        switch (signal) {
        | Start(x) => talkback := x
        | _ => ignore(Js.Array.push(signal, res))
        }
      );

      talkback^(. Pull);
      talkback^(. Pull);
      talkback^(. Pull);

      expect(res) |> toEqual([|End|]);
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(Wonka.skipUntil(Wonka.never))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Pull|], [|End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "follows the spec for listenables when skipping the source", () =>
      Wonka_thelpers.testWithListenable(Wonka.skipUntil(Wonka.fromValue(0)))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull|], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () => {
      let end_: talkbackT = Close;

      Wonka_thelpers.testTalkbackEnd(Wonka.skipUntil(Wonka.fromValue(0)))
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, end_|], [|Push(1)|]))
           |> Js.Promise.resolve
         );
    });
  });

  describe("flatten", () =>
    Expect.(
      it("merges the result of multiple pullables into its source", () => {
        let talkback = ref((. _: Wonka_types.talkbackT) => ());
        let source =
          Wonka.fromList([Wonka.fromList([1, 2]), Wonka.fromList([1, 2])])
          |> Wonka.flatten;

        let res = [||];

        source((. signal) =>
          switch (signal) {
          | Start(x) => talkback := x
          | _ => ignore(Js.Array.push(signal, res))
          }
        );

        talkback^(. Pull);
        talkback^(. Pull);
        talkback^(. Pull);
        talkback^(. Pull);
        talkback^(. Pull);
        expect(res)
        |> toEqual([|Push(1), Push(2), Push(1), Push(2), End|]);
      })
    )
  );

  describe("switchMap", () => {
    afterEach(() => Jest.useRealTimers());
    open Expect;
    open! Expect.Operators;

    it("maps from a source and switches to a new source", () => {
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];
      let source = Wonka.switchMap((. x) => Wonka.fromList([x * x]), a);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      expect(signals) == [|Push(1), Push(4), Push(9), End|];
    });

    it("unsubscribes from previous subscriptions", () => {
      Jest.useFakeTimers();

      let a = Wonka.interval(100);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];
      let source =
        Wonka.switchMap((. _) => Wonka.interval(25), a) |> Wonka.take(5);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(300);

      expect(signals)
      == [|Push(0), Push(1), Push(2), Push(0), Push(1), End|];
    });

    testPromise("follows the spec for listenables", () =>
      Wonka_thelpers.testWithListenable(source =>
        Wonka.switchMap((. x) => x, Wonka.fromList([source]))
      )
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Pull|], [|Push(1), Push(2), End|]))
           |> Js.Promise.resolve
         )
    );

    testPromise(
      "ends itself and source when its talkback receives the End signal", () =>
      Wonka_thelpers.testTalkbackEnd(source =>
        Wonka.switchMap((. x) => x, Wonka.fromList([source]))
      )
      |> Js.Promise.then_(x =>
           expect(x)
           |> toEqual(([|Pull, Pull, Close|], [|Push(1)|]))
           |> Js.Promise.resolve
         )
    );
  });

  describe("buffer", () => {
    open Expect;
    open! Expect.Operators;

    beforeEach(() => Jest.useFakeTimers());
    afterEach(() => Jest.useRealTimers());

    it("should buffer values and emit them on each notifier tick", () => {
      let a = Wonka.interval(50);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = Wonka.buffer(Wonka.interval(100), a) |> Wonka.take(2);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(400);

      expect(signals) == [|Push([|0, 1|]), Push([|2, 3|]), End|];
    });

    it("should end when the notifier ends", () => {
      let a = Wonka.interval(50) |> Wonka.take(3);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = Wonka.buffer(Wonka.interval(100), a);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(400);

      expect(signals) == [|Push([|0, 1|]), Push([|2|]), End|];
    });
  });
});

describe("sink factories", () => {
  describe("forEach", () =>
    Expect.(
      it("calls a function for each emission of the passed source", () => {
        let i = ref(0);
        let nums = [||];

        let source = sink => {
          sink(.
            Start(
              (. signal) =>
                switch (signal) {
                | Pull when i^ < 4 =>
                  let num = i^;
                  i := i^ + 1;
                  sink(. Push(num));
                | Pull => sink(. End)
                | _ => ()
                },
            ),
          );
        };

        Wonka.forEach((. x) => ignore(Js.Array.push(x, nums)), source);
        expect(nums) |> toEqual([|0, 1, 2, 3|]);
      })
    )
  );

  describe("subscribe", () =>
    Expect.(
      it(
        "calls a function for each emission of the passed source and stops when unsubscribed",
        () => {
          let i = ref(0);
          let nums = [||];
          let push = ref(() => ());

          let source = sink => {
            push :=
              (
                () => {
                  let num = i^;
                  i := i^ + 1;
                  sink(. Push(num));
                }
              );

            sink(. Start(Wonka_helpers.talkbackPlaceholder));
          };

          let {unsubscribe} =
            Wonka.subscribe(
              (. x) => ignore(Js.Array.push(x, nums)),
              source,
            );

          push^();
          push^();
          unsubscribe();
          push^();
          push^();

          expect(nums) |> toEqual([|0, 1|]);
        },
      )
    )
  );

  describe("toObservable", () =>
    Expect.(
      testPromise("should convert a source to an Observable", () => {
        let source = Wonka.fromArray([|1, 2|]);
        let observable =
          Wonka.toObservable(source) |> Wonka_thelpers.observableFrom;
        let values = [||];

        let promise =
          observable->Wonka_thelpers.observableForEach(value =>
            ignore(Js.Array.push(value, values))
          );

        promise
        |> Js.Promise.then_(() =>
             expect(values) |> toEqual([|1, 2|]) |> Js.Promise.resolve
           );
      })
    )
  );

  describe("toCallbag", () =>
    Expect.(
      it("should convert a source to a Callbag", () => {
        let source = Wonka.fromArray([|1, 2|]);
        let callbag = Wonka.toCallbag(source);
        let values = [||];

        (
          Wonka_thelpers.callbagIterate(. value =>
            ignore(Js.Array.push(value, values))
          )
        )(.
          callbag,
        );

        expect(values) |> toEqual([|1, 2|]);
      })
    )
  );
});

describe("chains (integration)", () =>
  Expect.(
    it("fromArray, map, forEach", () => {
      let input = Array.mapi((i, _) => i, Array.make(1000, 1));
      let output = Array.map(x => string_of_int(x));
      let actual = [||];

      input
      |> Wonka.fromArray
      |> Wonka.map((. x) => string_of_int(x))
      |> Wonka.forEach((. x) => ignore(Js.Array.push(x, actual)));

      expect(output) |> toEqual(output);
    })
  )
);

describe("subject", () => {
  open Expect;
  open! Expect.Operators;

  it("sends values passed to .next to puller sinks", () => {
    let signals = [||];

    let subject = Wonka.makeSubject();

    subject.source((. signal) =>
      switch (signal) {
      | Start(_) => ignore()
      | Push(_) => ignore(Js.Array.push(signal, signals))
      | End => ignore(Js.Array.push(signal, signals))
      }
    );

    subject.next(10);
    subject.next(20);
    subject.next(30);
    subject.next(40);
    subject.complete();

    expect(signals) == [|Push(10), Push(20), Push(30), Push(40), End|];
  });

  it("handles multiple sinks", () => {
    let talkback = ref((. _: Wonka_types.talkbackT) => ());
    let signalsOne = [||];
    let signalsTwo = [||];

    let subject = Wonka.makeSubject();

    subject.source((. signal) =>
      switch (signal) {
      | Start(x) => talkback := x
      | Push(_) => ignore(Js.Array.push(signal, signalsOne))
      | End => ignore(Js.Array.push(signal, signalsOne))
      }
    );

    subject.source((. signal) =>
      switch (signal) {
      | Start(_) => ignore()
      | Push(_) => ignore(Js.Array.push(signal, signalsTwo))
      | End => ignore(Js.Array.push(signal, signalsTwo))
      }
    );

    subject.next(10);
    subject.next(20);
    subject.next(30);

    talkback^(. Close);

    subject.next(40);
    subject.next(50);

    subject.complete();

    expect((signalsOne, signalsTwo))
    == (
         [|Push(10), Push(20), Push(30)|],
         [|Push(10), Push(20), Push(30), Push(40), Push(50), End|],
       );
  });

  it("handles multiple sinks that subscribe and close at different times", () => {
    let talkbackOne = ref((. _: Wonka_types.talkbackT) => ());
    let talkbackTwo = ref((. _: Wonka_types.talkbackT) => ());
    let signalsOne = [||];
    let signalsTwo = [||];

    let subject = Wonka.makeSubject();

    subject.next(10);
    subject.next(20);

    subject.source((. signal) =>
      switch (signal) {
      | Start(x) => talkbackOne := x
      | Push(_) => ignore(Js.Array.push(signal, signalsOne))
      | End => ignore(Js.Array.push(signal, signalsOne))
      }
    );

    subject.next(30);

    subject.source((. signal) =>
      switch (signal) {
      | Start(x) => talkbackTwo := x
      | Push(_) => ignore(Js.Array.push(signal, signalsTwo))
      | End => ignore(Js.Array.push(signal, signalsTwo))
      }
    );

    subject.next(40);
    subject.next(50);

    talkbackTwo^(. Close);

    subject.next(60);

    talkbackOne^(. Close);

    subject.next(70);
    subject.complete();

    expect((signalsOne, signalsTwo))
    == (
         [|Push(30), Push(40), Push(50), Push(60)|],
         [|Push(40), Push(50)|],
       );
  });
});

describe("web operators", () => {
  describe("delay", () => {
    open Expect;
    open! Expect.Operators;

    afterEach(() => Jest.useRealTimers());

    it("should not emit values before specified delay", () => {
      Jest.useFakeTimers();
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.delay(200, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      expect(signals) == [||];
    });

    it("should emit values after specified delay", () => {
      Jest.useFakeTimers();
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.delay(200, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(400);

      expect(signals) == [|Push(1), Push(2)|];
    });

    it("should emit an End signal when the source has emitted all values", () => {
      Jest.useFakeTimers();
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.delay(200, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(600);

      expect(signals) == [|Push(1), Push(2), Push(3), End|];
    });
  });

  describe("throttle", () => {
    open Expect;
    open! Expect.Operators;

    afterEach(() => Jest.useRealTimers());

    it(
      "should not emit values before specified throttle (but include values on leading edge)",
      () => {
        Jest.useFakeTimers();
        let a = Wonka.interval(100);

        let talkback = ref((. _: Wonka_types.talkbackT) => ());
        let signals = [||];

        let source = WonkaJs.throttle((. _) => 600, a) |> Wonka.take(3);

        source((. signal) =>
          switch (signal) {
          | Start(x) =>
            talkback := x;
            x(. Pull);
          | Push(_) =>
            ignore(Js.Array.push(signal, signals));
            talkback^(. Pull);
          | End => ignore(Js.Array.push(signal, signals))
          }
        );

        Jest.runTimersToTime(400);

        expect(signals) == [|Push(0)|];
      },
    );

    it("should throttle emissions by the specified throttle", () => {
      Jest.useFakeTimers();
      let a = Wonka.interval(100);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.throttle((. _) => 600, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(1000);

      expect(signals) == [|Push(0), Push(7)|];
    });

    it("should emit an End signal when the source has emitted all values", () => {
      Jest.useFakeTimers();
      let a = Wonka.interval(100);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.throttle((. _) => 600, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(1500);

      expect(signals) == [|Push(0), Push(7), Push(14), End|];
    });
  });

  describe("debounce", () => {
    open Expect;
    open! Expect.Operators;

    afterEach(() => Jest.useRealTimers());

    it(
      "should not emit values if emitted before the debounce specified by the duration selector",
      () => {
        Jest.useFakeTimers();
        let a = Wonka.fromList([1, 2, 3]);

        let talkback = ref((. _: Wonka_types.talkbackT) => ());
        let signals = [||];

        let source = WonkaJs.debounce((. _) => 1000, a) |> Wonka.take(3);

        source((. signal) =>
          switch (signal) {
          | Start(x) =>
            talkback := x;
            x(. Pull);
          | Push(_) =>
            ignore(Js.Array.push(signal, signals));
            talkback^(. Pull);
          | End => ignore(Js.Array.push(signal, signals))
          }
        );

        Jest.runTimersToTime(500);

        expect(signals) == [||];
      },
    );

    it("should debounce emissions based on the duration selector", () => {
      Jest.useFakeTimers();
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.debounce((. _) => 1000, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(2000);

      expect(signals) == [|Push(1), Push(2)|];
    });

    it("should emit an End signal when the source has emitted all values", () => {
      Jest.useFakeTimers();
      let a = Wonka.fromList([1, 2, 3]);

      let talkback = ref((. _: Wonka_types.talkbackT) => ());
      let signals = [||];

      let source = WonkaJs.debounce((. _) => 1000, a) |> Wonka.take(3);

      source((. signal) =>
        switch (signal) {
        | Start(x) =>
          talkback := x;
          x(. Pull);
        | Push(_) =>
          ignore(Js.Array.push(signal, signals));
          talkback^(. Pull);
        | End => ignore(Js.Array.push(signal, signals))
        }
      );

      Jest.runTimersToTime(3000);

      expect(signals) == [|Push(1), Push(2), Push(3), End|];
    });
  });

  describe("toPromise", () => {
    open Expect;
    open! Expect.Operators;

    testPromise("should convert a source to a Promise", () => {
      let a = Wonka.fromValue(1);

      a
      |> WonkaJs.toPromise
      |> Js.Promise.then_(x => expect(x) |> toEqual(1) |> Js.Promise.resolve);
    });

    testPromise("should resolve only the last emitted value from a source", () => {
      let a = Wonka.fromList([1, 2, 3]);

      a
      |> WonkaJs.toPromise
      |> Js.Promise.then_(x => expect(x) |> toEqual(3) |> Js.Promise.resolve);
    });
  });
});
