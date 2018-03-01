open Nice;

type action = | MoveX(int);

type state = {
  mutable unsubscribe: unit => unit,
  mutable hasSub: bool,
  posX: int
};

let component = ReasonReact.reducerComponent("RangeSlider");

let bar = css([|
  Display(Block),
  Position(Relative),
  Height(Px(8)),
  BackgroundColor(RGBa(0, 0, 0, 0.2)),
  BorderRadius(Px(3)),
  Width(Px(400)),
  MarginTop(Px(30)),
  MarginBottom(Px(30)),
  MarginLeft(Px(20)),
  MarginRight(Px(20))
|]);

let knob = css([|
  Position(Absolute),
  MarginLeft(Px(-10)),
  Top(Px(-6)),
  Height(Px(20)),
  Width(Px(20)),
  BackgroundColor(Palevioletred),
  BorderRadius(Percent(50.))
|]);

let documentTarget = Webapi.Dom.Document.asEventTarget(Webapi.Dom.document);

let mousemove = WonkaJs.fromListener(
  handler =>
    Webapi.Dom.EventTarget.addMouseMoveEventListener(handler, documentTarget),
  handler =>
    Webapi.Dom.EventTarget.removeMouseMoveEventListener(handler, documentTarget)
);

let mouseup = WonkaJs.fromListener(
  handler =>
    Webapi.Dom.EventTarget.addEventListener("mouseup", handler, documentTarget),
  handler =>
    Webapi.Dom.EventTarget.removeEventListener("mouseup", handler, documentTarget)
);

let computeX = (element, evt) => {
  open Webapi.Dom;

  let rect = Element.getBoundingClientRect(element);
  let left = DomRect.left(rect);
  let width = float_of_int(DomRect.width(rect));
  let clientX = MouseEvent.clientX(evt);
  let x = float_of_int(clientX - left) /. width
    |> Js.Math.max_float(0.)
    |> Js.Math.min_float(1.);

  int_of_float(x *. width)
};

let make = (_children) => {
  let onBarRef = (state, send, barRef, _) =>
    switch (Js.Nullable.toOption(barRef)) {
    | Some(element) when !state.hasSub => {
      state.hasSub = true;
      state.unsubscribe = WonkaJs.fromDomEvent(element, "mousedown")
        |> Wonka.map((_) => mousemove
          |> WonkaJs.throttle((_) => 1000 / 60)
          |> Wonka.takeUntil(mouseup))
        |> Wonka.flatten
        |> Wonka.map(computeX(element))
        |> Wonka.subscribe(x => send(MoveX(x)));
    }
    | _ => ()
    };

  {
    ...component,
    initialState: () => {
      unsubscribe: () => (),
      hasSub: false,
      posX: 0
    },
    reducer: (action, state) => {
      switch (action) {
      | MoveX(x) => ReasonReact.Update({ ...state, posX: x })
      }
    },
    willUnmount: self => {
      self.state.unsubscribe();
    },
    render: self => (
      <div className={bar} ref={self.handle(onBarRef(self.state, self.ReasonReact.send))}>
        <div
          className={knob}
          style={ReactDOMRe.Style.make(~left=(string_of_int(self.state.posX) ++ "px"), ())}
        />
      </div>
    )
  }
};
