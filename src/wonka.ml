module Types = Wonka_types

(* sources *)
include Wonka_source_fromArray
include Wonka_source_fromList
include Wonka_source_fromValue
include Wonka_source_make
include Wonka_source_makeSubject
include Wonka_source_primitives

(* operators *)
include Wonka_operator_combine
include Wonka_operator_concatMap
include Wonka_operator_filter
include Wonka_operator_map
include Wonka_operator_mergeMap
include Wonka_operator_onEnd
include Wonka_operator_onPush
include Wonka_operator_onStart
include Wonka_operator_scan
include Wonka_operator_share
include Wonka_operator_skip
include Wonka_operator_skipUntil
include Wonka_operator_skipWhile
include Wonka_operator_switchMap
include Wonka_operator_take
include Wonka_operator_takeLast
include Wonka_operator_takeUntil
include Wonka_operator_takeWhile

(* sinks *)
include Wonka_sink_publish
include Wonka_sink_subscribe

#if BS_NATIVE then
  #if BSB_BACKEND = "js" then
    include WonkaJs
  #end
#else
  include WonkaJs
#end
