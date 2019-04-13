open Wonka_types;
open Wonka_source_fromListener;

let fromDomEvent = (element, event) =>
  curry(sink => {
    let addEventListener: (Dom.element, string, Dom.event => unit) => unit = [%raw
      {|
    function (element, event, handler) {
      element.addEventListener(event, handler);
    }
  |}
    ];

    let removeEventListener: (Dom.element, string, Dom.event => unit) => unit = [%raw
      {|
    function (element, event, handler) {
      element.removeEventListener(event, handler);
    }
  |}
    ];

    fromListener(
      handler => addEventListener(element, event, handler),
      handler => removeEventListener(element, event, handler),
      sink,
    );
  });
