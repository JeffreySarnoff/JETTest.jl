var documenterSearchIndex = {"docs":
[{"location":"generated-index/#JETTest","page":"README","title":"JETTest","text":"","category":"section"},{"location":"generated-index/","page":"README","title":"README","text":"(Image: CI) (Image: codecov)","category":"page"},{"location":"generated-index/","page":"README","title":"README","text":"JETTest.jl is an advanced testing toolset for the Julia programming language. It automatically detects otherwise-overlooked problems, and helps you keep your code free from the problems.","category":"page"},{"location":"generated-index/","page":"README","title":"README","text":"The JETTest.jl toolset includes:","category":"page"},{"location":"generated-index/","page":"README","title":"README","text":"Dispatch Analysis: automatically detects possible performance pitfalls, where the optimization was failed and/or runtime dispatch will happen","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"CurrentModule = JETTest","category":"page"},{"location":"toolset/dispatch/#Dispatch-Analysis","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"","category":"section"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"When Julia compiles your code but type inference was not so successful, the compiler is likely to be unable to resolve which method should be called at each generic function call-site, and then it will be looked up at runtime. That is called \"runtime dispatch\", which is known as a common source of performance problem — since the compiler can't do various kinds of optimizations including inlining when it doesn't know matching methods, and method lookup itself can also be a bottleneck if the call happens many times.","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"In order to avoid this problem, we usually use code_typed, inspect its output, and check if there is anywhere type is not well inferred (i.e. where is \"type-instable\") and optimization was not successful. But the problem is that code_typed can only present the \"final\" output of inference or optimization, and we can't inspect an entire call graph and may not be able to find where a problem happened and how the \"type instability\" has been propagated.","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"There is a nice package called Cthulhu.jl, which allows us to inspect the output of code_typed by descending into a call tree, recursively and interactively. The workflow with Cthulhu is much more powerful, but still, it's tedious.","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"So, why not automate it ? JETTest.jl implements such an analyzer that analyzes optimized IRs of your code and automatically detects anywhere the compiler failed to optimize your code, or couldn't resolve matching methods and thus dispatch will happen at runtime.","category":"page"},{"location":"toolset/dispatch/#dispatch-analysis-quick-start","page":"Dispatch Analysis","title":"Quick Start","text":"","category":"section"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"@report_dispatch analyzes the entire call graph of a given function call, and then reports optimization failures and runtime dispatch points:","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"using JETTest\n\naddsincos(v1, v2) = sin(v1) + cos(v2); # main computation kernel\n\nparams = (; v1 = 10, v2 = -10);\nf() = addsincos(params.v1, params.v2); # this function uses the non-constant global variable and thus is very type-unstable\n\n@report_dispatch f() # runtime dispatches will be reported\n\nf(params) = addsincos(params.v1, params.v2); # we can pass parameters as a function argument, and then everything is type-stable\n@report_dispatch f((; v1 = 10, v2 = -10)) # now runtime dispatch free !","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"With the frame_filter configuration, we can focus on type instabilities within specific modules of our interest:","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"# problem: when ∑1/n exceeds 30 ?\nfunction compute(x)\n    r = 1\n    s = 0.0\n    n = 1\n    @time while r < x\n        s += 1/n\n        if s ≥ r\n            # `println` call is full of runtime dispatches for good reasons\n            # and we're not interested in type-instabilities within this call\n            # since we know it's only called few times\n            println(\"round $r/$x has been finished\")\n            r += 1\n        end\n        n += 1\n    end\n    return n, s\nend\n\n@report_dispatch compute(30) # bunch of reports will be reported from the `println` call\n\nthis_module_filter(sv) = sv.mod === @__MODULE__;\n@report_dispatch frame_filter=this_module_filter compute(30) # focus on what we wrote, and no error should be reported","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"@test_nodispatch can be used to assert that a given function call is free of type instabilities under Test standard library's unit-testing infrastructure:","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"@test_nodispatch f()\n\n@test_nodispatch frame_filter=this_module_filter compute(30)\n\nusing Test\n\n@testset \"check type-stabilities\" begin\n    @test_nodispatch f() # should fail\n\n    params = (; v1 = 10, v2 = -10)\n    @test_nodispatch f(params) # should pass\n\n    @test_nodispatch frame_filter=this_module_filter compute(30) # should pass\n\n    @test_nodispatch broken=true compute(30) # should pass with the \"broken\" annotation\nend","category":"page"},{"location":"toolset/dispatch/#dispatch-analysis-entry-points","page":"Dispatch Analysis","title":"Entry Points","text":"","category":"section"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"These macros/functions are the entries of dispatch analysis:","category":"page"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"@report_dispatch\nreport_dispatch\n@analyze_dispatch\nanalyze_dispatch\n@test_nodispatch","category":"page"},{"location":"toolset/dispatch/#JETTest.@report_dispatch","page":"Dispatch Analysis","title":"JETTest.@report_dispatch","text":"@report_dispatch [jetconfigs...] f(args...)\n\nEvaluates the arguments to the function call, determines its types, and then calls report_dispatch on the resulting expression. As with @code_typed and its family, any of JET configurations or dispatch analysis specific configurations can be given as the optional arguments like this:\n\n# reports `rand(::Type{Bool})` with `unoptimize_throw_blocks` configuration turned on\njulia> @report_call unoptimize_throw_blocks=true rand(Bool)\n\n\n\n\n\n","category":"macro"},{"location":"toolset/dispatch/#JETTest.report_dispatch","page":"Dispatch Analysis","title":"JETTest.report_dispatch","text":"report_dispatch(f, types = Tuple{}; jetconfigs...) -> result_type::Any\n\nAnalyzes the generic function call with the given type signature, and then prints detected optimization failures and runtime dispatch points to stdout, and finally returns the result type of the call.\n\n\n\n\n\n","category":"function"},{"location":"toolset/dispatch/#JETTest.@analyze_dispatch","page":"Dispatch Analysis","title":"JETTest.@analyze_dispatch","text":"@report_dispatch [jetconfigs...] f(args...)\n\nEvaluates the arguments to the function call, determines its types, and then calls analyze_dispatch on the resulting expression. As with @code_typed and its family, any of JET configurations or dispatch analysis specific configurations can be given as the optional arguments like this:\n\n# reports `rand(::Type{Bool})` with `unoptimize_throw_blocks` configuration turned on\njulia> @analyze_dispatch unoptimize_throw_blocks=true rand(Bool)\n\n\n\n\n\n","category":"macro"},{"location":"toolset/dispatch/#JETTest.analyze_dispatch","page":"Dispatch Analysis","title":"JETTest.analyze_dispatch","text":"analyze_dispatch(f, types = Tuple{}; jetconfigs...) -> (analyzer::DispatchAnalyzer, frame::Union{InferenceFrame,Nothing})\n\nAnalyzes the generic function call with the given type signature, and returns:\n\nanalyzer::DispatchAnalyzer: contains analyzed optimization failures and runtime dispatch points\nframe::Union{InferenceFrame,Nothing}: the final state of the abstract interpretation, or nothing if f is a generator and the code generation has been failed\n\n\n\n\n\n","category":"function"},{"location":"toolset/dispatch/#JETTest.@test_nodispatch","page":"Dispatch Analysis","title":"JETTest.@test_nodispatch","text":"@test_nodispatch [jetconfigs...] [broken=false] [skip=false] f(args...)\n\nTests the generic function call f(args...) is free from runtime dispatch. Returns a Pass result if it is, a Fail result if if contains any location where runtime dispatch or optimization failure happens, or an Error result if this macro encounters an unexpected error. When the test Fails, abstract call stack to each problem location will also be printed to stdout.\n\njulia> @test_nodispatch sincos(10)\nTest Passed\n  Expression: #= none:1 =# JETTest.@test_nodispatch sincos(10)\n\nAs with @report_dispatch or @analyze_dispatch, any of JET configurations or dispatch analysis specific configurations can be given as the optional arguments like this:\n\njulia> function f(n)\n            r = sincos(n)\n            println(r) # `println` is full of runtime dispatches, but we can ignore the corresponding reports from `Base` by explicit frame filter\n            return r\n       end;\njulia> this_module_filter(x) = x.mod === @__MODULE__;\n\njulia> @test_nodispatch frame_filter=this_module_filter f(10)\nTest Passed\n  Expression: #= none:1 =# JETTest.@test_nodispatch frame_filter = this_module_filter f(10)\n\n@test_nodispatch is fully integrated with Test standard library's unit-testing infrastructure. It means, the result of @test_nodispatch will be included in the final @testset summary, it supports skip and broken annotations as @test macro does, etc.\n\njulia> using JETTest, Test\n\njulia> f(params) = sin(params.value); # type-stable\njulia> params = (; value = 10);       # non-constant global variable\njulia> g() = sin(params.value);       # very type-instable\n\njulia> @testset \"check optimizations\" begin\n           @test_nodispatch f((; value = 10)) # pass\n           @test_nodispatch g()               # fail\n           @test_nodispatch broken=true g()   # annotated as broken, thus still \"pass\"\n       end\ncheck optimizations: Dispatch Test Failed at none:3\n  Expression: #= none:3 =# JETTest.@test_nodispatch g()\n  ═════ 2 possible errors found ═════\n  ┌ @ none:1 Base.getproperty(%1, :value)\n  │ runtime dispatch detected: Base.getproperty(%1::Any, :value::Symbol)\n  └──────────\n  ┌ @ none:1 Main.sin(%2)\n  │ runtime dispatch detected: Main.sin(%2::Any)\n  └──────────\n\nTest Summary:       | Pass  Fail  Broken  Total\ncheck optimizations |    1     1       1      3\nERROR: Some tests did not pass: 1 passed, 1 failed, 0 errored, 1 broken.\n\n\n\n\n\n","category":"macro"},{"location":"toolset/dispatch/#dispatch-analysis-configurations","page":"Dispatch Analysis","title":"Configurations","text":"","category":"section"},{"location":"toolset/dispatch/","page":"Dispatch Analysis","title":"Dispatch Analysis","text":"DispatchAnalyzer","category":"page"},{"location":"toolset/dispatch/#JETTest.DispatchAnalyzer","page":"Dispatch Analysis","title":"JETTest.DispatchAnalyzer","text":"Every entry point of dispatch analysis can accept any of JET configurations as well as the following additional configurations that are specific to dispatch analysis:\n\nframe_filter = x::Union{Core.Compiler.InferenceState, Core.Compiler.OptimizationState}->true:\nA predicate which takes InfernceState or OptimizationState and returns false to skip analysis on the frame.\nfunction_filter = @nospecialize(ft)->true:\nA predicate which takes a function type and returns false to skip analysis on the call.\nanalyze_unoptimized_throw_blocks::Bool = false:\nBy default, Julia's native compilation pipeline intentionally disables inference (and so succeeding optimizations too) on \"throw blocks\", which are code blocks that will eventually lead to throw calls, in order to ease the compilation latency problem, a.k.a. \"first-time-to-plot\". Accordingly, the dispatch analyzer also ignores runtime dispatches detected within those blocks since we usually don't mind if code involved with error handling isn't optimized. If analyze_unoptimized_throw_blocks is set to true, it doesn't ignore them and will report type instabilities detected within \"throw blocks\".\nSee also https://github.com/JuliaLang/julia/pull/35982.\n\nConfiguration Examples\n\n# only checks code within the current module:\njulia> mymodule_filter(x) = x.mod === @__MODULE__;\njulia> @report_dispatch frame_filter=mymodule_filter f(args...)\n...\n\n# ignores `Core.Compiler.widenconst` calls (since it's designed to be runtime-dispatched):\njulia> myfunction_filter(@nospecialize(ft)) = ft !== typeof(Core.Compiler.widenconst)\njulia> @report_dispatch function_filter=myfunction_filter f(args...)\n...\n\n# by default, unoptimized \"throw blocks\" are not analyzed\njulia> @test_nodispatch sin(10)\nTest Passed\n  Expression: #= none:1 =# JETTest.@test_nodispatch sin(10)\n\n# we can turn on the analysis on unoptimized \"throw blocks\" with `analyze_unoptimized_throw_blocks=true`\njulia> @test_nodispatch analyze_unoptimized_throw_blocks=true sin(10)\nDispatch Test Failed at none:1\n  Expression: #= none:1 =# JETTest.@test_nodispatch analyze_unoptimized_throw_blocks = true sin(10)\n  ═════ 1 possible error found ═════\n  ┌ @ math.jl:1221 Base.Math.sin(xf)\n  │┌ @ special/trig.jl:39 Base.Math.sin_domain_error(x)\n  ││┌ @ special/trig.jl:28 Base.Math.DomainError(x, \"sin(x) is only defined for finite x.\")\n  │││ runtime dispatch detected: Base.Math.DomainError(x::Float64, \"sin(x) is only defined for finite x.\")\n  ││└──────────────────────\n\nERROR: There was an error during testing\n\n# we can also turns off the heuristic itself\njulia> @test_nodispatch unoptimize_throw_blocks=false analyze_unoptimized_throw_blocks=true sin(10)\nTest Passed\n  Expression: #= none:1 =# JETTest.@test_nodispatch unoptimize_throw_blocks = false analyze_unoptimized_throw_blocks = true sin(10)\n\n\n\n\n\n","category":"type"}]
}
