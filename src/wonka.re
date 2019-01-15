open Wonka_types;
open Wonka_helpers;

module Types = Wonka_types;

type subjectState('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable ended: bool
};

let makeSubject = () => {
  let state: subjectState('a) = {
    sinks: Rebel.Array.makeEmpty(),
    ended: false,
  };

  let source = sink => {
    state.sinks = Rebel.Array.append(state.sinks, sink);
    sink(.Start((.signal) => {
      if (signal === Close) {
        state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink);
      }
    }));
  };

  let next = value =>
    if (!state.ended) {
      Rebel.Array.forEach(state.sinks, sink => sink(.Push(value)));
    };

  let complete = () =>
    if (!state.ended) {
      state.ended = true;
      Rebel.Array.forEach(state.sinks, sink => sink(.End));
    };

  { source, next, complete }
};

let make = f => curry(sink => {
  let teardown = f({
    next: value => sink(.Push(value)),
    complete: () => sink(.End)
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => teardown()
    | Pull => ()
    }
  }));
});

type fromListState('a) = {
  mutable value: 'a,
  mutable ended: bool,
  mutable looping: bool,
  mutable pull: bool
};

let fromList = ls => curry(sink => {
  let state = {
    value: ls,
    ended: false,
    looping: false,
    pull: false
  };

  sink(.Start((.signal) => {
    switch (signal, state.looping) {
    | (Pull, false) => {
      state.pull = true;
      state.looping = true;

      while (state.pull && !state.ended) {
        switch (state.value) {
        | [x, ...rest] => {
          state.value = rest;
          state.pull = false;
          sink(.Push(x));
        }
        | [] => {
          state.ended = true;
          sink(.End);
        }
        }
      };

      state.looping = false;
    }
    | (Pull, true) => state.pull = true
    | (Close, _) => state.ended = true
    }
  }));
});

type fromArrayState('a) = {
  mutable index: int,
  mutable ended: bool,
  mutable looping: bool,
  mutable pull: bool
};

let fromArray = arr => curry(sink => {
  let size = Rebel.Array.size(arr);
  let state = {
    index: 0,
    ended: false,
    looping: false,
    pull: false
  };

  sink(.Start((.signal) => {
    switch (signal, state.looping) {
    | (Pull, false) => {
      state.pull = true;
      state.looping = true;

      while (state.pull && !state.ended) {
        let index = state.index;
        if (index < size) {
          let x = Rebel.Array.getUnsafe(arr, index);
          state.index = index + 1;
          state.pull = false;
          sink(.Push(x));
        } else {
          state.ended = true;
          sink(.End);
        }
      };

      state.looping = false;
    }
    | (Pull, true) => state.pull = true
    | (Close, _) => state.ended = true
    }
  }));
});

let fromValue = x => curry(sink => {
  let ended = ref(false);

  sink(.Start((.signal) => {
    switch (signal) {
    | Pull when !ended^ => {
      ended := true;
      sink(.Push(x));
      sink(.End);
    }
    | _ => ()
    }
  }));
});

let empty = sink => {
  sink(.Start(talkbackPlaceholder));
  sink(.End);
};

let never = sink => {
  sink(.Start(talkbackPlaceholder));
};

let tap = f => curry(source => curry(sink => {
  source((.signal) => {
    switch (signal) {
    | Push(x) => f(.x)
    | _ => ()
    };

    sink(.signal);
  });
}));

let map = f => curry(source => curry(sink => {
  source((.signal) => sink(.
    switch (signal) {
    | Start(x) => Start(x)
    | Push(x) => Push(f(x))
    | End => End
    }
  ));
}));

let filter = f => curry(source => curry(sink => {
  captureTalkback(source, (.signal, talkback) => {
    switch (signal) {
    | Push(x) when !f(x) => talkback(.Pull)
    | _ => sink(.signal)
    }
  });
}));

let scan = (f, seed) => curry(source => curry(sink => {
  let acc = ref(seed);

  source((.signal) => sink(.
    switch (signal) {
    | Push(x) => {
      acc := f(acc^, x);
      Push(acc^)
    }
    | Start(x) => Start(x)
    | End => End
    }
  ));
}));

type mergeMapStateT = {
  mutable outerTalkback: (.talkbackT) => unit,
  mutable innerTalkbacks: Rebel.Array.t((.talkbackT) => unit),
  mutable ended: bool
};

let mergeMap = f => curry(source => curry(sink => {
  let state: mergeMapStateT = {
    outerTalkback: talkbackPlaceholder,
    innerTalkbacks: Rebel.Array.makeEmpty(),
    ended: false
  };

  let applyInnerSource = innerSource => {
    let talkback = ref(talkbackPlaceholder);

    innerSource((.signal) => {
      switch (signal) {
      | End => {
        state.innerTalkbacks = Rebel.Array.filter(state.innerTalkbacks, x => x !== talkback^);
        if (state.ended && Rebel.Array.size(state.innerTalkbacks) === 0) {
          sink(.End);
        }
      }
      | Start(tb) => {
        talkback := tb;
        state.innerTalkbacks = Rebel.Array.append(state.innerTalkbacks, tb);
        tb(.Pull);
      }
      | Push(x) when Rebel.Array.size(state.innerTalkbacks) !== 0 => {
        sink(.Push(x));
        talkback^(.Pull);
      }
      | Push(_) => ()
      }
    });
  };

  source((.signal) => {
    switch (signal) {
    | End when !state.ended => {
      state.ended = true;
      if (Rebel.Array.size(state.innerTalkbacks) === 0) {
        sink(.End);
      }
    }
    | End => ()
    | Start(tb) => {
      state.outerTalkback = tb;
      tb(.Pull);
    }
    | Push(x) when !state.ended => {
      applyInnerSource(f(x));
      state.outerTalkback(.Pull);
    }
    | Push(_) => ()
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Close when !state.ended => {
      state.ended = true;
      state.outerTalkback(.Close);
      Rebel.Array.forEach(state.innerTalkbacks, talkback => talkback(.Close));
      state.innerTalkbacks = Rebel.Array.makeEmpty();
    }
    | Close => ()
    | Pull when !state.ended =>
      Rebel.Array.forEach(state.innerTalkbacks, talkback => talkback(.Pull));
    | Pull => ()
    }
  }));
}));

let merge = sources => mergeMap(identity, fromArray(sources));
let mergeAll = source => mergeMap(identity, source);
let flatten = mergeAll;

type concatMapStateT('a) = {
  inputQueue: Rebel.MutableQueue.t('a),
  mutable outerTalkback: (.talkbackT) => unit,
  mutable innerTalkback: (.talkbackT) => unit,
  mutable innerActive: bool,
  mutable closed: bool,
  mutable ended: bool
};

let concatMap = f => curry(source => curry(sink => {
  let state: concatMapStateT('a) = {
    inputQueue: Rebel.MutableQueue.make(),
    outerTalkback: talkbackPlaceholder,
    innerTalkback: talkbackPlaceholder,
    innerActive: false,
    closed: false,
    ended: false
  };

  let rec applyInnerSource = innerSource =>
    innerSource((.signal) => {
      switch (signal) {
      | End => {
        state.innerActive = false;
        state.innerTalkback = talkbackPlaceholder;

        switch (Rebel.MutableQueue.pop(state.inputQueue)) {
        | Some(input) => applyInnerSource(f(input))
        | None when state.ended => sink(.End)
        | None => ()
        };
      }
      | Start(tb) => {
        state.innerActive = true;
        state.innerTalkback = tb;
        tb(.Pull);
      }
      | Push(x) when !state.closed => {
        sink(.Push(x));
        state.innerTalkback(.Pull);
      }
      | Push(_) => ()
      }
    });

  source((.signal) => {
    switch (signal) {
    | End when !state.ended => {
      state.ended = true;
      if (!state.innerActive && Rebel.MutableQueue.isEmpty(state.inputQueue)) {
        sink(.End);
      }
    }
    | End => ()
    | Start(tb) => {
      state.outerTalkback = tb;
      tb(.Pull);
    }
    | Push(x) when !state.ended => {
      if (state.innerActive) {
        Rebel.MutableQueue.add(state.inputQueue, x);
      } else {
        applyInnerSource(f(x));
      }

      state.outerTalkback(.Pull);
    }
    | Push(_) => ()
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Pull => if (!state.ended) state.innerTalkback(.Pull)
    | Close when !state.ended => {
      state.ended = true;
      state.closed = true;
      state.outerTalkback(.Close);
      state.innerTalkback(.Close);
    }
    | Close => ()
    }
  }));
}));

let concatAll = source => concatMap(identity, source);
let concat = sources => concatMap(identity, fromArray(sources));

type switchMapStateT('a) = {
  mutable outerTalkback: (.talkbackT) => unit,
  mutable innerTalkback: (.talkbackT) => unit,
  mutable innerActive: bool,
  mutable closed: bool,
  mutable ended: bool
};

let switchMap = f => curry(source => curry(sink => {
  let state: switchMapStateT('a) = {
    outerTalkback: talkbackPlaceholder,
    innerTalkback: talkbackPlaceholder,
    innerActive: false,
    closed: false,
    ended: false
  };

  let applyInnerSource = innerSource =>
    innerSource((.signal) => {
      switch (signal) {
      | End => {
        state.innerActive = false;
        state.innerTalkback = talkbackPlaceholder;
        if (state.ended) sink(.End);
      }
      | Start(tb) => {
        state.innerActive = true;
        state.innerTalkback = tb;
        tb(.Pull);
      }
      | Push(x) when !state.closed => {
        sink(.Push(x));
        state.innerTalkback(.Pull);
      }
      | Push(_) => ()
      }
    });

  source((.signal) => {
    switch (signal) {
    | End when !state.ended => {
      state.ended = true;
      if (!state.innerActive) sink(.End);
    }
    | End => ()
    | Start(tb) => {
      state.outerTalkback = tb;
      tb(.Pull);
    }
    | Push(x) when !state.ended => {
      if (state.innerActive) {
        state.innerTalkback(.Close);
        state.innerTalkback = talkbackPlaceholder;
      }
      applyInnerSource(f(x));
      state.outerTalkback(.Pull);
    }
    | Push(_) => ()
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Pull => state.innerTalkback(.Pull)
    | Close when !state.ended => {
      state.ended = true;
      state.closed = true;
      state.outerTalkback(.Close);
      state.innerTalkback(.Close);
      state.innerTalkback = talkbackPlaceholder;
    }
    | Close => ()
    }
  }));
}));

type shareStateT('a) = {
  mutable sinks: Rebel.Array.t(sinkT('a)),
  mutable talkback: (.talkbackT) => unit,
  mutable gotSignal: bool
};

let share = source => {
  let state = {
    sinks: Rebel.Array.makeEmpty(),
    talkback: talkbackPlaceholder,
    gotSignal: false
  };

  sink => {
    state.sinks = Rebel.Array.append(state.sinks, sink);

    if (Rebel.Array.size(state.sinks) === 1) {
      source((.signal) => {
        switch (signal) {
        | Push(_) => {
          state.gotSignal = false;
          Rebel.Array.forEach(state.sinks, sink => sink(.signal));
        }
        | Start(x) => state.talkback = x
        | End => {
          Rebel.Array.forEach(state.sinks, sink => sink(.End));
          state.sinks = Rebel.Array.makeEmpty();
        }
        }
      });
    };

    sink(.Start((.signal) => {
      switch (signal) {
      | Close => {
        state.sinks = Rebel.Array.filter(state.sinks, x => x !== sink);
        if (Rebel.Array.size(state.sinks) === 0) {
          state.talkback(.Close);
        };
      }
      | Pull when !state.gotSignal => {
        state.gotSignal = true;
        state.talkback(.signal);
      }
      | Pull => ()
      }
    }));
  }
};

type combineStateT('a, 'b) = {
  mutable talkbackA: (.talkbackT) => unit,
  mutable talkbackB: (.talkbackT) => unit,
  mutable lastValA: option('a),
  mutable lastValB: option('b),
  mutable gotSignal: bool,
  mutable endCounter: int,
  mutable ended: bool,
};

let combine = (sourceA, sourceB) => curry(sink => {
  let state = {
    talkbackA: talkbackPlaceholder,
    talkbackB: talkbackPlaceholder,
    lastValA: None,
    lastValB: None,
    gotSignal: false,
    endCounter: 0,
    ended: false
  };

  sourceA((.signal) => {
    switch (signal, state.lastValB) {
    | (Start(tb), _) => state.talkbackA = tb
    | (Push(a), None) => {
      state.lastValA = Some(a);
      state.gotSignal = false;
    }
    | (Push(a), Some(b)) when !state.ended => {
      state.lastValA = Some(a);
      state.gotSignal = false;
      sink(.Push((a, b)));
    }
    | (End, _) when state.endCounter < 1 =>
      state.endCounter = state.endCounter + 1
    | (End, _) when !state.ended => {
      state.ended = true;
      sink(.End);
    }
    | _ => ()
    }
  });

  sourceB((.signal) => {
    switch (signal, state.lastValA) {
    | (Start(tb), _) => state.talkbackB = tb
    | (Push(b), None) => {
      state.lastValB = Some(b);
      state.gotSignal = false;
    }
    | (Push(b), Some(a)) when !state.ended => {
      state.lastValB = Some(b);
      state.gotSignal = false;
      sink(.Push((a, b)));
    }
    | (End, _) when state.endCounter < 1 =>
      state.endCounter = state.endCounter + 1
    | (End, _) when !state.ended => {
      state.ended = true;
      sink(.End);
    }
    | _ => ()
    }
  });

  sink(.Start((.signal) => {
    if (!state.ended) {
      switch (signal) {
      | Close => {
        state.ended = true;
        state.talkbackA(.Close);
        state.talkbackB(.Close);
      }
      | Pull when !state.gotSignal => {
        state.gotSignal = true;
        state.talkbackA(.signal);
        state.talkbackB(.signal);
      }
      | Pull => ()
      }
    };
  }));
});

type takeStateT = {
  mutable taken: int,
  mutable talkback: (.talkbackT) => unit
};

let take = max => curry(source => curry(sink => {
  let state: takeStateT = {
    taken: 0,
    talkback: talkbackPlaceholder
  };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => state.talkback = tb;
    | Push(_) when state.taken < max => {
      state.taken = state.taken + 1;
      sink(.signal);

      if (state.taken === max) {
        sink(.End);
        state.talkback(.Close);
      };
    }
    | Push(_) => ()
    | End when state.taken < max => {
      state.taken = max;
      sink(.End)
    }
    | End => ()
    }
  });

  sink(.Start((.signal) => {
    if (state.taken < max) {
      switch (signal) {
      | Pull => state.talkback(.Pull);
      | Close => {
        state.taken = max;
        state.talkback(.Close);
      }
      }
    };
  }));
}));

let takeLast = max => curry(source => curry(sink => {
  open Rebel;
  let queue = MutableQueue.make();

  captureTalkback(source, (.signal, talkback) => {
    switch (signal) {
    | Start(_) => talkback(.Pull)
    | Push(x) => {
      let size = MutableQueue.size(queue);
      if (size >= max && max > 0) {
        ignore(MutableQueue.pop(queue));
      };

      MutableQueue.add(queue, x);
      talkback(.Pull);
    }
    | End => makeTrampoline(sink, (.) => MutableQueue.pop(queue))
    }
  });
}));

let takeWhile = predicate => curry(source => curry(sink => {
  let ended = ref(false);
  let talkback = ref(talkbackPlaceholder);

  source((.signal) => {
    switch (signal) {
    | Start(tb) => {
      talkback := tb;
      sink(.signal);
    }
    | End when !ended^ => {
      ended := true;
      sink(.End);
    }
    | End => ()
    | Push(x) when !ended^ => {
      if (!predicate(x)) {
        ended := true;
        sink(.End);
        talkback^(.Close);
      } else {
        sink(.signal);
      };
    }
    | Push(_) => ()
    }
  });

  sink(.Start((.signal) => {
    if (!ended^) {
      switch (signal) {
      | Pull => talkback^(.Pull);
      | Close => {
        ended := true;
        talkback^(.Close);
      }
      }
    };
  }));
}));

type takeUntilStateT = {
  mutable ended: bool,
  mutable sourceTalkback: (.talkbackT) => unit,
  mutable notifierTalkback: (.talkbackT) => unit
};

let takeUntil = notifier => curry(source => curry(sink => {
  let state: takeUntilStateT = {
    ended: false,
    sourceTalkback: talkbackPlaceholder,
    notifierTalkback: talkbackPlaceholder
  };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => {
      state.sourceTalkback = tb;

      notifier((.signal) => {
        switch (signal) {
        | Start(innerTb) => {
          state.notifierTalkback = innerTb;
          innerTb(.Pull);
        }
        | Push(_) => {
          state.ended = true;
          state.notifierTalkback(.Close);
          state.sourceTalkback(.Close);
          sink(.End);
        }
        | End => ()
        }
      });
    }
    | End when !state.ended => {
      state.notifierTalkback(.Close);
      state.ended = true;
      sink(.End);
    }
    | End => ()
    | Push(_) when !state.ended => sink(.signal)
    | Push(_) => ()
    }
  });

  sink(.Start((.signal) => {
    if (!state.ended) {
      switch (signal) {
      | Close => {
        state.sourceTalkback(.Close);
        state.notifierTalkback(.Close);
      }
      | Pull => state.sourceTalkback(.Pull)
      }
    };
  }));
}));

let skip = wait => curry(source => curry(sink => {
  let rest = ref(wait);

  captureTalkback(source, (.signal, talkback) => {
    switch (signal) {
    | Push(_) when rest^ > 0 => {
      rest := rest^ - 1;
      talkback(.Pull);
    }
    | _ => sink(.signal)
    }
  });
}));

let skipWhile = predicate => curry(source => curry(sink => {
  let skip = ref(true);

  captureTalkback(source, (.signal, talkback) => {
    switch (signal) {
    | Push(x) when skip^ => {
      if (predicate(x)) {
        talkback(.Pull);
      } else {
        skip := false;
        sink(.signal);
      };
    }
    | _ => sink(.signal)
    }
  });
}));

type skipUntilStateT = {
  mutable skip: bool,
  mutable ended: bool,
  mutable gotSignal: bool,
  mutable sourceTalkback: (.talkbackT) => unit,
  mutable notifierTalkback: (.talkbackT) => unit
};

let skipUntil = notifier => curry(source => curry(sink => {
  let state: skipUntilStateT = {
    skip: true,
    ended: false,
    gotSignal: false,
    sourceTalkback: talkbackPlaceholder,
    notifierTalkback: talkbackPlaceholder
  };

  source((.signal) => {
    switch (signal) {
    | Start(tb) => {
      state.sourceTalkback = tb;

      notifier((.signal) => {
        switch (signal) {
        | Start(innerTb) => {
          state.notifierTalkback = innerTb;
          innerTb(.Pull);
          tb(.Pull);
        }
        | Push(_) => {
          state.skip = false;
          state.notifierTalkback(.Close);
        }
        | End => ()
        }
      });
    }
    | Push(_) when state.skip && !state.ended => state.sourceTalkback(.Pull)
    | Push(_) when !state.ended => {
      state.gotSignal = false;
      sink(.signal)
    }
    | Push(_) => ()
    | End => {
      if (state.skip) state.notifierTalkback(.Close);
      state.ended = true;
      sink(.End)
    }
    }
  });

  sink(.Start((.signal) => {
    switch (signal) {
    | Close => {
      if (state.skip) state.notifierTalkback(.Close);
      state.ended = true;
      state.sourceTalkback(.Close);
    }
    | Pull when !state.gotSignal && !state.ended => {
      state.gotSignal = true;
      state.sourceTalkback(.Pull);
    }
    | Pull => ()
    }
  }));
}));

type publishStateT = {
  mutable talkback: (.talkbackT) => unit,
  mutable ended: bool
};

let publish = source => {
  let state: publishStateT = {
    talkback: talkbackPlaceholder,
    ended: false
  };

  source((.signal) => {
    switch (signal) {
    | Start(x) => {
      state.talkback = x;
      x(.Pull);
    }
    | Push(_) => if (!state.ended) state.talkback(.Pull);
    | End => state.ended = true;
    }
  });

  {
    unsubscribe: () =>
      if (!state.ended) {
        state.ended = true;
        state.talkback(.Close);
      }
  }
};

let subscribe = f => curry(source => {
  let state: publishStateT = {
    talkback: talkbackPlaceholder,
    ended: false
  };

  source((.signal) => {
    switch (signal) {
    | Start(x) => {
      state.talkback = x;
      x(.Pull);
    }
    | Push(x) when !state.ended => {
      f(.x);
      state.talkback(.Pull);
    }
    | Push(_) => ()
    | End => state.ended = true;
    }
  });

  {
    unsubscribe: () =>
      if (!state.ended) {
        state.ended = true;
        state.talkback(.Close);
      }
  }
});

let forEach = f => curry(source => {
  ignore(subscribe(f, source));
});
