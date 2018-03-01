[@bs.val] external require : string => unit = "require";
[@bs.val] external requireUri : string => string = "require";
[@bs.val] external hot : bool = "module.hot";
[@bs.val] external accept : unit => unit = "module.hot.accept";
