(function (Global) {
  "use strict";
  Global.IntelliFactory = {
    Runtime: {
      Ctor: function (ctor, typeFunction) {
        ctor.prototype = typeFunction.prototype;
        return ctor;
      },

      Class: function (members, base, statics) {
        var proto = members;
        if (base) {
          proto = new base();
          for (var m in members) { proto[m] = members[m] }
        }
        var typeFunction = function (copyFrom) {
          if (copyFrom) {
            for (var f in copyFrom) { this[f] = copyFrom[f] }
          }
        }
        typeFunction.prototype = proto;
        if (statics) {
          for (var f in statics) { typeFunction[f] = statics[f] }
        }
        return typeFunction;
      },

      Clone: function (obj) {
        var res = {};
        for (var p in obj) { res[p] = obj[p] }
        return res;
      },

      NewObject:
        function (kv) {
          var o = {};
          for (var i = 0; i < kv.length; i++) {
            o[kv[i][0]] = kv[i][1];
          }
          return o;
        },

      DeleteEmptyFields:
        function (obj, fields) {
          for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (obj[f] === void (0)) { delete obj[f]; }
          }
          return obj;
        },

      GetOptional:
        function (value) {
          return (value === void (0)) ? null : { $: 1, $0: value };
        },

      SetOptional:
        function (obj, field, value) {
          if (value) {
            obj[field] = value.$0;
          } else {
            delete obj[field];
          }
        },

      SetOrDelete:
        function (obj, field, value) {
          if (value === void (0)) {
            delete obj[field];
          } else {
            obj[field] = value;
          }
        },

      Apply: function (f, obj, args) {
        return f.apply(obj, args);
      },

      Bind: function (f, obj) {
        return function () { return f.apply(this, arguments) };
      },

      CreateFuncWithArgs: function (f) {
        return function () { return f(Array.prototype.slice.call(arguments)) };
      },

      CreateFuncWithOnlyThis: function (f) {
        return function () { return f(this) };
      },

      CreateFuncWithThis: function (f) {
        return function () { return f(this).apply(null, arguments) };
      },

      CreateFuncWithThisArgs: function (f) {
        return function () { return f(this)(Array.prototype.slice.call(arguments)) };
      },

      CreateFuncWithRest: function (length, f) {
        return function () { return f(Array.prototype.slice.call(arguments, 0, length).concat([Array.prototype.slice.call(arguments, length)])) };
      },

      CreateFuncWithArgsRest: function (length, f) {
        return function () { return f([Array.prototype.slice.call(arguments, 0, length), Array.prototype.slice.call(arguments, length)]) };
      },

      BindDelegate: function (func, obj) {
        var res = func.bind(obj);
        res.$Func = func;
        res.$Target = obj;
        return res;
      },

      CreateDelegate: function (invokes) {
        if (invokes.length == 0) return null;
        if (invokes.length == 1) return invokes[0];
        var del = function () {
          var res;
          for (var i = 0; i < invokes.length; i++) {
            res = invokes[i].apply(null, arguments);
          }
          return res;
        };
        del.$Invokes = invokes;
        return del;
      },

      CombineDelegates: function (dels) {
        var invokes = [];
        for (var i = 0; i < dels.length; i++) {
          var del = dels[i];
          if (del) {
            if ("$Invokes" in del)
              invokes = invokes.concat(del.$Invokes);
            else
              invokes.push(del);
          }
        }
        return IntelliFactory.Runtime.CreateDelegate(invokes);
      },

      DelegateEqual: function (d1, d2) {
        if (d1 === d2) return true;
        if (d1 == null || d2 == null) return false;
        var i1 = d1.$Invokes || [d1];
        var i2 = d2.$Invokes || [d2];
        if (i1.length != i2.length) return false;
        for (var i = 0; i < i1.length; i++) {
          var e1 = i1[i];
          var e2 = i2[i];
          if (!(e1 === e2 || ("$Func" in e1 && "$Func" in e2 && e1.$Func === e2.$Func && e1.$Target == e2.$Target)))
            return false;
        }
        return true;
      },

      ThisFunc: function (d) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return d.apply(null, args);
        };
      },

      ThisFuncOut: function (f) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return f.apply(args.shift(), args);
        };
      },

      ParamsFunc: function (length, d) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return d.apply(null, args.slice(0, length).concat([args.slice(length)]));
        };
      },

      ParamsFuncOut: function (length, f) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return f.apply(null, args.slice(0, length).concat(args[length]));
        };
      },

      ThisParamsFunc: function (length, d) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          args.unshift(this);
          return d.apply(null, args.slice(0, length + 1).concat([args.slice(length + 1)]));
        };
      },

      ThisParamsFuncOut: function (length, f) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return f.apply(args.shift(), args.slice(0, length).concat(args[length]));
        };
      },

      Curried: function (f, n, args) {
        args = args || [];
        return function (a) {
          var allArgs = args.concat([a === void (0) ? null : a]);
          if (n == 1)
            return f.apply(null, allArgs);
          if (n == 2)
            return function (a) { return f.apply(null, allArgs.concat([a === void (0) ? null : a])); }
          return IntelliFactory.Runtime.Curried(f, n - 1, allArgs);
        }
      },

      Curried2: function (f) {
        return function (a) { return function (b) { return f(a, b); } }
      },

      Curried3: function (f) {
        return function (a) { return function (b) { return function (c) { return f(a, b, c); } } }
      },

      UnionByType: function (types, value, optional) {
        var vt = typeof value;
        for (var i = 0; i < types.length; i++) {
          var t = types[i];
          if (typeof t == "number") {
            if (Array.isArray(value) && (t == 0 || value.length == t)) {
              return { $: i, $0: value };
            }
          } else {
            if (t == vt) {
              return { $: i, $0: value };
            }
          }
        }
        if (!optional) {
          throw new Error("Type not expected for creating Choice value.");
        }
      },

      ScriptBasePath: "./",

      ScriptPath: function (a, f) {
        return this.ScriptBasePath + (this.ScriptSkipAssemblyDir ? "" : a + "/") + f;
      },

      OnLoad:
        function (f) {
          if (!("load" in this)) {
            this.load = [];
          }
          this.load.push(f);
        },

      Start:
        function () {
          function run(c) {
            for (var i = 0; i < c.length; i++) {
              c[i]();
            }
          }
          if ("load" in this) {
            run(this.load);
            this.load = [];
          }
        },
    }
  }

  Global.IntelliFactory.Runtime.OnLoad(function () {
    if (Global.WebSharper && WebSharper.Activator && WebSharper.Activator.Activate)
      WebSharper.Activator.Activate()
  });

  // Polyfill

  if (!Date.now) {
    Date.now = function () {
      return new Date().getTime();
    };
  }

  if (!Math.trunc) {
    Math.trunc = function (x) {
      return x < 0 ? Math.ceil(x) : Math.floor(x);
    }
  }

  if (!Object.setPrototypeOf) {
    Object.setPrototypeOf = function (obj, proto) {
      obj.__proto__ = proto;
      return obj;
    }
  }

  Global.ignore = function() { };
  Global.id = function(x) { return x };
  Global.fst = function(x) { return x[0] };
  Global.snd = function(x) { return x[1] };
  Global.trd = function(x) { return x[2] };

  if (!Global.console) {
    Global.console = {
      count: ignore,
      dir: ignore,
      error: ignore,
      group: ignore,
      groupEnd: ignore,
      info: ignore,
      log: ignore,
      profile: ignore,
      profileEnd: ignore,
      time: ignore,
      timeEnd: ignore,
      trace: ignore,
      warn: ignore
    }
  }
}(self));
;
/* https://github.com/jonathantneal/closest */
(function(w,p){p=w.Element.prototype
if(!p.matches){p.matches=p.msMatchesSelector||function(s){var m=(this.document||this.ownerDocument).querySelectorAll(s);for(var i=0;m[i]&&m[i]!==e;++i);return!!m[i]}}
if(!p.closest){p.closest=function(s){var e=this;while(e&&e.nodeType==1){if(e.matches(s))return e;e=e.parentNode}return null}}})(self);
(function () {
    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
          window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () { callback(currTime + timeToCall); },
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };

    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
}());
;
(function(Global)
{
 "use strict";
 var PrettyTodo,Client,WebSharper,UI,Client$1,Templates,Obj,Doc,JavaScript,Pervasives,SC$1,Operators,EventTarget,Node,JS,Collections,Dictionary,Unchecked,RouteMap,Filter,List,T,ListModel,TodoItem,Var$1,AttrModule,Var,Templating,Runtime,Server,TemplateInstance,Arrays,ProviderBuilder,Handler,View,todo_Templates,SC$2,HashSet,Seq,WindowOrWorkerGlobalScope,Docs,Map,Storage,Numeric,Routing,ConcreteVar,Snap,System,Guid,List$1,AttrProxy,Attrs,Event,UIEvent,Strings,DictionaryUtil,Object,Prepare,Slice,DomUtility,Enumerator,KeyCollection,DocElemNode,CharacterData,An,Settings,Abbrev,Mailbox,FSharpMap,ArrayStorage,Route,Fresh,HtmlModule,attr,Array,TemplateInitializer,Attrs$1,Dyn,Docs$1,RunState,NodeSet,Concurrency,Anims,SC$3,MapUtil,AppendList,DynamicAttrNode,CheckedInput,T$1,BindVar,Elt,SC$4,SC$5,BalancedTree,Tree,Pair,SC$6,SC$7,Updates,HashSetUtil,Scheduler,Easing,AsyncBody,SC$8,CT,HashSet$1,Queue,String,CancellationTokenSource,DomNodes,Char,ValueCollection,Error,OperationCanceledException,Lazy,SC$9,LazyExtensionsProxy,LazyRecord,IntelliFactory,Runtime$1,console,Math,Date;
 PrettyTodo=Global.PrettyTodo=Global.PrettyTodo||{};
 Client=PrettyTodo.Client=PrettyTodo.Client||{};
 WebSharper=Global.WebSharper=Global.WebSharper||{};
 UI=WebSharper.UI=WebSharper.UI||{};
 Client$1=UI.Client=UI.Client||{};
 Templates=Client$1.Templates=Client$1.Templates||{};
 Obj=WebSharper.Obj=WebSharper.Obj||{};
 Doc=UI.Doc=UI.Doc||{};
 JavaScript=WebSharper.JavaScript=WebSharper.JavaScript||{};
 Pervasives=JavaScript.Pervasives=JavaScript.Pervasives||{};
 SC$1=Global.StartupCode$todo$Client=Global.StartupCode$todo$Client||{};
 Operators=WebSharper.Operators=WebSharper.Operators||{};
 EventTarget=Global.EventTarget;
 Node=Global.Node;
 JS=JavaScript.JS=JavaScript.JS||{};
 Collections=WebSharper.Collections=WebSharper.Collections||{};
 Dictionary=Collections.Dictionary=Collections.Dictionary||{};
 Unchecked=WebSharper.Unchecked=WebSharper.Unchecked||{};
 RouteMap=UI.RouteMap=UI.RouteMap||{};
 Filter=Client.Filter=Client.Filter||{};
 List=WebSharper.List=WebSharper.List||{};
 T=List.T=List.T||{};
 ListModel=UI.ListModel=UI.ListModel||{};
 TodoItem=Client.TodoItem=Client.TodoItem||{};
 Var$1=UI.Var$1=UI.Var$1||{};
 AttrModule=UI.AttrModule=UI.AttrModule||{};
 Var=UI.Var=UI.Var||{};
 Templating=UI.Templating=UI.Templating||{};
 Runtime=Templating.Runtime=Templating.Runtime||{};
 Server=Runtime.Server=Runtime.Server||{};
 TemplateInstance=Server.TemplateInstance=Server.TemplateInstance||{};
 Arrays=WebSharper.Arrays=WebSharper.Arrays||{};
 ProviderBuilder=Server.ProviderBuilder=Server.ProviderBuilder||{};
 Handler=Server.Handler=Server.Handler||{};
 View=UI.View=UI.View||{};
 todo_Templates=Global.todo_Templates=Global.todo_Templates||{};
 SC$2=Global.StartupCode$WebSharper_UI$Templates=Global.StartupCode$WebSharper_UI$Templates||{};
 HashSet=Collections.HashSet=Collections.HashSet||{};
 Seq=WebSharper.Seq=WebSharper.Seq||{};
 WindowOrWorkerGlobalScope=Global.WindowOrWorkerGlobalScope;
 Docs=UI.Docs=UI.Docs||{};
 Map=Collections.Map=Collections.Map||{};
 Storage=UI.Storage=UI.Storage||{};
 Numeric=WebSharper.Numeric=WebSharper.Numeric||{};
 Routing=UI.Routing=UI.Routing||{};
 ConcreteVar=UI.ConcreteVar=UI.ConcreteVar||{};
 Snap=UI.Snap=UI.Snap||{};
 System=Global.System=Global.System||{};
 Guid=System.Guid=System.Guid||{};
 List$1=Collections.List=Collections.List||{};
 AttrProxy=UI.AttrProxy=UI.AttrProxy||{};
 Attrs=UI.Attrs=UI.Attrs||{};
 Event=Global.Event;
 UIEvent=Global.UIEvent;
 Strings=WebSharper.Strings=WebSharper.Strings||{};
 DictionaryUtil=Collections.DictionaryUtil=Collections.DictionaryUtil||{};
 Object=Global.Object;
 Prepare=Templates.Prepare=Templates.Prepare||{};
 Slice=WebSharper.Slice=WebSharper.Slice||{};
 DomUtility=UI.DomUtility=UI.DomUtility||{};
 Enumerator=WebSharper.Enumerator=WebSharper.Enumerator||{};
 KeyCollection=Collections.KeyCollection=Collections.KeyCollection||{};
 DocElemNode=UI.DocElemNode=UI.DocElemNode||{};
 CharacterData=Global.CharacterData;
 An=UI.An=UI.An||{};
 Settings=Client$1.Settings=Client$1.Settings||{};
 Abbrev=UI.Abbrev=UI.Abbrev||{};
 Mailbox=Abbrev.Mailbox=Abbrev.Mailbox||{};
 FSharpMap=Collections.FSharpMap=Collections.FSharpMap||{};
 ArrayStorage=Storage.ArrayStorage=Storage.ArrayStorage||{};
 Route=UI.Route=UI.Route||{};
 Fresh=Abbrev.Fresh=Abbrev.Fresh||{};
 HtmlModule=UI.HtmlModule=UI.HtmlModule||{};
 attr=HtmlModule.attr=HtmlModule.attr||{};
 Array=UI.Array=UI.Array||{};
 TemplateInitializer=Server.TemplateInitializer=Server.TemplateInitializer||{};
 Attrs$1=Client$1.Attrs=Client$1.Attrs||{};
 Dyn=Attrs$1.Dyn=Attrs$1.Dyn||{};
 Docs$1=Client$1.Docs=Client$1.Docs||{};
 RunState=Docs$1.RunState=Docs$1.RunState||{};
 NodeSet=Docs$1.NodeSet=Docs$1.NodeSet||{};
 Concurrency=WebSharper.Concurrency=WebSharper.Concurrency||{};
 Anims=UI.Anims=UI.Anims||{};
 SC$3=Global.StartupCode$WebSharper_UI$Doc_Proxy=Global.StartupCode$WebSharper_UI$Doc_Proxy||{};
 MapUtil=Collections.MapUtil=Collections.MapUtil||{};
 AppendList=UI.AppendList=UI.AppendList||{};
 DynamicAttrNode=UI.DynamicAttrNode=UI.DynamicAttrNode||{};
 CheckedInput=UI.CheckedInput=UI.CheckedInput||{};
 T$1=Enumerator.T=Enumerator.T||{};
 BindVar=UI.BindVar=UI.BindVar||{};
 Elt=UI.Elt=UI.Elt||{};
 SC$4=Global.StartupCode$WebSharper_UI$DomUtility=Global.StartupCode$WebSharper_UI$DomUtility||{};
 SC$5=Global.StartupCode$WebSharper_UI$Animation=Global.StartupCode$WebSharper_UI$Animation||{};
 BalancedTree=Collections.BalancedTree=Collections.BalancedTree||{};
 Tree=BalancedTree.Tree=BalancedTree.Tree||{};
 Pair=Collections.Pair=Collections.Pair||{};
 SC$6=Global.StartupCode$WebSharper_UI$Abbrev=Global.StartupCode$WebSharper_UI$Abbrev||{};
 SC$7=Global.StartupCode$WebSharper_UI$Attr_Client=Global.StartupCode$WebSharper_UI$Attr_Client||{};
 Updates=UI.Updates=UI.Updates||{};
 HashSetUtil=Collections.HashSetUtil=Collections.HashSetUtil||{};
 Scheduler=Concurrency.Scheduler=Concurrency.Scheduler||{};
 Easing=UI.Easing=UI.Easing||{};
 AsyncBody=Concurrency.AsyncBody=Concurrency.AsyncBody||{};
 SC$8=Global.StartupCode$WebSharper_Main$Concurrency=Global.StartupCode$WebSharper_Main$Concurrency||{};
 CT=Concurrency.CT=Concurrency.CT||{};
 HashSet$1=Abbrev.HashSet=Abbrev.HashSet||{};
 Queue=WebSharper.Queue=WebSharper.Queue||{};
 String=UI.String=UI.String||{};
 CancellationTokenSource=WebSharper.CancellationTokenSource=WebSharper.CancellationTokenSource||{};
 DomNodes=Docs$1.DomNodes=Docs$1.DomNodes||{};
 Char=WebSharper.Char=WebSharper.Char||{};
 ValueCollection=Collections.ValueCollection=Collections.ValueCollection||{};
 Error=Global.Error;
 OperationCanceledException=WebSharper.OperationCanceledException=WebSharper.OperationCanceledException||{};
 Lazy=WebSharper.Lazy=WebSharper.Lazy||{};
 SC$9=Global.StartupCode$WebSharper_UI$AppendList=Global.StartupCode$WebSharper_UI$AppendList||{};
 LazyExtensionsProxy=WebSharper.LazyExtensionsProxy=WebSharper.LazyExtensionsProxy||{};
 LazyRecord=LazyExtensionsProxy.LazyRecord=LazyExtensionsProxy.LazyRecord||{};
 IntelliFactory=Global.IntelliFactory;
 Runtime$1=IntelliFactory&&IntelliFactory.Runtime;
 console=Global.console;
 Math=Global.Math;
 Date=Global.Date;
 Client.Main=function()
 {
  var tr;
  tr=Client.TodoApp();
  Templates.LoadLocalTemplates("");
  Doc.RunById("main",tr);
 };
 Client.TodoApp=function()
 {
  SC$1.$cctor();
  return SC$1.TodoApp;
 };
 Client.Pages=function()
 {
  SC$1.$cctor();
  return SC$1.Pages;
 };
 Client.notDoneItemsCount=function(model)
 {
  return View.Map(function(xs)
  {
   return Seq.sumBy(function(x)
   {
    return x.IsDone?0:1;
   },xs);
  },model.v);
 };
 Client.RenderList=function(model,filter)
 {
  return Doc.Flatten(model.MapLens(function(i,i$1)
  {
   return Client.RenderTodo(model,filter,i,i$1);
  }));
 };
 Client.ShowIfNotEmpty=function(model,doc)
 {
  return Doc.EmbedView(View.Map(function(mdl)
  {
   return Seq.isEmpty(mdl)?Doc.get_Empty():doc;
  },model.v));
 };
 Client.op_EqualsEqualsGreater=function(a,a$1)
 {
  return AttrProxy.Create(a,a$1);
 };
 Client.ToggleAllDone=function(model)
 {
  var notDone;
  notDone=model.TryFind(function(e)
  {
   return!e.IsDone;
  })!=null;
  model.UpdateAll(function(x)
  {
   return{
    $:1,
    $0:TodoItem.New(x.Id,x.Text,notDone,x.IsEditing)
   };
  });
 };
 Client.RemoveCompleted=function(model)
 {
  model.RemoveBy(function(x)
  {
   return x.IsDone;
  });
 };
 Client.onEnter=function(evt,fn)
 {
  if(evt.keyCode===13||evt.which===13)
   fn();
 };
 Client.mkTodo=function(text)
 {
  return TodoItem.New(Client.fresh(),text,false,false);
 };
 Client.hasAnyDoneItems=function(model)
 {
  function p(x)
  {
   return x.IsDone;
  }
  return View.Map(function(s)
  {
   return Seq.exists(p,s);
  },model.v);
 };
 Client.RenderTodo=function(model,filterView,itemKey,item)
 {
  var titleEditing,inp,itemDisplay,b,_this,C,_this$1,t,t$1,T$2,_this$2,I,_this$3,p,i;
  function endEditing(te)
  {
   if(te==="")
    model.RemoveByKey(itemKey);
   else
    item.Update(function(item$1)
    {
     return TodoItem.New(item$1.Id,te,item$1.IsDone,false);
    });
  }
  function submitFn(evt,initial,te)
  {
   Client.onEnter(evt,function()
   {
    endEditing(te);
   });
   return Client.onEscape(evt,function()
   {
    endEditing(initial);
   });
  }
  function startEditing()
  {
   item.Update(function(x)
   {
    Var$1.Set(titleEditing,x.Text);
    return TodoItem.New(x.Id,x.Text,x.IsDone,true);
   });
  }
  function shouldShow(item$1,filter)
  {
   return filter.$==1?!item$1.IsDone:filter.$==2?item$1.IsDone:true;
  }
  titleEditing=Var$1.Create$1("");
  inp=Doc.Input([AttrProxy.Create("class","edit"),AttrModule.HandlerView("keydown",item.get_View(),Runtime$1.Curried3(function($1,ev,item$1)
  {
   return submitFn(ev,item$1.Text,titleEditing.Get());
  })),AttrModule.HandlerView("blur",item.get_View(),Runtime$1.Curried3(function($1,$2,item$1)
  {
   return endEditing(item$1.Text);
  })),AttrModule.OnAfterRender(function(e)
  {
   e.focus();
  })],titleEditing);
  itemDisplay=(b=(_this=(C=Var$1.Lens(item,function(item$1)
  {
   return item$1.IsDone;
  },function(item$1,x)
  {
   return TodoItem.New(item$1.Id,item$1.Text,x,item$1.IsEditing);
  }),(_this$1=(t=(t$1=(T$2=View.Map(function(item$1)
  {
   return item$1.Text;
  },item.get_View()),(_this$2=(I=View.Map(function(st)
  {
   return Strings.concat(" ",List.ofSeq(Seq.delay(function()
   {
    return Seq.append(st.IsEditing?["editing"]:[],Seq.delay(function()
    {
     return st.IsDone?["completed"]:[];
    }));
   })));
  },item.get_View()),(_this$3=new ProviderBuilder.New$1(),(_this$3.h.push({
   $:2,
   $0:"itemstate",
   $1:I
  }),_this$3))),(_this$2.h.push({
   $:2,
   $0:"title",
   $1:T$2
  }),_this$2))),(t$1.h.push(Handler.EventQ2(t$1.k,"destroy",function()
  {
   return t$1.i;
  },function()
  {
   model.RemoveByKey(itemKey);
  })),t$1)),(t.h.push(Handler.EventQ2(t.k,"edit",function()
  {
   return t.i;
  },function()
  {
   startEditing();
  })),t)),(_this$1.h.push({
   $:9,
   $0:"checked",
   $1:C
  }),_this$1))),(_this.h.push({
   $:0,
   $0:"titleediting",
   $1:inp
  }),_this)),(p=Handler.CompleteHoles(b.k,b.h,[["checked",2]]),(i=new TemplateInstance.New(p[1],todo_Templates.listitem(p[0])),b.i=i,i))).get_Doc();
  return Doc.EmbedView(View.Map2(function(item$1,filter)
  {
   return shouldShow(item$1,filter)?itemDisplay:Doc.get_Empty();
  },item.get_View(),filterView));
 };
 Client.fresh=function()
 {
  var res;
  res=Client.runningId();
  Client.set_runningId(Client.runningId()+1);
  return res;
 };
 Client.onEscape=function(evt,fn)
 {
  if(evt.keyCode===27||evt.which===27)
   fn();
 };
 Client.set_runningId=function($1)
 {
  SC$1.$cctor();
  SC$1.runningId=$1;
 };
 Client.runningId=function()
 {
  SC$1.$cctor();
  return SC$1.runningId;
 };
 Templates.LoadLocalTemplates=function(baseName)
 {
  !Templates.LocalTemplatesLoaded()?(Templates.set_LocalTemplatesLoaded(true),Templates.LoadNestedTemplates(self.document.body,"")):void 0;
  Templates.LoadedTemplates().set_Item(baseName,Templates.LoadedTemplateFile(""));
 };
 Templates.LocalTemplatesLoaded=function()
 {
  SC$2.$cctor();
  return SC$2.LocalTemplatesLoaded;
 };
 Templates.set_LocalTemplatesLoaded=function($1)
 {
  SC$2.$cctor();
  SC$2.LocalTemplatesLoaded=$1;
 };
 Templates.LoadNestedTemplates=function(root,baseName)
 {
  var loadedTpls,rawTpls,wsTemplates,i,$1,node,name,wsChildrenTemplates,i$1,$2,node$1,name$1,instantiated;
  function prepareTemplate(name$2)
  {
   var m,o;
   if(!loadedTpls.ContainsKey(name$2))
    {
     m=(o=null,[rawTpls.TryGetValue(name$2,{
      get:function()
      {
       return o;
      },
      set:function(v)
      {
       o=v;
      }
     }),o]);
     if(m[0])
      {
       instantiated.Add(name$2);
       rawTpls.Remove(name$2);
       Templates.PrepareTemplateStrict(baseName,{
        $:1,
        $0:name$2
       },m[1],{
        $:1,
        $0:prepareTemplate
       });
      }
     else
      console.warn(instantiated.Contains(name$2)?"Encountered loop when instantiating "+name$2:"Local template does not exist: "+name$2);
    }
  }
  loadedTpls=Templates.LoadedTemplateFile(baseName);
  rawTpls=new Dictionary.New$5();
  wsTemplates=root.querySelectorAll("[ws-template]");
  for(i=0,$1=wsTemplates.length-1;i<=$1;i++){
   node=wsTemplates[i];
   name=node.getAttribute("ws-template").toLowerCase();
   node.removeAttribute("ws-template");
   rawTpls.set_Item(name,Templates.FakeRootSingle(node));
  }
  wsChildrenTemplates=root.querySelectorAll("[ws-children-template]");
  for(i$1=0,$2=wsChildrenTemplates.length-1;i$1<=$2;i$1++){
   node$1=wsChildrenTemplates[i$1];
   name$1=node$1.getAttribute("ws-children-template").toLowerCase();
   node$1.removeAttribute("ws-children-template");
   rawTpls.set_Item(name$1,Templates.FakeRoot(node$1));
  }
  instantiated=new HashSet.New$3();
  while(rawTpls.count>0)
   prepareTemplate(Seq.head(rawTpls.get_Keys()));
 };
 Templates.LoadedTemplates=function()
 {
  SC$2.$cctor();
  return SC$2.LoadedTemplates;
 };
 Templates.LoadedTemplateFile=function(name)
 {
  var m,o,d;
  m=(o=null,[Templates.LoadedTemplates().TryGetValue(name,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?m[1]:(d=new Dictionary.New$5(),(Templates.LoadedTemplates().set_Item(name,d),d));
 };
 Templates.FakeRootSingle=function(el)
 {
  var m,m$1,n,fakeroot;
  el.removeAttribute("ws-template");
  m=el.getAttribute("ws-replace");
  if(m===null)
   ;
  else
   {
    el.removeAttribute("ws-replace");
    m$1=el.parentNode;
    Unchecked.Equals(m$1,null)?void 0:(n=self.document.createElement(el.tagName),n.setAttribute("ws-replace",m),m$1.replaceChild(n,el));
   }
  fakeroot=self.document.createElement("div");
  fakeroot.appendChild(el);
  return fakeroot;
 };
 Templates.FakeRoot=function(parent)
 {
  var fakeroot;
  fakeroot=self.document.createElement("div");
  while(parent.hasChildNodes())
   fakeroot.appendChild(parent.firstChild);
  return fakeroot;
 };
 Templates.PrepareTemplateStrict=function(baseName,name,fakeroot,prepareLocalTemplate)
 {
  var name$1;
  function recF(recI,$1)
  {
   var next,m,$2,x,f,name$2,p,instName,instBaseName,d,t,instance,usedHoles,mappings,attrs,i,$3,name$3,m$1,i$1,$4,n,singleTextFill,i$2,$5,n$1;
   function g(v)
   {
   }
   while(true)
    switch(recI)
    {
     case 0:
      if($1!==null)
       {
        next=$1.nextSibling;
        if(Unchecked.Equals($1.nodeType,Node.TEXT_NODE))
         Prepare.convertTextNode($1);
        else
         if(Unchecked.Equals($1.nodeType,Node.ELEMENT_NODE))
          convertElement($1);
        $1=next;
       }
      else
       return null;
      break;
     case 1:
      name$2=Slice.string($1.nodeName,{
       $:1,
       $0:3
      },null).toLowerCase();
      p=(m=name$2.indexOf("."),m===-1?[baseName,name$2]:[Slice.string(name$2,null,{
       $:1,
       $0:m-1
      }),Slice.string(name$2,{
       $:1,
       $0:m+1
      },null)]);
      instName=p[1];
      instBaseName=p[0];
      if(instBaseName!==""&&!Templates.LoadedTemplates().ContainsKey(instBaseName))
       return Prepare.failNotLoaded(instName);
      else
       {
        if(instBaseName===""&&prepareLocalTemplate!=null)
         prepareLocalTemplate.$0(instName);
        d=Templates.LoadedTemplates().get_Item(instBaseName);
        if(!d.ContainsKey(instName))
         return Prepare.failNotLoaded(instName);
        else
         {
          t=d.get_Item(instName);
          instance=t.cloneNode(true);
          usedHoles=new HashSet.New$3();
          mappings=new Dictionary.New$5();
          attrs=$1.attributes;
          for(i=0,$3=attrs.length-1;i<=$3;i++){
           name$3=attrs.item(i).name.toLowerCase();
           mappings.set_Item(name$3,(m$1=attrs.item(i).nodeValue,m$1===""?name$3:m$1.toLowerCase()));
           if(!usedHoles.Add(name$3))
            console.warn("Hole mapped twice",name$3);
          }
          for(i$1=0,$4=$1.childNodes.length-1;i$1<=$4;i$1++){
           n=$1.childNodes[i$1];
           if(Unchecked.Equals(n.nodeType,Node.ELEMENT_NODE))
            !usedHoles.Add(n.nodeName.toLowerCase())?console.warn("Hole filled twice",instName):void 0;
          }
          singleTextFill=$1.childNodes.length===1&&Unchecked.Equals($1.firstChild.nodeType,Node.TEXT_NODE);
          if(singleTextFill)
           {
            x=Prepare.fillTextHole(instance,$1.firstChild.textContent,instName);
            ((function(a)
            {
             return function(o)
             {
              if(o!=null)
               a(o.$0);
             };
            }((f=function(usedHoles$1)
            {
             return function(a)
             {
              return usedHoles$1.Add(a);
             };
            }(usedHoles),function(x$1)
            {
             return g(f(x$1));
            })))(x));
           }
          Prepare.removeHolesExcept(instance,usedHoles);
          if(!singleTextFill)
           {
            for(i$2=0,$5=$1.childNodes.length-1;i$2<=$5;i$2++){
             n$1=$1.childNodes[i$2];
             if(Unchecked.Equals(n$1.nodeType,Node.ELEMENT_NODE))
              n$1.hasAttributes()?Prepare.fillInstanceAttrs(instance,n$1):fillDocHole(instance,n$1);
            }
           }
          Prepare.mapHoles(instance,mappings);
          Prepare.fill(instance,$1.parentNode,$1);
          $1.parentNode.removeChild($1);
          return;
         }
       }
      break;
    }
  }
  function fillDocHole(instance,fillWith)
  {
   var m,name$2,m$1;
   function fillHole(p,n)
   {
    var parsed;
    if(name$2==="title"&&fillWith.hasChildNodes())
     {
      parsed=DomUtility.ParseHTMLIntoFakeRoot(fillWith.textContent);
      fillWith.removeChild(fillWith.firstChild);
      while(parsed.hasChildNodes())
       fillWith.appendChild(parsed.firstChild);
     }
    else
     null;
    convertElement(fillWith);
    return Prepare.fill(fillWith,p,n);
   }
   name$2=fillWith.nodeName.toLowerCase();
   Templates.foreachNotPreserved(instance,"[ws-attr-holes]",function(e)
   {
    var holeAttrs,i,$1,attrName,_this;
    holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
    for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
     attrName=Arrays.get(holeAttrs,i);
     e.setAttribute(attrName,(_this=new Global.RegExp("\\${"+name$2+"}","ig"),e.getAttribute(attrName).replace(_this,fillWith.textContent)));
    }
   });
   m$1=instance.querySelector("[ws-hole="+name$2+"]");
   if(Unchecked.Equals(m$1,null))
    {
     m=instance.querySelector("[ws-replace="+name$2+"]");
     return Unchecked.Equals(m,null)?null:(fillHole(m.parentNode,m),void m.parentNode.removeChild(m));
    }
   else
    {
     while(m$1.hasChildNodes())
      m$1.removeChild(m$1.lastChild);
     m$1.removeAttribute("ws-hole");
     return fillHole(m$1,null);
    }
  }
  function convertElement(el)
  {
   if(!el.hasAttribute("ws-preserve"))
    if(Strings.StartsWith(el.nodeName.toLowerCase(),"ws-"))
     convertInstantiation(el);
    else
     {
      Prepare.convertAttrs(el);
      convertNodeAndSiblings(el.firstChild);
     }
  }
  function convertNodeAndSiblings(n)
  {
   return recF(0,n);
  }
  function convertInstantiation(el)
  {
   return recF(1,el);
  }
  function convertNestedTemplates(el)
  {
   var m,m$1,name$2,name$3;
   while(true)
    {
     m=el.querySelector("[ws-template]");
     if(Unchecked.Equals(m,null))
      {
       m$1=el.querySelector("[ws-children-template]");
       if(Unchecked.Equals(m$1,null))
        return null;
       else
        {
         name$2=m$1.getAttribute("ws-children-template");
         m$1.removeAttribute("ws-children-template");
         Templates.PrepareTemplateStrict(baseName,{
          $:1,
          $0:name$2
         },m$1,null);
         el=el;
        }
      }
     else
      {
       name$3=m.getAttribute("ws-template");
       (Templates.PrepareSingleTemplate(baseName,{
        $:1,
        $0:name$3
       },m))(null);
       el=el;
      }
    }
  }
  name$1=(name==null?"":name.$0).toLowerCase();
  Templates.LoadedTemplateFile(baseName).set_Item(name$1,fakeroot);
  if(fakeroot.hasChildNodes())
   {
    convertNestedTemplates(fakeroot);
    convertNodeAndSiblings(fakeroot.firstChild);
   }
 };
 Templates.foreachNotPreserved=function(root,selector,f)
 {
  DomUtility.IterSelector(root,selector,function(p)
  {
   if(p.closest("[ws-preserve]")==null)
    f(p);
  });
 };
 Templates.PrepareSingleTemplate=function(baseName,name,el)
 {
  var root;
  root=Templates.FakeRootSingle(el);
  return function(p)
  {
   Templates.PrepareTemplateStrict(baseName,name,root,p);
  };
 };
 Templates.GetOrLoadTemplate=function(baseName,name,fakeroot,fillWith)
 {
  Templates.LoadLocalTemplates("");
  Templates.PrepareTemplate(baseName,name,fakeroot);
  return Templates.NamedTemplate(baseName,name,fillWith);
 };
 Templates.PrepareTemplate=function(baseName,name,fakeroot)
 {
  if(!Templates.LoadedTemplateFile(baseName).ContainsKey(name==null?"":name.$0))
   Templates.PrepareTemplateStrict(baseName,name,fakeroot(),null);
 };
 Templates.TextHoleRE=function()
 {
  SC$2.$cctor();
  return SC$2.TextHoleRE;
 };
 Templates.NamedTemplate=function(baseName,name,fillWith)
 {
  var m,o;
  m=(o=null,[Templates.LoadedTemplateFile(baseName).TryGetValue(name==null?"":name.$0,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?Templates.ChildrenTemplate(m[1].cloneNode(true),fillWith):(console.warn("Local template doesn't exist",name),Doc.get_Empty());
 };
 Templates.ChildrenTemplate=function(el,fillWith)
 {
  var p,updates,docTreeNode,m,$1;
  p=Templates.InlineTemplate(el,Seq.append(fillWith,Templates.GlobalHoles().get_Values()));
  updates=p[1];
  docTreeNode=p[0];
  m=docTreeNode.Els;
  return!Unchecked.Equals(m,null)&&m.length===1&&(Arrays.get(m,0)instanceof Node&&(Unchecked.Equals(Arrays.get(m,0).nodeType,Node.ELEMENT_NODE)&&($1=Arrays.get(m,0),true)))?Elt.TreeNode(docTreeNode,updates):Doc.Mk({
   $:6,
   $0:docTreeNode
  },updates);
 };
 Templates.InlineTemplate=function(el,fillWith)
 {
  var els,$1,$2,$3,holes,updates,attrs,afterRender,fw,e,x;
  function addAttr(el$1,attr$1)
  {
   var attr$2,m,f;
   attr$2=Attrs.Insert(el$1,attr$1);
   updates.push(Attrs.Updates(attr$2));
   attrs.push([el$1,attr$2]);
   m=Runtime$1.GetOptional(attr$2.OnAfterRender);
   return m==null?null:(f=m.$0,void afterRender.push(function()
   {
    f(el$1);
   }));
  }
  function tryGetAsDoc(name)
  {
   var m,o;
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   return m[0]?m[1].$==0?{
    $:1,
    $0:m[1].$1
   }:m[1].$==1?{
    $:1,
    $0:Doc.TextNode(m[1].$1)
   }:m[1].$==2?{
    $:1,
    $0:Doc.TextView(m[1].$1)
   }:m[1].$==8?{
    $:1,
    $0:Doc.TextView(m[1].$1.get_View())
   }:m[1].$==9?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:m[1].$==10?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.get_View()))
   }:m[1].$==11?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:m[1].$==12?{
    $:1,
    $0:Doc.TextView(View.Map(function(i)
    {
     return i.get_Input();
    },m[1].$1.get_View()))
   }:m[1].$==13?{
    $:1,
    $0:Doc.TextView(View.Map(Global.String,m[1].$1.get_View()))
   }:(console.warn("Content hole filled with attribute data",name),null):null;
  }
  holes=[];
  updates=[];
  attrs=[];
  afterRender=[];
  fw=new Dictionary.New$5();
  e=Enumerator.Get(fillWith);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     fw.set_Item(x.$0,x);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  els=DomUtility.ChildrenArray(el);
  Templates.foreachNotPreserved(el,"[ws-hole]",function(p)
  {
   var m,doc,name;
   name=p.getAttribute("ws-hole");
   p.removeAttribute("ws-hole");
   while(p.hasChildNodes())
    p.removeChild(p.lastChild);
   m=tryGetAsDoc(name);
   if(m!=null&&m.$==1)
    {
     doc=m.$0;
     Docs.LinkElement(p,doc.docNode);
     holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,null,p,Fresh.Int(),null));
     updates.push(doc.updates);
    }
  });
  Templates.foreachNotPreserved(el,"[ws-replace]",function(e$1)
  {
   var m,doc,p,after,before,o;
   m=tryGetAsDoc(e$1.getAttribute("ws-replace"));
   if(m!=null&&m.$==1)
    {
     doc=m.$0;
     p=e$1.parentNode;
     after=self.document.createTextNode("");
     p.replaceChild(after,e$1);
     before=Docs.InsertBeforeDelim(after,doc.docNode);
     o=Arrays.tryFindIndex(function(y)
     {
      return e$1===y;
     },els);
     o==null?void 0:Arrays.set(els,o.$0,doc.docNode);
     holes.push(DocElemNode.New(Attrs.Empty(p),doc.docNode,{
      $:1,
      $0:[before,after]
     },p,Fresh.Int(),null));
     updates.push(doc.updates);
    }
  });
  Templates.foreachNotPreserved(el,"[ws-attr]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-attr");
   e$1.removeAttribute("ws-attr");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   if(m[0])
    m[1].$==3?addAttr(e$1,m[1].$1):console.warn("Attribute hole filled with non-attribute data",name);
  });
  Templates.foreachNotPreserved(el,"[ws-on]",function(e$1)
  {
   addAttr(e$1,AttrProxy.Concat(Arrays.choose(function(x$1)
   {
    var a,m,o;
    a=Strings.SplitChars(x$1,[":"],1);
    m=(o=null,[fw.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?m[1].$==4?{
     $:1,
     $0:AttrModule.Handler(Arrays.get(a,0),m[1].$1)
    }:m[1].$==5?{
     $:1,
     $0:AttrProxy.Handler(Arrays.get(a,0),m[1].$1)
    }:(console.warn("Event hole on"+Arrays.get(a,0)+" filled with non-event data",Arrays.get(a,1)),null):null;
   },Strings.SplitChars(e$1.getAttribute("ws-on"),[" "],1))));
   e$1.removeAttribute("ws-on");
  });
  Templates.foreachNotPreserved(el,"[ws-onafterrender]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-onafterrender");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   if(m[0])
    m[1].$==6?(e$1.removeAttribute("ws-onafterrender"),addAttr(e$1,AttrModule.OnAfterRender(m[1].$1))):m[1].$==7?(e$1.removeAttribute("ws-onafterrender"),addAttr(e$1,AttrModule.OnAfterRender(m[1].$1))):console.warn("onafterrender hole filled with non-onafterrender data",name);
  });
  Templates.foreachNotPreserved(el,"[ws-var]",function(e$1)
  {
   var name,m,o;
   name=e$1.getAttribute("ws-var");
   e$1.removeAttribute("ws-var");
   m=(o=null,[fw.TryGetValue(name,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   if(m[0])
    m[1].$==8?addAttr(e$1,AttrModule.Value(m[1].$1)):m[1].$==9?addAttr(e$1,AttrModule.Checked(m[1].$1)):m[1].$==10?addAttr(e$1,AttrModule.IntValue(m[1].$1)):m[1].$==11?addAttr(e$1,AttrModule.IntValueUnchecked(m[1].$1)):m[1].$==12?addAttr(e$1,AttrModule.FloatValue(m[1].$1)):m[1].$==13?addAttr(e$1,AttrModule.FloatValueUnchecked(m[1].$1)):console.warn("Var hole filled with non-Var data",name);
  });
  Templates.foreachNotPreserved(el,"[ws-attr-holes]",function(e$1)
  {
   var re,holeAttrs,i,$4;
   re=new Global.RegExp(Templates.TextHoleRE(),"g");
   holeAttrs=Strings.SplitChars(e$1.getAttribute("ws-attr-holes"),[" "],1);
   e$1.removeAttribute("ws-attr-holes");
   for(i=0,$4=holeAttrs.length-1;i<=$4;i++)(function()
   {
    var m,lastIndex,$5,finalText,value,s,s$1,s$2,s$3,attrName,s$4,res,textBefore;
    attrName=Arrays.get(holeAttrs,i);
    s$4=e$1.getAttribute(attrName);
    m=null;
    lastIndex=0;
    res=[];
    while(m=re.exec(s$4),m!==null)
     {
      textBefore=Slice.string(s$4,{
       $:1,
       $0:lastIndex
      },{
       $:1,
       $0:re.lastIndex-Arrays.get(m,0).length-1
      });
      lastIndex=re.lastIndex;
      res.push([textBefore,Arrays.get(m,1)]);
     }
    finalText=Slice.string(s$4,{
     $:1,
     $0:lastIndex
    },null);
    re.lastIndex=0;
    value=Arrays.foldBack(function($6,$7)
    {
     return(function(t)
     {
      var textBefore$1,holeName;
      textBefore$1=t[0];
      holeName=t[1];
      return function(t$1)
      {
       var textAfter,views,holeContent,m$1,o;
       textAfter=t$1[0];
       views=t$1[1];
       holeContent=(m$1=(o=null,[fw.TryGetValue(holeName,{
        get:function()
        {
         return o;
        },
        set:function(v)
        {
         o=v;
        }
       }),o]),m$1[0]?m$1[1].$==1?{
        $:0,
        $0:m$1[1].$1
       }:m$1[1].$==2?{
        $:1,
        $0:m$1[1].$1
       }:m$1[1].$==8?{
        $:1,
        $0:m$1[1].$1.get_View()
       }:m$1[1].$==9?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:m$1[1].$==10?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.get_View())
       }:m$1[1].$==11?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:m$1[1].$==12?{
        $:1,
        $0:View.Map(function(i$1)
        {
         return i$1.get_Input();
        },m$1[1].$1.get_View())
       }:m$1[1].$==13?{
        $:1,
        $0:View.Map(Global.String,m$1[1].$1.get_View())
       }:(console.warn("Attribute value hole filled with non-text data",holeName),{
        $:0,
        $0:""
       }):{
        $:0,
        $0:""
       });
       return holeContent.$==1?[textBefore$1,new T({
        $:1,
        $0:textAfter===""?holeContent.$0:View.Map(function(s$5)
        {
         return s$5+textAfter;
        },holeContent.$0),
        $1:views
       })]:[textBefore$1+holeContent.$0+textAfter,views];
      };
     }($6))($7);
    },res,[finalText,T.Empty]);
    return addAttr(e$1,value[1].$==1?value[1].$1.$==1?value[1].$1.$1.$==1?value[1].$1.$1.$1.$==0?(s=value[0],AttrModule.Dynamic(attrName,View.Map3(function(v1,v2,v3)
    {
     return s+v1+v2+v3;
    },value[1].$0,value[1].$1.$0,value[1].$1.$1.$0))):(s$1=value[0],AttrModule.Dynamic(attrName,View.Map(function(vs)
    {
     return s$1+Strings.concat("",vs);
    },View.Sequence(value[1])))):(s$2=value[0],AttrModule.Dynamic(attrName,View.Map2(function(v1,v2)
    {
     return s$2+v1+v2;
    },value[1].$0,value[1].$1.$0))):value[0]===""?AttrModule.Dynamic(attrName,value[1].$0):(s$3=value[0],AttrModule.Dynamic(attrName,View.Map(function(v)
    {
     return s$3+v;
    },value[1].$0))):AttrProxy.Create(attrName,value[0]));
   }());
  });
  return[Runtime$1.DeleteEmptyFields({
   Els:els,
   Dirty:true,
   Holes:holes,
   Attrs:attrs,
   Render:($1=afterRender.length==0?null:{
    $:1,
    $0:function(el$1)
    {
     Arrays.iter(function(f)
     {
      f(el$1);
     },afterRender);
    }
   },$1?$1.$0:void 0),
   El:($2=!Unchecked.Equals(els,null)&&els.length===1&&(Arrays.get(els,0)instanceof Node&&(Arrays.get(els,0)instanceof Global.Element&&($3=Arrays.get(els,0),true)))?{
    $:1,
    $0:$3
   }:null,$2?$2.$0:void 0)
  },["Render","El"]),Array.TreeReduce(View.Const(),View.Map2Unit,updates)];
 };
 Templates.GlobalHoles=function()
 {
  SC$2.$cctor();
  return SC$2.GlobalHoles;
 };
 Obj=WebSharper.Obj=Runtime$1.Class({
  Equals:function(obj)
  {
   return this===obj;
  },
  GetHashCode:function()
  {
   return -1;
  }
 },null,Obj);
 Obj.New=Runtime$1.Ctor(function()
 {
 },Obj);
 Doc=UI.Doc=Runtime$1.Class({},Obj,Doc);
 Doc.RunById=function(id,tr)
 {
  var m;
  m=self.document.getElementById(id);
  if(Unchecked.Equals(m,null))
   Operators.FailWith("invalid id: "+id);
  else
   Doc.Run(m,tr);
 };
 Doc.Run=function(parent,doc)
 {
  Docs.LinkElement(parent,doc.docNode);
  Doc.RunInPlace(false,parent,doc);
 };
 Doc.get_Empty=function()
 {
  return Doc.Mk(null,View.Const());
 };
 Doc.RunInPlace=function(childrenOnly,parent,doc)
 {
  var st;
  st=Docs.CreateRunState(parent,doc.docNode);
  View.Sink(An.get_UseAnimations()||Settings.BatchUpdatesEnabled()?Mailbox.StartProcessor(Docs.PerformAnimatedUpdate(childrenOnly,st,doc.docNode)):function()
  {
   Docs.PerformSyncUpdate(childrenOnly,st,doc.docNode);
  },doc.updates);
 };
 Doc.CheckBox=function(attrs,chk)
 {
  return Doc.InputInternal("input",function()
  {
   return Seq.append(attrs,[AttrProxy.Create("type","checkbox"),AttrModule.Checked(chk)]);
  });
 };
 Doc.EmbedView=function(view)
 {
  var node;
  node=Docs.CreateEmbedNode();
  return Doc.Mk({
   $:2,
   $0:node
  },View.Map(Global.ignore,View.Bind(function(doc)
  {
   Docs.UpdateEmbedNode(node,doc.docNode);
   return doc.updates;
  },view)));
 };
 Doc.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Doc.get_Empty(),Doc.Append,x);
 };
 Doc.Link=function(caption,attrs,action)
 {
  var attrs$1,x;
  attrs$1=(x=AttrProxy.Concat(attrs),AttrProxy.Append(AttrProxy.Create("href","#"),x));
  return Elt.New(Doc.Clickable("a",action),attrs$1,Doc.TextNode(caption));
 };
 Doc.Button=function(caption,attrs,action)
 {
  var attrs$1;
  attrs$1=AttrProxy.Concat(attrs);
  return Elt.New(Doc.Clickable("button",action),attrs$1,Doc.TextNode(caption));
 };
 Doc.Mk=function(node,updates)
 {
  return new Doc.New(node,updates);
 };
 Doc.Flatten=function(view)
 {
  return Doc.EmbedView(View.Map(Doc.Concat,view));
 };
 Doc.InputInternal=function(elemTy,attr$1)
 {
  var el;
  el=self.document.createElement(elemTy);
  return Elt.New(el,AttrProxy.Concat(attr$1(el)),Doc.get_Empty());
 };
 Doc.Append=function(a,b)
 {
  return Doc.Mk({
   $:0,
   $0:a.docNode,
   $1:b.docNode
  },View.Map2Unit(a.updates,b.updates));
 };
 Doc.Element=function(name,attr$1,children)
 {
  var a,a$1;
  a=AttrProxy.Concat(attr$1);
  a$1=Doc.Concat(children);
  return Elt.New(self.document.createElement(name),a,a$1);
 };
 Doc.TextNode=function(v)
 {
  return Doc.Mk({
   $:5,
   $0:self.document.createTextNode(v)
  },View.Const());
 };
 Doc.Clickable=function(elem,action)
 {
  var el;
  el=self.document.createElement(elem);
  el.addEventListener("click",function(ev)
  {
   ev.preventDefault();
   return action();
  },false);
  return el;
 };
 Doc.Input=function(attr$1,_var)
 {
  return Doc.InputInternal("input",function()
  {
   return Seq.append(attr$1,[AttrModule.Value(_var)]);
  });
 };
 Doc.TextView=function(txt)
 {
  var node;
  node=Docs.CreateTextNode();
  return Doc.Mk({
   $:4,
   $0:node
  },View.Map(function(t)
  {
   Docs.UpdateTextNode(node,t);
  },txt));
 };
 Doc.New=Runtime$1.Ctor(function(docNode,updates)
 {
  Obj.New.call(this);
  this.docNode=docNode;
  this.updates=updates;
 },Doc);
 Pervasives.NewFromSeq=function(fields)
 {
  var r,e,f;
  r={};
  e=Enumerator.Get(fields);
  try
  {
   while(e.MoveNext())
    {
     f=e.Current();
     r[f[0]]=f[1];
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return r;
 };
 SC$1.$cctor=function()
 {
  var model,filterVar,todoVar,allDoneVar,notDone,allDone,b,F,b$1,C,_this,F$1,_this$1,R,_this$2,R$1,_this$3,p,i,_this$4,T$2,_this$5,t,T$3,_this$6,_this$7,p$1,i$1;
  SC$1.$cctor=Global.ignore;
  function submitFn(evt)
  {
   Client.onEnter(evt,function()
   {
    var text;
    text=Strings.Trim(todoVar.Get());
    if(text!=="")
     {
      model.Append(Client.mkTodo(text));
      Var$1.Set(todoVar,"");
     }
   });
  }
  function selected(e)
  {
   return AttrModule.DynamicClass("selected",filterVar.get_View(),function(y)
   {
    return Unchecked.Equals(e,y);
   });
  }
  SC$1.Pages=RouteMap.Create(function(a)
  {
   return a.$==1?List.ofArray(["active"]):a.$==2?List.ofArray(["completed"]):T.Empty;
  },function(a)
  {
   var $1;
   switch(a.$==1?a.$0==="active"?a.$1.$==0?0:2:a.$0==="completed"?a.$1.$==0?1:2:2:2)
   {
    case 0:
     return Filter.Active;
    case 1:
     return Filter.Completed;
    case 2:
     return Filter.All;
   }
  });
  SC$1.runningId=0;
  SC$1.TodoApp=(model=ListModel.Create(function(todo)
  {
   return todo.Id;
  },T.Empty),(filterVar=RouteMap.Install(Client.Pages()),(todoVar=Var$1.Create$1(""),(allDoneVar=Var$1.Create$1(false),(notDone=Client.notDoneItemsCount(model),(allDone=View.Map(function(c)
  {
   return c===0;
  },notDone),(b=(F=Client.ShowIfNotEmpty(model,(b$1=(C=Doc.EmbedView(View.Map(function(s)
  {
   return s?Doc.Button("Clear Completed",[Client.op_EqualsEqualsGreater("class","clear-completed")],function()
   {
    Client.RemoveCompleted(model);
   }):Doc.get_Empty();
  },Client.hasAnyDoneItems(model))),(_this=(F$1=List.ofArray([Doc.Element("li",[],[Doc.Link("All",[selected(Filter.All)],function()
  {
   Var$1.Set(filterVar,Filter.All);
  })]),Doc.Element("li",[],[Doc.Link("Active",[selected(Filter.Active)],function()
  {
   Var$1.Set(filterVar,Filter.Active);
  })]),Doc.Element("li",[],[Doc.Link("Completed",[selected(Filter.Completed)],function()
  {
   Var$1.Set(filterVar,Filter.Completed);
  })])]),(_this$1=(R=View.Map(function(n)
  {
   return n===1?"item":"items";
  },notDone),(_this$2=(R$1=View.Map(Global.String,notDone),(_this$3=new ProviderBuilder.New$1(),(_this$3.h.push({
   $:2,
   $0:"remaining",
   $1:R$1
  }),_this$3))),(_this$2.h.push({
   $:2,
   $0:"remaininglabel",
   $1:R
  }),_this$2))),(_this$1.h.push({
   $:0,
   $0:"filters",
   $1:Doc.Concat(F$1)
  }),_this$1))),(_this.h.push({
   $:0,
   $0:"clearcompleted",
   $1:C
  }),_this))),(p=Handler.CompleteHoles(b$1.k,b$1.h,[]),(i=new TemplateInstance.New(p[1],todo_Templates.footertemplate(p[0])),b$1.i=i,i))).get_Doc()),(_this$4=(T$2=Client.ShowIfNotEmpty(model,Doc.EmbedView(View.Map(function()
  {
   return Doc.CheckBox([Client.op_EqualsEqualsGreater("class","toggle-all"),Client.op_EqualsEqualsGreater("type","checkbox"),AttrModule.Handler("click",function()
   {
    return function()
    {
     return Client.ToggleAllDone(model);
    };
   })],allDoneVar);
  },allDone))),(_this$5=(t=(T$3=Client.RenderList(model,filterVar.get_View()),(_this$6=(_this$7=new ProviderBuilder.New$1(),(_this$7.h.push({
   $:8,
   $0:"newtask",
   $1:todoVar
  }),_this$7)),(_this$6.h.push({
   $:0,
   $0:"todolist",
   $1:T$3
  }),_this$6))),(t.h.push(Handler.EventQ2(t.k,"add",function()
  {
   return t.i;
  },function(e)
  {
   submitFn(e.Event);
  })),t)),(_this$5.h.push({
   $:0,
   $0:"toggleall",
   $1:T$2
  }),_this$5))),(_this$4.h.push({
   $:0,
   $0:"footer",
   $1:F
  }),_this$4))),(p$1=Handler.CompleteHoles(b.k,b.h,[["newtask",0]]),(i$1=new TemplateInstance.New(p$1[1],todo_Templates.t(p$1[0])),b.i=i$1,i$1))).get_Doc()))))));
 };
 Operators.FailWith=function(msg)
 {
  throw new Error(msg);
 };
 Operators.KeyValue=function(kvp)
 {
  return[kvp.K,kvp.V];
 };
 JS.GetFieldValues=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push(o[k$1]);
  return r;
 };
 Dictionary=Collections.Dictionary=Runtime$1.Class({
  set_Item:function(k,v)
  {
   this.set(k,v);
  },
  ContainsKey:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:Arrays.exists(function(a)
   {
    return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d);
  },
  TryGetValue:function(k,res)
  {
   var $this,d,v;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?false:(v=Arrays.tryPick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d),v!=null&&v.$==1&&(res.set(v.$0),true));
  },
  Remove:function(k)
  {
   return this.remove(k);
  },
  get_Keys:function()
  {
   return new KeyCollection.New(this);
  },
  set:function(k,v)
  {
   var $this,h,d,m;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   if(d==null)
    {
     this.count=this.count+1;
     this.data[h]=new Global.Array({
      K:k,
      V:v
     });
    }
   else
    {
     m=Arrays.tryFindIndex(function(a)
     {
      return $this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
     },d);
     m==null?(this.count=this.count+1,d.push({
      K:k,
      V:v
     })):d[m.$0]={
      K:k,
      V:v
     };
    }
  },
  remove:function(k)
  {
   var $this,h,d,r;
   $this=this;
   h=this.hash(k);
   d=this.data[h];
   return d==null?false:(r=Arrays.filter(function(a)
   {
    return!$this.equals.apply(null,[(Operators.KeyValue(a))[0],k]);
   },d),Arrays.length(r)<d.length&&(this.count=this.count-1,this.data[h]=r,true));
  },
  get_Item:function(k)
  {
   return this.get(k);
  },
  get:function(k)
  {
   var $this,d;
   $this=this;
   d=this.data[this.hash(k)];
   return d==null?DictionaryUtil.notPresent():Arrays.pick(function(a)
   {
    var a$1;
    a$1=Operators.KeyValue(a);
    return $this.equals.apply(null,[a$1[0],k])?{
     $:1,
     $0:a$1[1]
    }:null;
   },d);
  },
  Clear:function()
  {
   this.data=[];
   this.count=0;
  },
  get_Values:function()
  {
   return new ValueCollection.New(this);
  },
  GetEnumerator:function()
  {
   return Enumerator.Get0(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(Arrays.concat(JS.GetFieldValues(this.data)));
  }
 },Obj,Dictionary);
 Dictionary.New$5=Runtime$1.Ctor(function()
 {
  Dictionary.New$6.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },Dictionary);
 Dictionary.New$6=Runtime$1.Ctor(function(init,equals,hash)
 {
  var e,x;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.count=0;
  this.data=[];
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    {
     x=e.Current();
     this.set(x.K,x.V);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },Dictionary);
 Unchecked.Equals=function(a,b)
 {
  var m,eqR,k,k$1;
  if(a===b)
   return true;
  else
   {
    m=typeof a;
    if(m=="object")
    {
     if(a===null||a===void 0||b===null||b===void 0)
      return false;
     else
      if("Equals"in a)
       return a.Equals(b);
      else
       if(a instanceof Global.Array&&b instanceof Global.Array)
        return Unchecked.arrayEquals(a,b);
       else
        if(a instanceof Global.Date&&b instanceof Global.Date)
         return Unchecked.dateEquals(a,b);
        else
         {
          eqR=[true];
          for(var k$2 in a)if(function(k$3)
          {
           eqR[0]=!a.hasOwnProperty(k$3)||b.hasOwnProperty(k$3)&&Unchecked.Equals(a[k$3],b[k$3]);
           return!eqR[0];
          }(k$2))
           break;
          if(eqR[0])
           {
            for(var k$3 in b)if(function(k$4)
            {
             eqR[0]=!b.hasOwnProperty(k$4)||a.hasOwnProperty(k$4);
             return!eqR[0];
            }(k$3))
             break;
           }
          return eqR[0];
         }
    }
    else
     return m=="function"&&("$Func"in a?a.$Func===b.$Func&&a.$Target===b.$Target:"$Invokes"in a&&"$Invokes"in b&&Unchecked.arrayEquals(a.$Invokes,b.$Invokes));
   }
 };
 Unchecked.arrayEquals=function(a,b)
 {
  var eq,i;
  if(Arrays.length(a)===Arrays.length(b))
   {
    eq=true;
    i=0;
    while(eq&&i<Arrays.length(a))
     {
      !Unchecked.Equals(Arrays.get(a,i),Arrays.get(b,i))?eq=false:void 0;
      i=i+1;
     }
    return eq;
   }
  else
   return false;
 };
 Unchecked.dateEquals=function(a,b)
 {
  return a.getTime()===b.getTime();
 };
 Unchecked.Hash=function(o)
 {
  var m;
  m=typeof o;
  return m=="function"?0:m=="boolean"?o?1:0:m=="number"?o:m=="string"?Unchecked.hashString(o):m=="object"?o==null?0:o instanceof Global.Array?Unchecked.hashArray(o):Unchecked.hashObject(o):0;
 };
 Unchecked.hashString=function(s)
 {
  var hash,i,$1;
  if(s===null)
   return 0;
  else
   {
    hash=5381;
    for(i=0,$1=s.length-1;i<=$1;i++)hash=Unchecked.hashMix(hash,s[i].charCodeAt());
    return hash;
   }
 };
 Unchecked.hashArray=function(o)
 {
  var h,i,$1;
  h=-34948909;
  for(i=0,$1=Arrays.length(o)-1;i<=$1;i++)h=Unchecked.hashMix(h,Unchecked.Hash(Arrays.get(o,i)));
  return h;
 };
 Unchecked.hashObject=function(o)
 {
  var h,k;
  if("GetHashCode"in o)
   return o.GetHashCode();
  else
   {
    h=[0];
    for(var k$1 in o)if(function(key)
    {
     h[0]=Unchecked.hashMix(Unchecked.hashMix(h[0],Unchecked.hashString(key)),Unchecked.Hash(o[key]));
     return false;
    }(k$1))
     break;
    return h[0];
   }
 };
 Unchecked.hashMix=function(x,y)
 {
  return(x<<5)+x+y;
 };
 Unchecked.Compare=function(a,b)
 {
  var $1,m,$2,cmp,k,k$1;
  if(a===b)
   return 0;
  else
   {
    m=typeof a;
    switch(m=="function"?1:m=="boolean"?2:m=="number"?2:m=="string"?2:m=="object"?3:0)
    {
     case 0:
      return typeof b=="undefined"?0:-1;
     case 1:
      return Operators.FailWith("Cannot compare function values.");
     case 2:
      return a<b?-1:1;
     case 3:
      if(a===null)
       $2=-1;
      else
       if(b===null)
        $2=1;
       else
        if("CompareTo"in a)
         $2=a.CompareTo(b);
        else
         if("CompareTo0"in a)
          $2=a.CompareTo0(b);
         else
          if(a instanceof Global.Array&&b instanceof Global.Array)
           $2=Unchecked.compareArrays(a,b);
          else
           if(a instanceof Global.Date&&b instanceof Global.Date)
            $2=Unchecked.compareDates(a,b);
           else
            {
             cmp=[0];
             for(var k$2 in a)if(function(k$3)
             {
              return!a.hasOwnProperty(k$3)?false:!b.hasOwnProperty(k$3)?(cmp[0]=1,true):(cmp[0]=Unchecked.Compare(a[k$3],b[k$3]),cmp[0]!==0);
             }(k$2))
              break;
             if(cmp[0]===0)
              {
               for(var k$3 in b)if(function(k$4)
               {
                return!b.hasOwnProperty(k$4)?false:!a.hasOwnProperty(k$4)&&(cmp[0]=-1,true);
               }(k$3))
                break;
              }
             $2=cmp[0];
            }
      return $2;
    }
   }
 };
 Unchecked.compareArrays=function(a,b)
 {
  var cmp,i;
  if(Arrays.length(a)<Arrays.length(b))
   return -1;
  else
   if(Arrays.length(a)>Arrays.length(b))
    return 1;
   else
    {
     cmp=0;
     i=0;
     while(cmp===0&&i<Arrays.length(a))
      {
       cmp=Unchecked.Compare(Arrays.get(a,i),Arrays.get(b,i));
       i=i+1;
      }
     return cmp;
    }
 };
 Unchecked.compareDates=function(a,b)
 {
  return Unchecked.Compare(a.getTime(),b.getTime());
 };
 RouteMap.Create=function(ser,des)
 {
  function f(t)
  {
   return t[0];
  }
  return{
   Des:function(x)
   {
    return des(f(x));
   },
   Ser:function(x)
   {
    return[ser(x),new FSharpMap.New([])];
   }
  };
 };
 RouteMap.Install=function(map)
 {
  return Routing.InstallMap(map);
 };
 Filter.Active={
  $:1
 };
 Filter.Completed={
  $:2
 };
 Filter.All={
  $:0
 };
 List.ofArray=function(arr)
 {
  var r,i,$1;
  r=T.Empty;
  for(i=Arrays.length(arr)-1,$1=0;i>=$1;i--)r=new T({
   $:1,
   $0:Arrays.get(arr,i),
   $1:r
  });
  return r;
 };
 List.ofSeq=function(s)
 {
  var e,$1,go,r,res,t;
  if(s instanceof T)
   return s;
  else
   if(s instanceof Global.Array)
    return List.ofArray(s);
   else
    {
     e=Enumerator.Get(s);
     try
     {
      go=e.MoveNext();
      if(!go)
       $1=T.Empty;
      else
       {
        res=new T({
         $:1
        });
        r=res;
        while(go)
         {
          r.$0=e.Current();
          if(e.MoveNext())
           r=(t=new T({
            $:1
           }),r.$1=t,t);
          else
           go=false;
         }
        r.$1=T.Empty;
        $1=res;
       }
      return $1;
     }
     finally
     {
      if(typeof e=="object"&&"Dispose"in e)
       e.Dispose();
     }
    }
 };
 List.head=function(l)
 {
  return l.$==1?l.$0:List.listEmpty();
 };
 List.tail=function(l)
 {
  return l.$==1?l.$1:List.listEmpty();
 };
 List.listEmpty=function()
 {
  return Operators.FailWith("The input list was empty.");
 };
 T=List.T=Runtime$1.Class({
  GetEnumerator:function()
  {
   return new T$1.New(this,null,function(e)
   {
    var m;
    m=e.s;
    return m.$==0?false:(e.c=m.$0,e.s=m.$1,true);
   },void 0);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(this);
  }
 },null,T);
 T.Empty=new T({
  $:0
 });
 ListModel.Create=function(key,init)
 {
  return ListModel.CreateWithStorage(key,Storage.InMemory(Arrays.ofSeq(init)));
 };
 ListModel.CreateWithStorage=function(key,storage)
 {
  return new ListModel.New(key,storage);
 };
 TodoItem.New=function(Id,Text,IsDone,IsEditing)
 {
  return{
   Id:Id,
   Text:Text,
   IsDone:IsDone,
   IsEditing:IsEditing
  };
 };
 Var$1=UI.Var$1=Runtime$1.Class({},Obj,Var$1);
 Var$1.Create$1=function(v)
 {
  return new ConcreteVar.New(false,Snap.New({
   $:2,
   $0:v,
   $1:[]
  }),v);
 };
 Var$1.Set=function(_var,value)
 {
  _var.Set(value);
 };
 Var$1.Lens=function(_var,get,update)
 {
  var id,view,$1;
  id=Fresh.Id();
  view=View.Map(get,_var.get_View());
  $1=new Var({
   Get:function()
   {
    return get(_var.Get());
   },
   Set:function(v)
   {
    return _var.Update(function(t)
    {
     return update(t,v);
    });
   },
   SetFinal:function(v)
   {
    return this.Set(v);
   },
   Update:function(f)
   {
    return _var.Update(function(t)
    {
     return update(t,f(get(t)));
    });
   },
   UpdateMaybe:function(f)
   {
    return _var.UpdateMaybe(function(t)
    {
     var x;
     x=f(get(t));
     return x==null?null:{
      $:1,
      $0:update(t,x.$0)
     };
    });
   },
   get_View:function()
   {
    return view;
   },
   get_Id:function()
   {
    return id;
   }
  });
  Var.New.call($1);
  return $1;
 };
 AttrModule.DynamicClass=function(name,view,ok)
 {
  return AttrModule.DynamicClassPred(name,View.Map(ok,view));
 };
 AttrModule.Handler=function(name,callback)
 {
  return Attrs.Static(function(el)
  {
   el.addEventListener(name,function(d)
   {
    return(callback(el))(d);
   },false);
  });
 };
 AttrModule.DynamicClassPred=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    return v?DomUtility.AddClass(el,name):DomUtility.RemoveClass(el,name);
   };
  });
 };
 AttrModule.Checked=function(_var)
 {
  var t;
  t=(((BindVar.BoolCheckedApply())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.HandlerView=function(name,view,callback)
 {
  return Attrs.Static(function(el)
  {
   var callback$1;
   callback$1=callback(el);
   el.addEventListener(name,function(ev)
   {
    return View.Get(callback$1(ev),view);
   },false);
  });
 };
 AttrModule.OnAfterRender=function(callback)
 {
  return new AttrProxy({
   $:4,
   $0:callback
  });
 };
 AttrModule.DynamicCustom=function(set,view)
 {
  return Attrs.Dynamic(view,set);
 };
 AttrModule.Value=function(_var)
 {
  var t;
  t=(((BindVar.StringApply())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.IntValue=function(_var)
 {
  var t;
  t=(((BindVar.IntApplyChecked())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.IntValueUnchecked=function(_var)
 {
  var t;
  t=(((BindVar.IntApplyUnchecked())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.FloatValue=function(_var)
 {
  var t;
  t=(((BindVar.FloatApplyChecked())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.FloatValueUnchecked=function(_var)
 {
  var t;
  t=(((BindVar.FloatApplyUnchecked())(_var))(Attrs.Static))(function(f)
  {
   return AttrModule.DynamicCustom(f,_var.get_View());
  });
  return AttrProxy.Append(t[0],t[1]);
 };
 AttrModule.Dynamic=function(name,view)
 {
  return Attrs.Dynamic(view,function(el)
  {
   return function(v)
   {
    return el.setAttribute(name,v);
   };
  });
 };
 Var=UI.Var=Runtime$1.Class({},Obj,Var);
 Var.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
 },Var);
 TemplateInstance=Server.TemplateInstance=Runtime$1.Class({
  get_Doc:function()
  {
   return this.doc;
  }
 },Obj,TemplateInstance);
 TemplateInstance.New=Runtime$1.Ctor(function(c,doc)
 {
  Obj.New.call(this);
  this.doc=doc;
  this.allVars=c.$==0?c.$0:Operators.FailWith("Should not happen");
 },TemplateInstance);
 Arrays.get=function(arr,n)
 {
  Arrays.checkBounds(arr,n);
  return arr[n];
 };
 Arrays.length=function(arr)
 {
  return arr.dims===2?arr.length*arr.length:arr.length;
 };
 Arrays.checkBounds=function(arr,n)
 {
  if(n<0||n>=arr.length)
   Operators.FailWith("Index was outside the bounds of the array.");
 };
 Arrays.set=function(arr,n,x)
 {
  Arrays.checkBounds(arr,n);
  arr[n]=x;
 };
 ProviderBuilder=Server.ProviderBuilder=Runtime$1.Class({},Obj,ProviderBuilder);
 ProviderBuilder.New$1=Runtime$1.Ctor(function()
 {
  var c;
  Obj.New.call(this);
  this.i=null;
  this.k=(c=Guid.NewGuid(),Global.String(c));
  this.h=[];
  Runtime$1.SetOptional(this,"s",null);
 },ProviderBuilder);
 Handler.EventQ2=function(key,holeName,ti,f)
 {
  return{
   $:5,
   $0:holeName,
   $1:function(el)
   {
    return function(ev)
    {
     return f({
      Vars:ti(),
      Target:el,
      Event:ev
     });
    };
   }
  };
 };
 Handler.CompleteHoles=function(key,filledHoles,vars)
 {
  var allVars,filledVars,e,h,n;
  function c(name,ty)
  {
   var r;
   return filledVars.Contains(name)?null:(r=ty===0?TemplateInitializer.GetOrAddHoleFor(key,name,function()
   {
    return{
     $:8,
     $0:name,
     $1:Var$1.Create$1("")
    };
   }):ty===1?TemplateInitializer.GetOrAddHoleFor(key,name,function()
   {
    return{
     $:13,
     $0:name,
     $1:Var$1.Create$1(0)
    };
   }):ty===2?TemplateInitializer.GetOrAddHoleFor(key,name,function()
   {
    return{
     $:9,
     $0:name,
     $1:Var$1.Create$1(false)
    };
   }):Operators.FailWith("Invalid value type"),(allVars.set_Item(name,r),{
    $:1,
    $0:r
   }));
  }
  allVars=new Dictionary.New$5();
  filledVars=new HashSet.New$3();
  e=Enumerator.Get(filledHoles);
  try
  {
   while(e.MoveNext())
    {
     h=e.Current();
     n=h.$0;
     filledVars.Add(n);
     allVars.set_Item(n,h);
    }
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
  return[Seq.append(filledHoles,Arrays.choose(function($1)
  {
   return c($1[0],$1[1]);
  },vars)),{
   $:0,
   $0:allVars
  }];
 };
 View.Map=function(fn,a)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map(fn,a());
  });
 };
 View.CreateLazy=function(observe)
 {
  var lv;
  lv={
   c:null,
   o:observe
  };
  return function()
  {
   var c,$1;
   c=lv.c;
   return c===null?(c=lv.o(),lv.c=c,($1=c.s,$1!=null&&$1.$==0)?lv.o=null:Snap.WhenObsoleteRun(c,function()
   {
    lv.c=null;
   }),c):c;
  };
 };
 View.Const=function(x)
 {
  var o;
  o=Snap.New({
   $:0,
   $0:x
  });
  return function()
  {
   return o;
  };
 };
 View.Sink=function(act,a)
 {
  function loop()
  {
   Snap.WhenRun(a(),act,function()
   {
    Concurrency.scheduler().Fork(loop);
   });
  }
  Concurrency.scheduler().Fork(loop);
 };
 View.Map2=function(fn,a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2(fn,a(),a$1());
  });
 };
 View.Bind=function(fn,view)
 {
  return View.Join(View.Map(fn,view));
 };
 View.Join=function(a)
 {
  return View.CreateLazy(function()
  {
   return Snap.Join(a());
  });
 };
 View.Map2Unit=function(a,a$1)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map2Unit(a(),a$1());
  });
 };
 View.MapSeqCachedViewBy=function(key,conv,view)
 {
  var state;
  state=[new Dictionary.New$5()];
  return View.Map(function(xs)
  {
   var prevState,newState,result;
   prevState=state[0];
   newState=new Dictionary.New$5();
   result=Array.mapInPlace(function(x)
   {
    var k,node,n;
    k=key(x);
    node=prevState.ContainsKey(k)?(n=prevState.get_Item(k),(Var$1.Set(n.r,x),n)):View.ConvertSeqNode(function(v)
    {
     return conv(k,v);
    },x);
    newState.set_Item(k,node);
    return node.e;
   },Arrays.ofSeq(xs));
   state[0]=newState;
   return result;
  },view);
 };
 View.Get=function(f,a)
 {
  var ok;
  function obs()
  {
   Snap.WhenRun(a(),function(v)
   {
    if(!ok[0])
     {
      ok[0]=true;
      f(v);
     }
   },function()
   {
    if(!ok[0])
     obs();
   });
  }
  ok=[false];
  obs();
 };
 View.ConvertSeqNode=function(conv,value)
 {
  var _var,view;
  _var=Var$1.Create$1(value);
  view=_var.get_View();
  return{
   e:conv(view),
   r:_var,
   w:view
  };
 };
 View.Map3=function(fn,a,a$1,a$2)
 {
  return View.CreateLazy(function()
  {
   return Snap.Map3(fn,a(),a$1(),a$2());
  });
 };
 View.Sequence=function(views)
 {
  return View.CreateLazy(function()
  {
   return Snap.Sequence(Seq.map(function(a)
   {
    return a();
   },views));
  });
 };
 todo_Templates.footertemplate=function(h)
 {
  return h?Templates.GetOrLoadTemplate("todoapp",{
   $:1,
   $0:"footertemplate"
  },function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<footer class=\"footer\">\r\n            <span class=\"todo-count\">\r\n                <strong>${Remaining}</strong>\r\n                ${RemainingLabel} left\r\n            </span>\r\n            <ul class=\"filters\" ws-hole=\"Filters\"></ul>\r\n            <span ws-replace=\"ClearCompleted\"></span>\r\n        </footer>");
  },h):Templates.PrepareTemplate("todoapp",{
   $:1,
   $0:"footertemplate"
  },function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<footer class=\"footer\">\r\n            <span class=\"todo-count\">\r\n                <strong>${Remaining}</strong>\r\n                ${RemainingLabel} left\r\n            </span>\r\n            <ul class=\"filters\" ws-hole=\"Filters\"></ul>\r\n            <span ws-replace=\"ClearCompleted\"></span>\r\n        </footer>");
  });
 };
 todo_Templates.t=function(h)
 {
  return h?Templates.GetOrLoadTemplate("todoapp",null,function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<section class=\"todoapp\" ws-chidlren-template=\"TodoApp\">\r\n    <header class=\"header\">\r\n        <h1>todos</h1>\r\n        <input class=\"new-todo\" ws-var=\"NewTask\" ws-onkeyup=\"Add\" placeholder=\"What needs to be done?\" autofocus=\"\">\r\n    </header>\r\n    <section class=\"main\">\r\n        <span ws-replace=\"ToggleAll\"></span>\r\n        <label for=\"toggle-all\">Mark all as complete</label>\r\n        <ul class=\"todo-list\" ws-hole=\"TodoList\">\r\n            \r\n        </ul>\r\n    </section>\r\n    <div ws-replace=\"Footer\">\r\n        \r\n    </div>\r\n</section>\r\n<footer class=\"info\">\r\n    <p>Double-click to edit a todo</p>\r\n    <p>Written by <a href=\"https://github.com/SimonJF\">Simon Fowler</a> and <a href=\"https://github.com/qwe2\">István Gansperger</a></p>\r\n</footer>\r\n\r\n");
  },h):Templates.PrepareTemplate("todoapp",null,function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<section class=\"todoapp\" ws-chidlren-template=\"TodoApp\">\r\n    <header class=\"header\">\r\n        <h1>todos</h1>\r\n        <input class=\"new-todo\" ws-var=\"NewTask\" ws-onkeyup=\"Add\" placeholder=\"What needs to be done?\" autofocus=\"\">\r\n    </header>\r\n    <section class=\"main\">\r\n        <span ws-replace=\"ToggleAll\"></span>\r\n        <label for=\"toggle-all\">Mark all as complete</label>\r\n        <ul class=\"todo-list\" ws-hole=\"TodoList\">\r\n            \r\n        </ul>\r\n    </section>\r\n    <div ws-replace=\"Footer\">\r\n        \r\n    </div>\r\n</section>\r\n<footer class=\"info\">\r\n    <p>Double-click to edit a todo</p>\r\n    <p>Written by <a href=\"https://github.com/SimonJF\">Simon Fowler</a> and <a href=\"https://github.com/qwe2\">István Gansperger</a></p>\r\n</footer>\r\n\r\n");
  });
 };
 todo_Templates.listitem=function(h)
 {
  return h?Templates.GetOrLoadTemplate("todoapp",{
   $:1,
   $0:"listitem"
  },function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<li class=\"${ItemState}\">\r\n                <div class=\"view\">\r\n                    <input class=\"toggle\" ws-var=\"Checked\" type=\"checkbox\">\r\n                    <label ws-ondblclick=\"Edit\">${Title}</label>\r\n                    <button class=\"destroy\" ws-onclick=\"Destroy\"></button>\r\n                </div>\r\n                <div ws-replace=\"TitleEditing\"></div>\r\n            </li>");
  },h):Templates.PrepareTemplate("todoapp",{
   $:1,
   $0:"listitem"
  },function()
  {
   return DomUtility.ParseHTMLIntoFakeRoot("<li class=\"${ItemState}\">\r\n                <div class=\"view\">\r\n                    <input class=\"toggle\" ws-var=\"Checked\" type=\"checkbox\">\r\n                    <label ws-ondblclick=\"Edit\">${Title}</label>\r\n                    <button class=\"destroy\" ws-onclick=\"Destroy\"></button>\r\n                </div>\r\n                <div ws-replace=\"TitleEditing\"></div>\r\n            </li>");
  });
 };
 ListModel=UI.ListModel=Runtime$1.Class({
  UpdateAll:function(fn)
  {
   var $this;
   $this=this;
   this["var"].Update(function(a)
   {
    Arrays.iteri(function(i,x)
    {
     var o;
     o=fn(x);
     return o==null?null:Arrays.set(a,i,o.$0);
    },a);
    return $this.storage.SSet(a);
   });
   this.ObsoleteAll();
  },
  TryFind:function(pred)
  {
   return Arrays.tryFind(pred,this["var"].Get());
  },
  RemoveBy:function(f)
  {
   var a,i,$1,v;
   a=this["var"].Get();
   for(i=0,$1=a.length-1;i<=$1;i++){
    v=Arrays.get(a,i);
    if(f(v))
     this.ObsoleteKey(this.key(v));
   }
   this["var"].Set(this.storage.SRemoveIf(f,this["var"].Get()));
  },
  Append:function(item)
  {
   var $this,v,t,m;
   $this=this;
   v=this["var"].Get();
   t=this.key(item);
   m=Arrays.tryFindIndex(function(it)
   {
    return Unchecked.Equals($this.key(it),t);
   },v);
   if(m!=null&&m.$==1)
    this["var"].Set(this.storage.SSetAt(m.$0,item,v));
   else
    this["var"].Set(this.storage.SAppend(item,v));
   this.ObsoleteKey(t);
  },
  RemoveByKey:function(key)
  {
   var $this;
   $this=this;
   this["var"].Set(this.storage.SRemoveIf(function(i)
   {
    return Unchecked.Equals($this.key(i),key);
   },this["var"].Get()));
   this.ObsoleteKey(key);
  },
  ObsoleteAll:function()
  {
   Seq.iter(function(ksn)
   {
    Snap.Obsolete(ksn.V);
   },this.it);
   this.it.Clear();
  },
  ObsoleteKey:function(key)
  {
   var m,o;
   m=(o=null,[this.it.TryGetValue(key,{
    get:function()
    {
     return o;
    },
    set:function(v)
    {
     o=v;
    }
   }),o]);
   if(m[0])
    {
     Snap.Obsolete(m[1]);
     this.it.Remove(key);
    }
  },
  MapLens:function(f)
  {
   var $this;
   $this=this;
   return View.MapSeqCachedViewBy($this.key,function(k,v)
   {
    return f(k,$this["LensInto'"](Global.id,function($1,$2)
    {
     return $2;
    },k,v));
   },this["var"].get_View());
  },
  "LensInto'":function(get,update,key,view)
  {
   var $this,id,$1;
   $this=this;
   id=Fresh.Id();
   $1=new Var({
    Get:function()
    {
     return get($this.FindByKey(key));
    },
    Set:function(v)
    {
     return $this.UpdateBy(function(i)
     {
      return{
       $:1,
       $0:update(i,v)
      };
     },key);
    },
    SetFinal:function(v)
    {
     return this.Set(v);
    },
    Update:function(f)
    {
     return $this.UpdateBy(function(i)
     {
      return{
       $:1,
       $0:update(i,f(get(i)))
      };
     },key);
    },
    UpdateMaybe:function(f)
    {
     return $this.UpdateBy(function(i)
     {
      var x;
      x=f(get(i));
      return x==null?null:{
       $:1,
       $0:update(i,x.$0)
      };
     },key);
    },
    get_View:function()
    {
     return view;
    },
    get_Id:function()
    {
     return id;
    }
   });
   Var.New.call($1);
   return $1;
  },
  FindByKey:function(key)
  {
   var $this;
   $this=this;
   return Arrays.find(function(it)
   {
    return Unchecked.Equals($this.key(it),key);
   },this["var"].Get());
  },
  UpdateBy:function(fn,key)
  {
   var $this,v,m,index,m$1;
   $this=this;
   v=this["var"].Get();
   m=Arrays.tryFindIndex(function(it)
   {
    return Unchecked.Equals($this.key(it),key);
   },v);
   if(m!=null&&m.$==1)
    {
     index=m.$0;
     m$1=fn(Arrays.get(v,index));
     m$1!=null&&m$1.$==1?(this["var"].Set(this.storage.SSetAt(index,m$1.$0,v)),this.ObsoleteKey(key)):void 0;
    }
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(this["var"].Get());
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(this["var"].Get());
  }
 },Obj,ListModel);
 ListModel.New=Runtime$1.Ctor(function(key,storage)
 {
  ListModel.New$3.call(this,key,Var$1.Create$1(Arrays.ofSeq(Seq.distinctBy(key,storage.SInit()))),storage);
 },ListModel);
 ListModel.New$3=Runtime$1.Ctor(function(key,_var,storage)
 {
  Obj.New.call(this);
  this.key=key;
  this["var"]=_var;
  this.storage=storage;
  this.v=View.Map(function(x)
  {
   return x.slice();
  },this["var"].get_View());
  this.it=new Dictionary.New$5();
 },ListModel);
 SC$2.$cctor=function()
 {
  SC$2.$cctor=Global.ignore;
  SC$2.LoadedTemplates=new Dictionary.New$5();
  SC$2.LocalTemplatesLoaded=false;
  SC$2.GlobalHoles=new Dictionary.New$5();
  SC$2.TextHoleRE="\\${([^}]+)}";
  SC$2.RenderedFullDocTemplate=null;
 };
 HashSet=Collections.HashSet=Runtime$1.Class({
  Add:function(item)
  {
   return this.add(item);
  },
  Contains:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrContains(item,arr);
  },
  add:function(item)
  {
   var h,arr;
   h=this.hash(item);
   arr=this.data[h];
   return arr==null?(this.data[h]=[item],this.count=this.count+1,true):this.arrContains(item,arr)?false:(arr.push(item),this.count=this.count+1,true);
  },
  arrContains:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     c=false;
    else
     i=i+1;
   return!c;
  },
  ExceptWith:function(xs)
  {
   var e;
   e=Enumerator.Get(xs);
   try
   {
    while(e.MoveNext())
     this.Remove(e.Current());
   }
   finally
   {
    if(typeof e=="object"&&"Dispose"in e)
     e.Dispose();
   }
  },
  get_Count:function()
  {
   return this.count;
  },
  CopyTo:function(arr)
  {
   var i,all,i$1,$1;
   i=0;
   all=HashSetUtil.concat(this.data);
   for(i$1=0,$1=all.length-1;i$1<=$1;i$1++)Arrays.set(arr,i$1,all[i$1]);
  },
  IntersectWith:function(xs)
  {
   var other,all,i,$1,item;
   other=new HashSet.New$4(xs,this.equals,this.hash);
   all=HashSetUtil.concat(this.data);
   for(i=0,$1=all.length-1;i<=$1;i++){
    item=all[i];
    if(!other.Contains(item))
     this.Remove(item);
   }
  },
  Remove:function(item)
  {
   var arr;
   arr=this.data[this.hash(item)];
   return arr==null?false:this.arrRemove(item,arr)&&(this.count=this.count-1,true);
  },
  arrRemove:function(item,arr)
  {
   var c,i,$1,l;
   c=true;
   i=0;
   l=arr.length;
   while(c&&i<l)
    if(this.equals.apply(null,[arr[i],item]))
     {
      arr.splice.apply(arr,[i,1]);
      c=false;
     }
    else
     i=i+1;
   return!c;
  },
  GetEnumerator:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get(HashSetUtil.concat(this.data));
  }
 },Obj,HashSet);
 HashSet.New$3=Runtime$1.Ctor(function()
 {
  HashSet.New$4.call(this,[],Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 HashSet.New$4=Runtime$1.Ctor(function(init,equals,hash)
 {
  var e;
  Obj.New.call(this);
  this.equals=equals;
  this.hash=hash;
  this.data=[];
  this.count=0;
  e=Enumerator.Get(init);
  try
  {
   while(e.MoveNext())
    this.add(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 },HashSet);
 HashSet.New$2=Runtime$1.Ctor(function(init)
 {
  HashSet.New$4.call(this,init,Unchecked.Equals,Unchecked.Hash);
 },HashSet);
 Seq.head=function(s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   return e.MoveNext()?e.Current():Seq.insufficient();
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.sumBy=function(f,s)
 {
  return Seq.fold(function($1,$2)
  {
   return $1+f($2);
  },0,s);
 };
 Seq.isEmpty=function(s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   return!e.MoveNext();
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.exists=function(p,s)
 {
  var e,r;
  e=Enumerator.Get(s);
  try
  {
   r=false;
   while(!r&&e.MoveNext())
    r=p(e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.fold=function(f,x,s)
 {
  var r,e;
  r=x;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    r=f(r,e.Current());
   return r;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.delay=function(f)
 {
  return{
   GetEnumerator:function()
   {
    return Enumerator.Get(f());
   }
  };
 };
 Seq.append=function(s1,s2)
 {
  return{
   GetEnumerator:function()
   {
    var e1,first;
    e1=Enumerator.Get(s1);
    first=[true];
    return new T$1.New(e1,null,function(x)
    {
     var x$1;
     return x.s.MoveNext()?(x.c=x.s.Current(),true):(x$1=x.s,!Unchecked.Equals(x$1,null)?x$1.Dispose():void 0,x.s=null,first[0]&&(first[0]=false,x.s=Enumerator.Get(s2),x.s.MoveNext()?(x.c=x.s.Current(),true):(x.s.Dispose(),x.s=null,false)));
    },function(x)
    {
     var x$1;
     x$1=x.s;
     if(!Unchecked.Equals(x$1,null))
      x$1.Dispose();
    });
   }
  };
 };
 Seq.distinctBy=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var o,seen;
    o=Enumerator.Get(s);
    seen=new HashSet.New$3();
    return new T$1.New(null,null,function(e)
    {
     var cur,has;
     if(o.MoveNext())
      {
       cur=o.Current();
       has=seen.Add(f(cur));
       while(!has&&o.MoveNext())
        {
         cur=o.Current();
         has=seen.Add(f(cur));
        }
       return has&&(e.c=cur,true);
      }
     else
      return false;
    },function()
    {
     o.Dispose();
    });
   }
  };
 };
 Seq.map=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    var en;
    en=Enumerator.Get(s);
    return new T$1.New(null,null,function(e)
    {
     return en.MoveNext()&&(e.c=f(en.Current()),true);
    },function()
    {
     en.Dispose();
    });
   }
  };
 };
 Seq.iter=function(p,s)
 {
  var e;
  e=Enumerator.Get(s);
  try
  {
   while(e.MoveNext())
    p(e.Current());
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.rev=function(s)
 {
  return Seq.delay(function()
  {
   return Arrays.ofSeq(s).slice().reverse();
  });
 };
 Seq.forall2=function(p,s1,s2)
 {
  return!Seq.exists2(function($1,$2)
  {
   return!p($1,$2);
  },s1,s2);
 };
 Seq.distinct=function(s)
 {
  return Seq.distinctBy(Global.id,s);
 };
 Seq.exists2=function(p,s1,s2)
 {
  var e1,$1,e2,r;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=false;
    while(!r&&e1.MoveNext()&&e2.MoveNext())
     r=p(e1.Current(),e2.Current());
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 Seq.max=function(s)
 {
  var e,m,x;
  e=Enumerator.Get(s);
  try
  {
   if(!e.MoveNext())
    Seq.seqEmpty();
   m=e.Current();
   while(e.MoveNext())
    {
     x=e.Current();
     if(Unchecked.Compare(x,m)===1)
      m=x;
    }
   return m;
  }
  finally
  {
   if(typeof e=="object"&&"Dispose"in e)
    e.Dispose();
  }
 };
 Seq.seqEmpty=function()
 {
  return Operators.FailWith("The input sequence was empty.");
 };
 Seq.forall=function(p,s)
 {
  return!Seq.exists(function(x)
  {
   return!p(x);
  },s);
 };
 Seq.unfold=function(f,s)
 {
  return{
   GetEnumerator:function()
   {
    return new T$1.New(s,null,function(e)
    {
     var m;
     m=f(e.s);
     return m==null?false:(e.c=m.$0[0],e.s=m.$0[1],true);
    },void 0);
   }
  };
 };
 Seq.compareWith=function(f,s1,s2)
 {
  var e1,$1,e2,r,loop;
  e1=Enumerator.Get(s1);
  try
  {
   e2=Enumerator.Get(s2);
   try
   {
    r=0;
    loop=true;
    while(loop&&r===0)
     if(e1.MoveNext())
      r=e2.MoveNext()?f(e1.Current(),e2.Current()):1;
     else
      if(e2.MoveNext())
       r=-1;
      else
       loop=false;
    $1=r;
   }
   finally
   {
    if(typeof e2=="object"&&"Dispose"in e2)
     e2.Dispose();
   }
   return $1;
  }
  finally
  {
   if(typeof e1=="object"&&"Dispose"in e1)
    e1.Dispose();
  }
 };
 View=UI.View=Runtime$1.Class({},null,View);
 Docs.LinkElement=function(el,children)
 {
  Docs.InsertDoc(el,children,null);
 };
 Docs.InsertDoc=function(parent,doc,pos)
 {
  var d,b,a;
  while(true)
   if(doc!=null&&doc.$==1)
    return Docs.InsertNode(parent,doc.$0.El,pos);
   else
    if(doc!=null&&doc.$==2)
     {
      d=doc.$0;
      d.Dirty=false;
      doc=d.Current;
     }
    else
     if(doc==null)
      return pos;
     else
      if(doc!=null&&doc.$==4)
       return Docs.InsertNode(parent,doc.$0.Text,pos);
      else
       if(doc!=null&&doc.$==5)
        return Docs.InsertNode(parent,doc.$0,pos);
       else
        if(doc!=null&&doc.$==6)
         return Arrays.foldBack(function($1,$2)
         {
          return(((Runtime$1.Curried3(function(parent$1,el,pos$1)
          {
           return el==null||el.constructor===Object?Docs.InsertDoc(parent$1,el,pos$1):Docs.InsertNode(parent$1,el,pos$1);
          }))(parent))($1))($2);
         },doc.$0.Els,pos);
        else
         {
          b=doc.$1;
          a=doc.$0;
          doc=a;
          pos=Docs.InsertDoc(parent,b,pos);
         }
 };
 Docs.CreateRunState=function(parent,doc)
 {
  return RunState.New(NodeSet.get_Empty(),Docs.CreateElemNode(parent,Attrs.EmptyAttr(),doc));
 };
 Docs.PerformAnimatedUpdate=function(childrenOnly,st,doc)
 {
  var b;
  return An.get_UseAnimations()?(b=null,Concurrency.Delay(function()
  {
   var cur,change,enter;
   cur=NodeSet.FindAll(doc);
   change=Docs.ComputeChangeAnim(st,cur);
   enter=Docs.ComputeEnterAnim(st,cur);
   return Concurrency.Bind(An.Play(An.Append(change,Docs.ComputeExitAnim(st,cur))),function()
   {
    return Concurrency.Bind(Docs.SyncElemNodesNextFrame(childrenOnly,st),function()
    {
     return Concurrency.Bind(An.Play(enter),function()
     {
      st.PreviousNodes=cur;
      return Concurrency.Return(null);
     });
    });
   });
  })):Docs.SyncElemNodesNextFrame(childrenOnly,st);
 };
 Docs.PerformSyncUpdate=function(childrenOnly,st,doc)
 {
  var cur;
  cur=NodeSet.FindAll(doc);
  Docs.SyncElemNode(childrenOnly,st.Top);
  st.PreviousNodes=cur;
 };
 Docs.CreateEmbedNode=function()
 {
  return{
   Current:null,
   Dirty:false
  };
 };
 Docs.UpdateEmbedNode=function(node,upd)
 {
  node.Current=upd;
  node.Dirty=true;
 };
 Docs.InsertNode=function(parent,node,pos)
 {
  DomUtility.InsertAt(parent,pos,node);
  return node;
 };
 Docs.CreateElemNode=function(el,attr$1,children)
 {
  var attr$2;
  Docs.LinkElement(el,children);
  attr$2=Attrs.Insert(el,attr$1);
  return DocElemNode.New(attr$2,children,null,el,Fresh.Int(),Runtime$1.GetOptional(attr$2.OnAfterRender));
 };
 Docs.SyncElemNodesNextFrame=function(childrenOnly,st)
 {
  function a(ok)
  {
   Global.requestAnimationFrame(function()
   {
    Docs.SyncElemNode(childrenOnly,st.Top);
    ok();
   });
  }
  return Settings.BatchUpdatesEnabled()?Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  }):(Docs.SyncElemNode(childrenOnly,st.Top),Concurrency.Return(null));
 };
 Docs.ComputeExitAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetExitAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(cur,NodeSet.Filter(function(n)
  {
   return Attrs.HasExitAnim(n.Attr);
  },st.PreviousNodes)))));
 };
 Docs.ComputeEnterAnim=function(st,cur)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetEnterAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Except(st.PreviousNodes,NodeSet.Filter(function(n)
  {
   return Attrs.HasEnterAnim(n.Attr);
  },cur)))));
 };
 Docs.ComputeChangeAnim=function(st,cur)
 {
  var relevant;
  function a(n)
  {
   return Attrs.HasChangeAnim(n.Attr);
  }
  relevant=function(a$1)
  {
   return NodeSet.Filter(a,a$1);
  };
  return An.Concat(Arrays.map(function(n)
  {
   return Attrs.GetChangeAnim(n.Attr);
  },NodeSet.ToArray(NodeSet.Intersect(relevant(st.PreviousNodes),relevant(cur)))));
 };
 Docs.SyncElemNode=function(childrenOnly,el)
 {
  !childrenOnly?Docs.SyncElement(el):void 0;
  Docs.Sync(el.Children);
  Docs.AfterRender(el);
 };
 Docs.SyncElement=function(el)
 {
  function hasDirtyChildren(el$1)
  {
   function dirty(doc)
   {
    var t,b,a,d;
    while(true)
     {
      if(doc!=null&&doc.$==0)
       {
        b=doc.$1;
        a=doc.$0;
        if(dirty(a))
         return true;
        else
         doc=b;
       }
      else
       if(doc!=null&&doc.$==2)
        {
         d=doc.$0;
         if(d.Dirty)
          return true;
         else
          doc=d.Current;
        }
       else
        return doc!=null&&doc.$==6&&(t=doc.$0,t.Dirty||Arrays.exists(hasDirtyChildren,t.Holes));
     }
   }
   return dirty(el$1.Children);
  }
  Attrs.Sync(el.El,el.Attr);
  if(hasDirtyChildren(el))
   Docs.DoSyncElement(el);
 };
 Docs.Sync=function(doc)
 {
  var d,t,n,b,a;
  while(true)
   {
    if(doc!=null&&doc.$==1)
     return Docs.SyncElemNode(false,doc.$0);
    else
     if(doc!=null&&doc.$==2)
      {
       n=doc.$0;
       doc=n.Current;
      }
     else
      if(doc==null)
       return null;
      else
       if(doc!=null&&doc.$==5)
        return null;
       else
        if(doc!=null&&doc.$==4)
         {
          d=doc.$0;
          return d.Dirty?(d.Text.nodeValue=d.Value,d.Dirty=false):null;
         }
        else
         if(doc!=null&&doc.$==6)
          {
           t=doc.$0;
           Arrays.iter(function(c)
           {
            return function(e)
            {
             Docs.SyncElemNode(c,e);
            };
           }(false),t.Holes);
           Arrays.iter(function(t$1)
           {
            Attrs.Sync(t$1[0],t$1[1]);
           },t.Attrs);
           return Docs.AfterRender(t);
          }
         else
          {
           b=doc.$1;
           a=doc.$0;
           Docs.Sync(a);
           doc=b;
          }
   }
 };
 Docs.AfterRender=function(el)
 {
  var m;
  m=Runtime$1.GetOptional(el.Render);
  if(m!=null&&m.$==1)
   {
    m.$0(el.El);
    Runtime$1.SetOptional(el,"Render",null);
   }
 };
 Docs.DoSyncElement=function(el)
 {
  var parent,p,m;
  function ins(doc,pos)
  {
   var t,d,b,a;
   while(true)
    {
     if(doc!=null&&doc.$==1)
      return doc.$0.El;
     else
      if(doc!=null&&doc.$==2)
       {
        d=doc.$0;
        if(d.Dirty)
         {
          d.Dirty=false;
          return Docs.InsertDoc(parent,d.Current,pos);
         }
        else
         doc=d.Current;
       }
      else
       if(doc==null)
        return pos;
       else
        if(doc!=null&&doc.$==4)
         return doc.$0.Text;
        else
         if(doc!=null&&doc.$==5)
          return doc.$0;
         else
          if(doc!=null&&doc.$==6)
           {
            t=doc.$0;
            t.Dirty?t.Dirty=false:void 0;
            return Arrays.foldBack(function($1,$2)
            {
             return $1==null||$1.constructor===Object?ins($1,$2):$1;
            },t.Els,pos);
           }
          else
           {
            b=doc.$1;
            a=doc.$0;
            doc=a;
            pos=ins(b,pos);
           }
    }
  }
  parent=el.El;
  DomNodes.Iter((p=el.El,function(e)
  {
   DomUtility.RemoveNode(p,e);
  }),DomNodes.Except(DomNodes.DocChildren(el),DomNodes.Children(el.El,Runtime$1.GetOptional(el.Delimiters))));
  ins(el.Children,(m=Runtime$1.GetOptional(el.Delimiters),m!=null&&m.$==1?m.$0[1]:null));
 };
 Docs.InsertBeforeDelim=function(afterDelim,doc)
 {
  var p,before;
  p=afterDelim.parentNode;
  before=self.document.createTextNode("");
  p.insertBefore(before,afterDelim);
  Docs.LinkPrevElement(afterDelim,doc);
  return before;
 };
 Docs.CreateTextNode=function()
 {
  return{
   Text:self.document.createTextNode(""),
   Dirty:false,
   Value:""
  };
 };
 Docs.UpdateTextNode=function(n,t)
 {
  n.Value=t;
  n.Dirty=true;
 };
 Docs.LinkPrevElement=function(el,children)
 {
  Docs.InsertDoc(el.parentNode,children,el);
 };
 Map.OfArray=function(a)
 {
  return new FSharpMap.New$1(BalancedTree.OfSeq(Seq.map(function($1)
  {
   return Pair.New($1[0],$1[1]);
  },a)));
 };
 Storage.InMemory=function(init)
 {
  return new ArrayStorage.New(init);
 };
 Numeric.TryParseInt32=function(s,r)
 {
  return Numeric.TryParse(s,-2147483648,2147483647,r);
 };
 Routing.InstallMap=function(rt)
 {
  var _var;
  function same(a,b)
  {
   return Unchecked.Equals(rt.Ser(a),rt.Ser(b));
  }
  function cur()
  {
   return rt.Des(Route.ToList(Route.ParseHash(self.location.hash)));
  }
  function set(value)
  {
   if(!same(_var.Get(),value))
    _var.Set(value);
  }
  function onUpdate(evt)
  {
   return set(cur());
  }
  _var=Var$1.Create$1(cur());
  self.onpopstate=onUpdate;
  self.onhashchange=onUpdate;
  View.Sink(function(loc)
  {
   var ha,t;
   ha=Route.MakeHash((t=rt.Ser(loc),Route.FromList(t[0],t[1])));
   if(!Route.SameHash(self.location.hash,ha))
    self.location.replace("#"+ha);
  },_var.get_View());
  return _var;
 };
 ConcreteVar=UI.ConcreteVar=Runtime$1.Class({
  get_View:function()
  {
   return this.view;
  },
  Set:function(v)
  {
   if(this.isConst)
    (function($1)
    {
     return $1("WebSharper.UI: invalid attempt to change value of a Var after calling SetFinal");
    }(function(s)
    {
     console.log(s);
    }));
   else
    {
     Snap.Obsolete(this.snap);
     this.current=v;
     this.snap=Snap.New({
      $:2,
      $0:v,
      $1:[]
     });
    }
  },
  Get:function()
  {
   return this.current;
  },
  Update:function(f)
  {
   this.Set(f(this.Get()));
  },
  UpdateMaybe:function(f)
  {
   var m;
   m=f(this.Get());
   if(m!=null&&m.$==1)
    this.Set(m.$0);
  }
 },Var,ConcreteVar);
 ConcreteVar.New=Runtime$1.Ctor(function(isConst,initSnap,initValue)
 {
  var $this;
  $this=this;
  Var.New.call(this);
  this.isConst=isConst;
  this.current=initValue;
  this.snap=initSnap;
  this.view=function()
  {
   return $this.snap;
  };
  this.id=Fresh.Int();
 },ConcreteVar);
 Snap.Map=function(fn,sn)
 {
  var m,res;
  m=sn.s;
  return m!=null&&m.$==0?Snap.New({
   $:0,
   $0:fn(m.$0)
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(a)
  {
   Snap.MarkDone(res,sn,fn(a));
  },res),res));
 };
 Snap.WhenObsoleteRun=function(snap,obs)
 {
  var m;
  m=snap.s;
  if(m==null)
   obs();
  else
   m!=null&&m.$==2?m.$1.push(obs):m!=null&&m.$==3?m.$1.push(obs):void 0;
 };
 Snap.When=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  if(m==null)
   Snap.Obsolete(obs);
  else
   m!=null&&m.$==2?(Snap.EnqueueSafe(m.$1,obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),Snap.EnqueueSafe(m.$1,obs)):avail(m.$0);
 };
 Snap.MarkDone=function(res,sn,v)
 {
  var $1;
  if($1=sn.s,$1!=null&&$1.$==0)
   Snap.MarkForever(res,v);
  else
   Snap.MarkReady(res,v);
 };
 Snap.WhenRun=function(snap,avail,obs)
 {
  var m;
  m=snap.s;
  if(m==null)
   obs();
  else
   m!=null&&m.$==2?(m.$1.push(obs),avail(m.$0)):m!=null&&m.$==3?(m.$0.push(avail),m.$1.push(obs)):avail(m.$0);
 };
 Snap.Map2=function(fn,sn1,sn2)
 {
  var $1,$2,res;
  function cont(a)
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     if($3!=null&&$3.$==1)
      $4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,fn($3.$0[0],$4.$0[0])):Snap.MarkReady(res,fn($3.$0[0],$4.$0[0])):void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0)
  }):Snap.Map2Opt1(fn,$1.$0,sn2):$2!=null&&$2.$==0?Snap.Map2Opt2(fn,$2.$0,sn1):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.EnqueueSafe=function(q,x)
 {
  var qcopy,i,$1,o;
  q.push(x);
  if(q.length%20===0)
   {
    qcopy=q.slice(0);
    Queue.Clear(q);
    for(i=0,$1=Arrays.length(qcopy)-1;i<=$1;i++){
     o=Arrays.get(qcopy,i);
     if(typeof o=="object")
      (function(sn)
      {
       if(sn.s)
        q.push(sn);
      }(o));
     else
      (function(f)
      {
       q.push(f);
      }(o));
    }
   }
  else
   void 0;
 };
 Snap.MarkForever=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:0,
     $0:v
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.MarkReady=function(sn,v)
 {
  var m,qa,i,$1;
  m=sn.s;
  if(m!=null&&m.$==3)
   {
    sn.s={
     $:2,
     $0:v,
     $1:m.$1
    };
    qa=m.$0;
    for(i=0,$1=Arrays.length(qa)-1;i<=$1;i++)(Arrays.get(qa,i))(v);
   }
  else
   void 0;
 };
 Snap.Map2Opt1=function(fn,x,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y);
  },sn2);
 };
 Snap.Map2Opt2=function(fn,y,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y);
  },sn1);
 };
 Snap.ValueAndForever=function(snap)
 {
  var m;
  m=snap.s;
  return m!=null&&m.$==0?{
   $:1,
   $0:[m.$0,true]
  }:m!=null&&m.$==2?{
   $:1,
   $0:[m.$0,false]
  }:null;
 };
 Snap.Join=function(snap)
 {
  var res;
  res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  });
  Snap.When(snap,function(x)
  {
   var y;
   y=x();
   Snap.When(y,function(v)
   {
    var $1,$2;
    if(($1=y.s,$1!=null&&$1.$==0)&&($2=snap.s,$2!=null&&$2.$==0))
     Snap.MarkForever(res,v);
    else
     Snap.MarkReady(res,v);
   },res);
  },res);
  return res;
 };
 Snap.Map2Unit=function(sn1,sn2)
 {
  var $1,$2,res;
  function cont()
  {
   var m,$3,$4;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $3=Snap.ValueAndForever(sn1);
     $4=Snap.ValueAndForever(sn2);
     if($3!=null&&$3.$==1)
      $4!=null&&$4.$==1?$3.$0[1]&&$4.$0[1]?Snap.MarkForever(res,null):Snap.MarkReady(res,null):void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?Snap.New({
   $:0,
   $0:null
  }):sn2:$2!=null&&$2.$==0?sn1:(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),res));
 };
 Snap.Copy=function(sn)
 {
  var m,res,res$1;
  m=sn.s;
  return m==null?sn:m!=null&&m.$==2?(res=Snap.New({
   $:2,
   $0:m.$0,
   $1:[]
  }),(Snap.WhenObsolete(sn,res),res)):m!=null&&m.$==3?(res$1=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn,function(v)
  {
   Snap.MarkDone(res$1,sn,v);
  },res$1),res$1)):sn;
 };
 Snap.WhenObsolete=function(snap,obs)
 {
  var m;
  m=snap.s;
  if(m==null)
   Snap.Obsolete(obs);
  else
   m!=null&&m.$==2?Snap.EnqueueSafe(m.$1,obs):m!=null&&m.$==3?Snap.EnqueueSafe(m.$1,obs):void 0;
 };
 Snap.Map3=function(fn,sn1,sn2,sn3)
 {
  var $1,$2,$3,res;
  function cont(a)
  {
   var m,$4,$5,$6;
   if(!(m=res.s,m!=null&&m.$==0||m!=null&&m.$==2))
    {
     $4=Snap.ValueAndForever(sn1);
     $5=Snap.ValueAndForever(sn2);
     $6=Snap.ValueAndForever(sn3);
     if($4!=null&&$4.$==1)
      $5!=null&&$5.$==1?$6!=null&&$6.$==1?$4.$0[1]&&$5.$0[1]&&$6.$0[1]?Snap.MarkForever(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):Snap.MarkReady(res,fn($4.$0[0],$5.$0[0],$6.$0[0])):void 0:void 0;
    }
  }
  $1=sn1.s;
  $2=sn2.s;
  $3=sn3.s;
  return $1!=null&&$1.$==0?$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.New({
   $:0,
   $0:fn($1.$0,$2.$0,$3.$0)
  }):Snap.Map3Opt1(fn,$1.$0,$2.$0,sn3):$3!=null&&$3.$==0?Snap.Map3Opt2(fn,$1.$0,$3.$0,sn2):Snap.Map3Opt3(fn,$1.$0,sn2,sn3):$2!=null&&$2.$==0?$3!=null&&$3.$==0?Snap.Map3Opt4(fn,$2.$0,$3.$0,sn1):Snap.Map3Opt5(fn,$2.$0,sn1,sn3):$3!=null&&$3.$==0?Snap.Map3Opt6(fn,$3.$0,sn1,sn2):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(Snap.When(sn1,cont,res),Snap.When(sn2,cont,res),Snap.When(sn3,cont,res),res));
 };
 Snap.Sequence=function(snaps)
 {
  var snaps$1,res,w;
  function cont(a)
  {
   var vs;
   if(w[0]===0)
    {
     vs=Arrays.map(function(s)
     {
      var m;
      m=s.s;
      return m!=null&&m.$==0?m.$0:m!=null&&m.$==2?m.$0:Operators.FailWith("value not found by View.Sequence");
     },snaps$1);
     if(Arrays.forall(function(a$1)
     {
      var $1;
      $1=a$1.s;
      return $1!=null&&$1.$==0;
     },snaps$1))
      Snap.MarkForever(res,vs);
     else
      Snap.MarkReady(res,vs);
    }
   else
    w[0]--;
  }
  snaps$1=Arrays.ofSeq(snaps);
  return snaps$1.length==0?Snap.New({
   $:0,
   $0:[]
  }):(res=Snap.New({
   $:3,
   $0:[],
   $1:[]
  }),(w=[Arrays.length(snaps$1)-1],(Arrays.iter(function(s)
  {
   Snap.When(s,cont,res);
  },snaps$1),res)));
 };
 Snap.Map3Opt1=function(fn,x,y,sn3)
 {
  return Snap.Map(function(z)
  {
   return fn(x,y,z);
  },sn3);
 };
 Snap.Map3Opt2=function(fn,x,z,sn2)
 {
  return Snap.Map(function(y)
  {
   return fn(x,y,z);
  },sn2);
 };
 Snap.Map3Opt3=function(fn,x,sn2,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn(x,$1,$2);
  },sn2,sn3);
 };
 Snap.Map3Opt4=function(fn,y,z,sn1)
 {
  return Snap.Map(function(x)
  {
   return fn(x,y,z);
  },sn1);
 };
 Snap.Map3Opt5=function(fn,y,sn1,sn3)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,y,$2);
  },sn1,sn3);
 };
 Snap.Map3Opt6=function(fn,z,sn1,sn2)
 {
  return Snap.Map2(function($1,$2)
  {
   return fn($1,$2,z);
  },sn1,sn2);
 };
 Guid.NewGuid=function()
 {
  return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(new Global.RegExp("[xy]","g"),function(c)
  {
   var r,v;
   r=Math.random()*16|0;
   v=c=="x"?r:r&3|8;
   return v.toString(16);
  });
 };
 List$1=Collections.List=Runtime$1.Class({
  GetEnumerator:function()
  {
   return Enumerator.Get(this);
  },
  GetEnumerator0:function()
  {
   return Enumerator.Get0(this);
  }
 },null,List$1);
 AttrProxy=UI.AttrProxy=Runtime$1.Class({},null,AttrProxy);
 AttrProxy.Create=function(name,value)
 {
  return Attrs.Static(function(el)
  {
   el.setAttribute(name,value);
  });
 };
 AttrProxy.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(Attrs.EmptyAttr(),AttrProxy.Append,x);
 };
 AttrProxy.Append=function(a,b)
 {
  return Attrs.AppendTree(a,b);
 };
 AttrProxy.Handler=function(event,q)
 {
  return AttrProxy.HandlerImpl(event,q);
 };
 AttrProxy.HandlerImpl=function(event,q)
 {
  return Attrs.Static(function(el)
  {
   el.addEventListener(event,function(d)
   {
    return(q(el))(d);
   },false);
  });
 };
 Attrs.Static=function(attr$1)
 {
  return new AttrProxy({
   $:3,
   $0:attr$1
  });
 };
 Attrs.Dynamic=function(view,set)
 {
  return new AttrProxy({
   $:1,
   $0:new DynamicAttrNode.New(view,set)
  });
 };
 Attrs.AppendTree=function(a,b)
 {
  var x;
  return a===null?b:b===null?a:(x=new AttrProxy({
   $:2,
   $0:a,
   $1:b
  }),(Attrs.SetFlags(x,Attrs.Flags(a)|Attrs.Flags(b)),x));
 };
 Attrs.Insert=function(elem,tree)
 {
  var nodes,oar,arr;
  function loop(node)
  {
   var b,a;
   while(true)
    if(!(node===null))
    {
     if(node!=null&&node.$==1)
      return nodes.push(node.$0);
     else
      if(node!=null&&node.$==2)
       {
        b=node.$1;
        a=node.$0;
        loop(a);
        node=b;
       }
      else
       return node!=null&&node.$==3?node.$0(elem):node!=null&&node.$==4?oar.push(node.$0):null;
    }
    else
     return null;
  }
  nodes=[];
  oar=[];
  loop(tree);
  arr=nodes.slice(0);
  return Dyn.New(elem,Attrs.Flags(tree),arr,oar.length===0?null:{
   $:1,
   $0:function(el)
   {
    Seq.iter(function(f)
    {
     f(el);
    },oar);
   }
  });
 };
 Attrs.EmptyAttr=function()
 {
  SC$7.$cctor();
  return SC$7.EmptyAttr;
 };
 Attrs.HasExitAnim=function(attr$1)
 {
  var flag;
  flag=2;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetExitAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetExitAnim($2);
  });
 };
 Attrs.HasEnterAnim=function(attr$1)
 {
  var flag;
  flag=1;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetEnterAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetEnterAnim($2);
  });
 };
 Attrs.HasChangeAnim=function(attr$1)
 {
  var flag;
  flag=4;
  return(attr$1.DynFlags&flag)===flag;
 };
 Attrs.GetChangeAnim=function(dyn)
 {
  return Attrs.GetAnim(dyn,function($1,$2)
  {
   return $1.NGetChangeAnim($2);
  });
 };
 Attrs.Updates=function(dyn)
 {
  return Array.MapTreeReduce(function(x)
  {
   return x.NChanged();
  },View.Const(),View.Map2Unit,dyn.DynNodes);
 };
 Attrs.SetFlags=function(a,f)
 {
  a.flags=f;
 };
 Attrs.Flags=function(a)
 {
  return a!==null&&a.hasOwnProperty("flags")?a.flags:0;
 };
 Attrs.GetAnim=function(dyn,f)
 {
  return An.Concat(Arrays.map(function(n)
  {
   return f(n,dyn.DynElem);
  },dyn.DynNodes));
 };
 Attrs.Sync=function(elem,dyn)
 {
  Arrays.iter(function(d)
  {
   d.NSync(elem);
  },dyn.DynNodes);
 };
 Attrs.Empty=function(e)
 {
  return Dyn.New(e,0,[],null);
 };
 Strings.Trim=function(s)
 {
  return s.replace(new Global.RegExp("^\\s+"),"").replace(new Global.RegExp("\\s+$"),"");
 };
 Strings.concat=function(separator,strings)
 {
  return Arrays.ofSeq(strings).join(separator);
 };
 Strings.SplitChars=function(s,sep,opts)
 {
  return Strings.Split(s,new Global.RegExp("["+Strings.RegexEscape(sep.join(""))+"]"),opts);
 };
 Strings.StartsWith=function(t,s)
 {
  return t.substring(0,s.length)==s;
 };
 Strings.Split=function(s,pat,opts)
 {
  return opts===1?Arrays.filter(function(x)
  {
   return x!=="";
  },Strings.SplitWith(s,pat)):Strings.SplitWith(s,pat);
 };
 Strings.RegexEscape=function(s)
 {
  return s.replace(new Global.RegExp("[-\\/\\\\^$*+?.()|[\\]{}]","g"),"\\$&");
 };
 Strings.SplitWith=function(str,pat)
 {
  return str.split(pat);
 };
 Strings.forall=function(f,s)
 {
  return Seq.forall(f,Strings.protect(s));
 };
 Strings.protect=function(s)
 {
  return s===null?"":s;
 };
 DictionaryUtil.notPresent=function()
 {
  return Operators.FailWith("The given key was not present in the dictionary.");
 };
 Arrays.exists=function(f,x)
 {
  var e,i,$1,l;
  e=false;
  i=0;
  l=Arrays.length(x);
  while(!e&&i<l)
   if(f(x[i]))
    e=true;
   else
    i=i+1;
  return e;
 };
 Arrays.tryPick=function(f,arr)
 {
  var res,i,m;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    m=f(arr[i]);
    if(m!=null&&m.$==1)
     res=m;
    i=i+1;
   }
  return res;
 };
 Arrays.tryFindIndex=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:i
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.ofSeq=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs.slice();
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    {
     q=[];
     o=Enumerator.Get(xs);
     try
     {
      while(o.MoveNext())
       q.push(o.Current());
      return q;
     }
     finally
     {
      if(typeof o=="object"&&"Dispose"in o)
       o.Dispose();
     }
    }
 };
 Arrays.iteri=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(i,arr[i]);
 };
 Arrays.tryFind=function(f,arr)
 {
  var res,i;
  res=null;
  i=0;
  while(i<arr.length&&res==null)
   {
    f(arr[i])?res={
     $:1,
     $0:arr[i]
    }:void 0;
    i=i+1;
   }
  return res;
 };
 Arrays.choose=function(f,arr)
 {
  var q,i,$1,m;
  q=[];
  for(i=0,$1=arr.length-1;i<=$1;i++){
   m=f(arr[i]);
   if(m==null)
    ;
   else
    q.push(m.$0);
  }
  return q;
 };
 Arrays.filter=function(f,arr)
 {
  var r,i,$1;
  r=[];
  for(i=0,$1=arr.length-1;i<=$1;i++)if(f(arr[i]))
   r.push(arr[i]);
  return r;
 };
 Arrays.map=function(f,arr)
 {
  var r,i,$1;
  r=new Global.Array(arr.length);
  for(i=0,$1=arr.length-1;i<=$1;i++)r[i]=f(arr[i]);
  return r;
 };
 Arrays.iter=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)f(arr[i]);
 };
 Arrays.foldBack=function(f,arr,zero)
 {
  var acc,$1,len,i,$2;
  acc=zero;
  len=arr.length;
  for(i=1,$2=len;i<=$2;i++)acc=f(arr[len-i],acc);
  return acc;
 };
 Arrays.ofList=function(xs)
 {
  var l,q;
  q=[];
  l=xs;
  while(!(l.$==0))
   {
    q.push(List.head(l));
    l=List.tail(l);
   }
  return q;
 };
 Arrays.pick=function(f,arr)
 {
  var m;
  m=Arrays.tryPick(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.sortInPlace=function(arr)
 {
  Arrays.mapInPlace(function(t)
  {
   return t[0];
  },Arrays.mapiInPlace(function($1,$2)
  {
   return[$2,$1];
  },arr).sort(Unchecked.Compare));
 };
 Arrays.concat=function(xs)
 {
  return Global.Array.prototype.concat.apply([],Arrays.ofSeq(xs));
 };
 Arrays.create=function(size,value)
 {
  var r,i,$1;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=value;
  return r;
 };
 Arrays.find=function(f,arr)
 {
  var m;
  m=Arrays.tryFind(f,arr);
  return m==null?Operators.FailWith("KeyNotFoundException"):m.$0;
 };
 Arrays.init=function(size,f)
 {
  var r,i,$1;
  if(size<0)
   Operators.FailWith("Negative size given.");
  else
   null;
  r=new Global.Array(size);
  for(i=0,$1=size-1;i<=$1;i++)r[i]=f(i);
  return r;
 };
 Arrays.forall=function(f,x)
 {
  var a,i,$1,l;
  a=true;
  i=0;
  l=Arrays.length(x);
  while(a&&i<l)
   if(f(x[i]))
    i=i+1;
   else
    a=false;
  return a;
 };
 Prepare.convertTextNode=function(n)
 {
  var m,li,$1,s,strRE,hole;
  m=null;
  li=0;
  s=n.textContent;
  strRE=new Global.RegExp(Templates.TextHoleRE(),"g");
  while(m=strRE.exec(s),m!==null)
   {
    n.parentNode.insertBefore(self.document.createTextNode(Slice.string(s,{
     $:1,
     $0:li
    },{
     $:1,
     $0:strRE.lastIndex-Arrays.get(m,0).length-1
    })),n);
    li=strRE.lastIndex;
    hole=self.document.createElement("span");
    hole.setAttribute("ws-replace",Arrays.get(m,1).toLowerCase());
    n.parentNode.insertBefore(hole,n);
   }
  strRE.lastIndex=0;
  n.textContent=Slice.string(s,{
   $:1,
   $0:li
  },null);
 };
 Prepare.failNotLoaded=function(name)
 {
  console.warn("Instantiating non-loaded template",name);
 };
 Prepare.fillTextHole=function(instance,fillWith,templateName)
 {
  var m;
  m=instance.querySelector("[ws-replace]");
  return Unchecked.Equals(m,null)?(console.warn("Filling non-existent text hole",templateName),null):(m.parentNode.replaceChild(self.document.createTextNode(fillWith),m),{
   $:1,
   $0:m.getAttribute("ws-replace")
  });
 };
 Prepare.removeHolesExcept=function(instance,dontRemove)
 {
  function run(attrName)
  {
   Templates.foreachNotPreserved(instance,"["+attrName+"]",function(e)
   {
    if(!dontRemove.Contains(e.getAttribute(attrName)))
     e.removeAttribute(attrName);
   });
  }
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  Templates.foreachNotPreserved(instance,"[ws-hole]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-hole")))
    {
     e.removeAttribute("ws-hole");
     while(e.hasChildNodes())
      e.removeChild(e.lastChild);
    }
  });
  Templates.foreachNotPreserved(instance,"[ws-replace]",function(e)
  {
   if(!dontRemove.Contains(e.getAttribute("ws-replace")))
    e.parentNode.removeChild(e);
  });
  Templates.foreachNotPreserved(instance,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.filter(function(x)
   {
    return dontRemove.Contains(Arrays.get(Strings.SplitChars(x,[":"],1),1));
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  Templates.foreachNotPreserved(instance,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1,attrName,_this;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++){
    attrName=Arrays.get(holeAttrs,i);
    e.setAttribute(attrName,(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),e.getAttribute(attrName).replace(_this,function($2,$3)
    {
     return dontRemove.Contains($3)?$2:"";
    })));
   }
  });
 };
 Prepare.fillInstanceAttrs=function(instance,fillWith)
 {
  var name,m,i,$1,a;
  Prepare.convertAttrs(fillWith);
  name=fillWith.nodeName.toLowerCase();
  m=instance.querySelector("[ws-attr="+name+"]");
  if(Unchecked.Equals(m,null))
   console.warn("Filling non-existent attr hole",name);
  else
   {
    m.removeAttribute("ws-attr");
    for(i=0,$1=fillWith.attributes.length-1;i<=$1;i++){
     a=fillWith.attributes.item(i);
     if(a.name==="class"&&m.hasAttribute("class"))
      m.setAttribute("class",m.getAttribute("class")+" "+a.nodeValue);
     else
      m.setAttribute(a.name,a.nodeValue);
    }
   }
 };
 Prepare.mapHoles=function(t,mappings)
 {
  function run(attrName)
  {
   Templates.foreachNotPreserved(t,"["+attrName+"]",function(e)
   {
    var m,o;
    m=(o=null,[mappings.TryGetValue(e.getAttribute(attrName).toLowerCase(),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    if(m[0])
     e.setAttribute(attrName,m[1]);
   });
  }
  run("ws-hole");
  run("ws-replace");
  run("ws-attr");
  run("ws-onafterrender");
  run("ws-var");
  Templates.foreachNotPreserved(t,"[ws-on]",function(e)
  {
   e.setAttribute("ws-on",Strings.concat(" ",Arrays.map(function(x)
   {
    var a,m,o;
    a=Strings.SplitChars(x,[":"],1);
    m=(o=null,[mappings.TryGetValue(Arrays.get(a,1),{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]);
    return m[0]?Arrays.get(a,0)+":"+m[1]:x;
   },Strings.SplitChars(e.getAttribute("ws-on"),[" "],1))));
  });
  Templates.foreachNotPreserved(t,"[ws-attr-holes]",function(e)
  {
   var holeAttrs,i,$1;
   holeAttrs=Strings.SplitChars(e.getAttribute("ws-attr-holes"),[" "],1);
   for(i=0,$1=holeAttrs.length-1;i<=$1;i++)(function()
   {
    var attrName;
    function f(s,a)
    {
     var a$1;
     a$1=Operators.KeyValue(a);
     return s.replace(new Global.RegExp("\\${"+a$1[0]+"}","ig"),"${"+a$1[1]+"}");
    }
    attrName=Arrays.get(holeAttrs,i);
    return e.setAttribute(attrName,(((Runtime$1.Curried3(Seq.fold))(f))(e.getAttribute(attrName)))(mappings));
   }());
  });
 };
 Prepare.fill=function(fillWith,p,n)
 {
  while(true)
   if(fillWith.hasChildNodes())
    n=p.insertBefore(fillWith.lastChild,n);
   else
    return null;
 };
 Prepare.convertAttrs=function(el)
 {
  var attrs,toRemove,events,holedAttrs,i,$1,a,_this;
  function lowercaseAttr(name)
  {
   var m;
   m=el.getAttribute(name);
   if(m===null)
    ;
   else
    el.setAttribute(name,m.toLowerCase());
  }
  attrs=el.attributes;
  toRemove=[];
  events=[];
  holedAttrs=[];
  for(i=0,$1=attrs.length-1;i<=$1;i++){
   a=attrs.item(i);
   if(Strings.StartsWith(a.nodeName,"ws-on")&&a.nodeName!=="ws-onafterrender"&&a.nodeName!=="ws-on")
    {
     toRemove.push(a.nodeName);
     events.push(Slice.string(a.nodeName,{
      $:1,
      $0:"ws-on".length
     },null)+":"+a.nodeValue.toLowerCase());
    }
   else
    !Strings.StartsWith(a.nodeName,"ws-")&&(new Global.RegExp(Templates.TextHoleRE())).test(a.nodeValue)?(a.nodeValue=(_this=new Global.RegExp(Templates.TextHoleRE(),"g"),a.nodeValue.replace(_this,function($2,$3)
    {
     return"${"+$3.toLowerCase()+"}";
    })),holedAttrs.push(a.nodeName)):void 0;
  }
  if(!(events.length==0))
   el.setAttribute("ws-on",Strings.concat(" ",events));
  if(!(holedAttrs.length==0))
   el.setAttribute("ws-attr-holes",Strings.concat(" ",holedAttrs));
  lowercaseAttr("ws-hole");
  lowercaseAttr("ws-replace");
  lowercaseAttr("ws-attr");
  lowercaseAttr("ws-onafterrender");
  lowercaseAttr("ws-var");
  Arrays.iter(function(a$1)
  {
   el.removeAttribute(a$1);
  },toRemove);
 };
 Slice.string=function(source,start,finish)
 {
  return start==null?finish!=null&&finish.$==1?source.slice(0,finish.$0+1):"":finish==null?source.slice(start.$0):source.slice(start.$0,finish.$0+1);
 };
 DomUtility.ParseHTMLIntoFakeRoot=function(elem)
 {
  var root,tag,m,p,w;
  function unwrap(elt,a)
  {
   var i;
   while(true)
    if(a===0)
     return elt;
    else
     {
      i=a;
      elt=elt.lastChild;
      a=i-1;
     }
  }
  root=self.document.createElement("div");
  return!DomUtility.rhtml().test(elem)?(root.appendChild(self.document.createTextNode(elem)),root):(tag=(m=DomUtility.rtagName().exec(elem),Unchecked.Equals(m,null)?"":Arrays.get(m,1).toLowerCase()),(p=(w=(DomUtility.wrapMap())[tag],w?w:DomUtility.defaultWrap()),(root.innerHTML=p[1]+elem.replace(DomUtility.rxhtmlTag(),"<$1></$2>")+p[2],unwrap(root,p[0]))));
 };
 DomUtility.AddClass=function(element,cl)
 {
  var c;
  c=DomUtility.getClass(element);
  if(c==="")
   DomUtility.setClass(element,cl);
  else
   !DomUtility.clsRE(cl).test(c)?DomUtility.setClass(element,c+" "+cl):void 0;
 };
 DomUtility.RemoveClass=function(element,cl)
 {
  var _this;
  DomUtility.setClass(element,(_this=DomUtility.clsRE(cl),DomUtility.getClass(element).replace(_this,function($1,$2,$3)
  {
   return $2===""||$3===""?"":" ";
  })));
 };
 DomUtility.rhtml=function()
 {
  SC$4.$cctor();
  return SC$4.rhtml;
 };
 DomUtility.wrapMap=function()
 {
  SC$4.$cctor();
  return SC$4.wrapMap;
 };
 DomUtility.defaultWrap=function()
 {
  SC$4.$cctor();
  return SC$4.defaultWrap;
 };
 DomUtility.rxhtmlTag=function()
 {
  SC$4.$cctor();
  return SC$4.rxhtmlTag;
 };
 DomUtility.rtagName=function()
 {
  SC$4.$cctor();
  return SC$4.rtagName;
 };
 DomUtility.IterSelector=function(el,selector,f)
 {
  var l,i,$1;
  l=el.querySelectorAll(selector);
  for(i=0,$1=l.length-1;i<=$1;i++)f(l[i]);
 };
 DomUtility.getClass=function(element)
 {
  return element instanceof Global.SVGElement?element.getAttribute("class"):element.className;
 };
 DomUtility.setClass=function(element,value)
 {
  if(element instanceof Global.SVGElement)
   element.setAttribute("class",value);
  else
   element.className=value;
 };
 DomUtility.clsRE=function(cls)
 {
  return new Global.RegExp("(\\s+|^)"+cls+"(?:\\s+"+cls+")*(\\s+|$)","g");
 };
 DomUtility.InsertAt=function(parent,pos,node)
 {
  var m;
  if(!(node.parentNode===parent&&pos===(m=node.nextSibling,Unchecked.Equals(m,null)?null:m)))
   parent.insertBefore(node,pos);
 };
 DomUtility.RemoveNode=function(parent,el)
 {
  if(el.parentNode===parent)
   parent.removeChild(el);
 };
 DomUtility.ChildrenArray=function(element)
 {
  var a,i,$1;
  a=[];
  for(i=0,$1=element.childNodes.length-1;i<=$1;i++)a.push(element.childNodes[i]);
  return a;
 };
 Enumerator.Get=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):x.GetEnumerator();
 };
 Enumerator.ArrayEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<Arrays.length(s)&&(e.c=Arrays.get(s,i),e.s=i+1,true);
  },void 0);
 };
 Enumerator.StringEnumerator=function(s)
 {
  return new T$1.New(0,null,function(e)
  {
   var i;
   i=e.s;
   return i<s.length&&(e.c=s[i],e.s=i+1,true);
  },void 0);
 };
 Enumerator.Get0=function(x)
 {
  return x instanceof Global.Array?Enumerator.ArrayEnumerator(x):Unchecked.Equals(typeof x,"string")?Enumerator.StringEnumerator(x):"GetEnumerator0"in x?x.GetEnumerator0():x.GetEnumerator();
 };
 Seq.insufficient=function()
 {
  return Operators.FailWith("The input sequence has an insufficient number of elements.");
 };
 Arrays.mapiInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(i,arr[i]);
  return arr;
 };
 Arrays.mapInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(arr[i]);
 };
 KeyCollection=Collections.KeyCollection=Runtime$1.Class({
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kvp)
   {
    return kvp.K;
   },this.d));
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  }
 },Obj,KeyCollection);
 KeyCollection.New=Runtime$1.Ctor(function(d)
 {
  Obj.New.call(this);
  this.d=d;
 },KeyCollection);
 DocElemNode=UI.DocElemNode=Runtime$1.Class({
  Equals:function(o)
  {
   return this.ElKey===o.ElKey;
  },
  GetHashCode:function()
  {
   return this.ElKey;
  }
 },null,DocElemNode);
 DocElemNode.New=function(Attr,Children,Delimiters,El,ElKey,Render)
 {
  var $1;
  return new DocElemNode(($1={
   Attr:Attr,
   Children:Children,
   El:El,
   ElKey:ElKey
  },(Runtime$1.SetOptional($1,"Delimiters",Delimiters),Runtime$1.SetOptional($1,"Render",Render),$1)));
 };
 An.get_UseAnimations=function()
 {
  return Anims.UseAnimations();
 };
 An.Play=function(anim)
 {
  var b;
  b=null;
  return Concurrency.Delay(function()
  {
   return Concurrency.Bind(An.Run(Global.ignore,Anims.Actions(anim)),function()
   {
    Anims.Finalize(anim);
    return Concurrency.Return(null);
   });
  });
 };
 An.Append=function(a,a$1)
 {
  return{
   $:0,
   $0:AppendList.Append(a.$0,a$1.$0)
  };
 };
 An.Run=function(k,anim)
 {
  var dur;
  function a(ok)
  {
   function loop(start)
   {
    return function(now)
    {
     var t;
     t=now-start;
     anim.Compute(t);
     k();
     return t<=dur?void Global.requestAnimationFrame(function(t$1)
     {
      (loop(start))(t$1);
     }):ok();
    };
   }
   Global.requestAnimationFrame(function(t)
   {
    (loop(t))(t);
   });
  }
  dur=anim.Duration;
  return dur===0?Concurrency.Zero():Concurrency.FromContinuations(function($1,$2,$3)
  {
   return a.apply(null,[$1,$2,$3]);
  });
 };
 An.Concat=function(xs)
 {
  return{
   $:0,
   $0:AppendList.Concat(Seq.map(Anims.List,xs))
  };
 };
 An.get_Empty=function()
 {
  return{
   $:0,
   $0:AppendList.Empty()
  };
 };
 Settings.BatchUpdatesEnabled=function()
 {
  SC$3.$cctor();
  return SC$3.BatchUpdatesEnabled;
 };
 Mailbox.StartProcessor=function(procAsync)
 {
  var st;
  function work()
  {
   var b;
   b=null;
   return Concurrency.Delay(function()
   {
    return Concurrency.Bind(procAsync,function()
    {
     var m;
     m=st[0];
     return m===1?(st[0]=0,Concurrency.Zero()):m===2?(st[0]=1,work()):Concurrency.Zero();
    });
   });
  }
  st=[0];
  return function()
  {
   var m;
   m=st[0];
   if(m===0)
    {
     st[0]=1;
     Concurrency.Start(work(),null);
    }
   else
    m===1?st[0]=2:void 0;
  };
 };
 FSharpMap=Collections.FSharpMap=Runtime$1.Class({
  Equals:function(other)
  {
   return this.get_Count()===other.get_Count()&&Seq.forall2(Unchecked.Equals,this,other);
  },
  get_IsEmpty:function()
  {
   return this.tree==null;
  },
  get_Count:function()
  {
   var tree;
   tree=this.tree;
   return tree==null?0:tree.Count;
  },
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kv)
   {
    return{
     K:kv.Key,
     V:kv.Value
    };
   },BalancedTree.Enumerate(false,this.tree)));
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(Arrays.ofSeq(this));
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  },
  CompareTo0:function(other)
  {
   return Seq.compareWith(Unchecked.Compare,this,other);
  }
 },Obj,FSharpMap);
 FSharpMap.New=Runtime$1.Ctor(function(s)
 {
  FSharpMap.New$1.call(this,MapUtil.fromSeq(s));
 },FSharpMap);
 FSharpMap.New$1=Runtime$1.Ctor(function(tree)
 {
  Obj.New.call(this);
  this.tree=tree;
 },FSharpMap);
 ArrayStorage=Storage.ArrayStorage=Runtime$1.Class({
  SSet:function(coll)
  {
   return Arrays.ofSeq(coll);
  },
  SRemoveIf:function(pred,arr)
  {
   return Arrays.filter(function(i)
   {
    return!pred(i);
   },arr);
  },
  SSetAt:function(idx,elem,arr)
  {
   Arrays.set(arr,idx,elem);
   return arr;
  },
  SAppend:function(i,arr)
  {
   arr.push(i);
   return arr;
  },
  SInit:function()
  {
   return this.init;
  }
 },Obj,ArrayStorage);
 ArrayStorage.New=Runtime$1.Ctor(function(init)
 {
  Obj.New.call(this);
  this.init=init;
 },ArrayStorage);
 Route.ParseHash=function(hash)
 {
  var hash$1,p,m,path;
  hash$1=Route.NoHash(hash);
  p=(m=hash$1.indexOf("?"),m===-1?[hash$1,""]:[Slice.string(hash$1,null,{
   $:1,
   $0:m-1
  }),Slice.string(hash$1,{
   $:1,
   $0:m+1
  },null)]);
  path=p[0];
  return{
   $:0,
   $0:AppendList.FromArray(path===""?[]:Arrays.map(function(x)
   {
    return Global.decodeURIComponent(x);
   },Strings.SplitChars(path,["/"],0))),
   $1:Map.OfArray(Arrays.map(function(s)
   {
    var m$1;
    m$1=s.indexOf("=");
    return m$1===-1?[Global.decodeURIComponent(s),""]:[Global.decodeURIComponent(Slice.string(s,null,{
     $:1,
     $0:m$1-1
    })),Global.decodeURIComponent(Slice.string(s,{
     $:1,
     $0:m$1+1
    },null))];
   },Strings.SplitChars(p[1],["&"],0)))
  };
 };
 Route.ToList=function(a)
 {
  return[List.ofArray(AppendList.ToArray(a.$0)),a.$1];
 };
 Route.MakeHash=function(a)
 {
  var query,path;
  query=a.$1;
  path=Strings.concat("/",Arrays.map(function(x)
  {
   return Global.encodeURIComponent(x);
  },AppendList.ToArray(a.$0)));
  return query.get_IsEmpty()?path:path+"?"+Strings.concat("&",Seq.map(function(a$1)
  {
   var a$2;
   a$2=Operators.KeyValue(a$1);
   return Global.encodeURIComponent(a$2[0])+"="+Global.encodeURIComponent(a$2[1]);
  },query));
 };
 Route.FromList=function(xs,q)
 {
  return{
   $:0,
   $0:AppendList.FromArray(Arrays.ofList(xs)),
   $1:q
  };
 };
 Route.SameHash=function(a,b)
 {
  return Route.NoHash(a)===Route.NoHash(b);
 };
 Route.NoHash=function(s)
 {
  return Strings.StartsWith(s,"#")?s.substring(1):s;
 };
 Fresh.Int=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return Fresh.counter();
 };
 Fresh.set_counter=function($1)
 {
  SC$6.$cctor();
  SC$6.counter=$1;
 };
 Fresh.counter=function()
 {
  SC$6.$cctor();
  return SC$6.counter;
 };
 Fresh.Id=function()
 {
  Fresh.set_counter(Fresh.counter()+1);
  return"uid"+Global.String(Fresh.counter());
 };
 attr=HtmlModule.attr=Runtime$1.Class({},Obj,attr);
 Snap.Obsolete=function(sn)
 {
  var $1,m,i,$2,o;
  m=sn.s;
  if(m==null||(m!=null&&m.$==2?($1=m.$1,false):m!=null&&m.$==3?($1=m.$1,false):true))
   void 0;
  else
   {
    sn.s=null;
    for(i=0,$2=Arrays.length($1)-1;i<=$2;i++){
     o=Arrays.get($1,i);
     if(typeof o=="object")
      (function(sn$1)
      {
       Snap.Obsolete(sn$1);
      }(o));
     else
      o();
    }
   }
 };
 Snap.New=function(State)
 {
  return{
   s:State
  };
 };
 Array.ofSeqNonCopying=function(xs)
 {
  var q,o;
  if(xs instanceof Global.Array)
   return xs;
  else
   if(xs instanceof T)
    return Arrays.ofList(xs);
   else
    if(xs===null)
     return[];
    else
     {
      q=[];
      o=Enumerator.Get(xs);
      try
      {
       while(o.MoveNext())
        q.push(o.Current());
       return q;
      }
      finally
      {
       if(typeof o=="object"&&"Dispose"in o)
        o.Dispose();
      }
     }
 };
 Array.TreeReduce=function(defaultValue,reduction,array)
 {
  var l;
  function loop(off)
  {
   return function(len)
   {
    var $1,l2;
    return len<=0?defaultValue:len===1&&(off>=0&&off<l)?Arrays.get(array,off):(l2=len/2>>0,reduction((loop(off))(l2),(loop(off+l2))(len-l2)));
   };
  }
  l=Arrays.length(array);
  return(loop(0))(l);
 };
 Array.mapInPlace=function(f,arr)
 {
  var i,$1;
  for(i=0,$1=arr.length-1;i<=$1;i++)arr[i]=f(arr[i]);
  return arr;
 };
 Array.MapTreeReduce=function(mapping,defaultValue,reduction,array)
 {
  var l;
  function loop(off)
  {
   return function(len)
   {
    var $1,l2;
    return len<=0?defaultValue:len===1&&(off>=0&&off<l)?mapping(Arrays.get(array,off)):(l2=len/2>>0,reduction((loop(off))(l2),(loop(off+l2))(len-l2)));
   };
  }
  l=Arrays.length(array);
  return(loop(0))(l);
 };
 TemplateInitializer.$cctor=function()
 {
  TemplateInitializer.$cctor=Global.ignore;
  TemplateInitializer.initialized=new Dictionary.New$5();
 };
 TemplateInitializer=Server.TemplateInitializer=Runtime$1.Class({},Obj,TemplateInitializer);
 TemplateInitializer.GetOrAddHoleFor=function(id,holeName,initHole)
 {
  var d,m,o,h;
  TemplateInitializer.$cctor();
  d=TemplateInitializer.GetHolesFor(id);
  m=(o=null,[d.TryGetValue(holeName,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?m[1]:(h=initHole(),(d.set_Item(holeName,h),h));
 };
 TemplateInitializer.GetHolesFor=function(id)
 {
  var m,o,d;
  TemplateInitializer.$cctor();
  m=(o=null,[TemplateInitializer.initialized.TryGetValue(id,{
   get:function()
   {
    return o;
   },
   set:function(v)
   {
    o=v;
   }
  }),o]);
  return m[0]?m[1]:(d=new Dictionary.New$5(),(TemplateInitializer.initialized.set_Item(id,d),d));
 };
 Dyn.New=function(DynElem,DynFlags,DynNodes,OnAfterRender)
 {
  var $1;
  $1={
   DynElem:DynElem,
   DynFlags:DynFlags,
   DynNodes:DynNodes
  };
  Runtime$1.SetOptional($1,"OnAfterRender",OnAfterRender);
  return $1;
 };
 RunState.New=function(PreviousNodes,Top)
 {
  return{
   PreviousNodes:PreviousNodes,
   Top:Top
  };
 };
 NodeSet.get_Empty=function()
 {
  return{
   $:0,
   $0:new HashSet.New$3()
  };
 };
 NodeSet.FindAll=function(doc)
 {
  var q;
  function recF(recI,$1)
  {
   var x,b,a,el,em;
   while(true)
    switch(recI)
    {
     case 0:
      if($1!=null&&$1.$==0)
       {
        b=$1.$1;
        a=$1.$0;
        recF(0,a);
        $1=b;
       }
      else
       if($1!=null&&$1.$==1)
        {
         el=$1.$0;
         $1=el;
         recI=1;
        }
       else
        if($1!=null&&$1.$==2)
         {
          em=$1.$0;
          $1=em.Current;
         }
        else
         return $1!=null&&$1.$==6?(x=$1.$0.Holes,(function(a$1)
         {
          return function(a$2)
          {
           Arrays.iter(a$1,a$2);
          };
         }(loopEN))(x)):null;
      break;
     case 1:
      q.push($1);
      $1=$1.Children;
      recI=0;
      break;
    }
  }
  function loop(node)
  {
   return recF(0,node);
  }
  function loopEN(el)
  {
   return recF(1,el);
  }
  q=[];
  loop(doc);
  return{
   $:0,
   $0:new HashSet.New$2(q)
  };
 };
 NodeSet.Filter=function(f,a)
 {
  return{
   $:0,
   $0:HashSet$1.Filter(f,a.$0)
  };
 };
 NodeSet.Except=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Except(a.$0,a$1.$0)
  };
 };
 NodeSet.ToArray=function(a)
 {
  return HashSet$1.ToArray(a.$0);
 };
 NodeSet.Intersect=function(a,a$1)
 {
  return{
   $:0,
   $0:HashSet$1.Intersect(a.$0,a$1.$0)
  };
 };
 Concurrency.Delay=function(mk)
 {
  return function(c)
  {
   try
   {
    (mk(null))(c);
   }
   catch(e)
   {
    c.k({
     $:1,
     $0:e
    });
   }
  };
 };
 Concurrency.Bind=function(r,f)
 {
  return Concurrency.checkCancel(function(c)
  {
   r(AsyncBody.New(function(a)
   {
    var x;
    if(a.$==0)
     {
      x=a.$0;
      Concurrency.scheduler().Fork(function()
      {
       try
       {
        (f(x))(c);
       }
       catch(e)
       {
        c.k({
         $:1,
         $0:e
        });
       }
      });
     }
    else
     Concurrency.scheduler().Fork(function()
     {
      c.k(a);
     });
   },c.ct));
  });
 };
 Concurrency.Zero=function()
 {
  SC$8.$cctor();
  return SC$8.Zero;
 };
 Concurrency.Start=function(c,ctOpt)
 {
  var ct,d;
  ct=(d=(Concurrency.defCTS())[0],ctOpt==null?d:ctOpt.$0);
  Concurrency.scheduler().Fork(function()
  {
   if(!ct.c)
    c(AsyncBody.New(function(a)
    {
     if(a.$==1)
      Concurrency.UncaughtAsyncError(a.$0);
    },ct));
  });
 };
 Concurrency.Return=function(x)
 {
  return function(c)
  {
   c.k({
    $:0,
    $0:x
   });
  };
 };
 Concurrency.scheduler=function()
 {
  SC$8.$cctor();
  return SC$8.scheduler;
 };
 Concurrency.checkCancel=function(r)
 {
  return function(c)
  {
   if(c.ct.c)
    Concurrency.cancel(c);
   else
    r(c);
  };
 };
 Concurrency.defCTS=function()
 {
  SC$8.$cctor();
  return SC$8.defCTS;
 };
 Concurrency.UncaughtAsyncError=function(e)
 {
  console.log("WebSharper: Uncaught asynchronous exception",e);
 };
 Concurrency.FromContinuations=function(subscribe)
 {
  return function(c)
  {
   var continued;
   function once(cont)
   {
    if(continued[0])
     Operators.FailWith("A continuation provided by Async.FromContinuations was invoked multiple times");
    else
     {
      continued[0]=true;
      Concurrency.scheduler().Fork(cont);
     }
   }
   continued=[false];
   subscribe(function(a)
   {
    once(function()
    {
     c.k({
      $:0,
      $0:a
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:1,
      $0:e
     });
    });
   },function(e)
   {
    once(function()
    {
     c.k({
      $:2,
      $0:e
     });
    });
   });
  };
 };
 Concurrency.cancel=function(c)
 {
  c.k({
   $:2,
   $0:new OperationCanceledException.New(c.ct)
  });
 };
 Anims.UseAnimations=function()
 {
  SC$5.$cctor();
  return SC$5.UseAnimations;
 };
 Anims.Actions=function(a)
 {
  return Anims.ConcatActions(Arrays.choose(function(a$1)
  {
   return a$1.$==1?{
    $:1,
    $0:a$1.$0
   }:null;
  },AppendList.ToArray(a.$0)));
 };
 Anims.Finalize=function(a)
 {
  Arrays.iter(function(a$1)
  {
   if(a$1.$==0)
    a$1.$0();
  },AppendList.ToArray(a.$0));
 };
 Anims.ConcatActions=function(xs)
 {
  var xs$1,m,dur,xs$2;
  xs$1=Array.ofSeqNonCopying(xs);
  m=Arrays.length(xs$1);
  return m===0?Anims.Const():m===1?Arrays.get(xs$1,0):(dur=Seq.max(Seq.map(function(anim)
  {
   return anim.Duration;
  },xs$1)),(xs$2=Arrays.map(function(a)
  {
   return Anims.Prolong(dur,a);
  },xs$1),Anims.Def(dur,function(t)
  {
   Arrays.iter(function(anim)
   {
    anim.Compute(t);
   },xs$2);
  })));
 };
 Anims.List=function(a)
 {
  return a.$0;
 };
 Anims.Const=function(v)
 {
  return Anims.Def(0,function()
  {
   return v;
  });
 };
 Anims.Def=function(d,f)
 {
  return{
   Compute:f,
   Duration:d
  };
 };
 Anims.Prolong=function(nextDuration,anim)
 {
  var comp,dur,last;
  comp=anim.Compute;
  dur=anim.Duration;
  last=Lazy.Create(function()
  {
   return anim.Compute(anim.Duration);
  });
  return{
   Compute:function(t)
   {
    return t>=dur?last.f():comp(t);
   },
   Duration:nextDuration
  };
 };
 SC$3.$cctor=function()
 {
  SC$3.$cctor=Global.ignore;
  SC$3.BatchUpdatesEnabled=true;
 };
 MapUtil.fromSeq=function(s)
 {
  var a;
  a=Arrays.ofSeq(Seq.map(function($1)
  {
   return Pair.New($1[0],$1[1]);
  },Seq.distinctBy(function(t)
  {
   return t[0];
  },Seq.rev(s))));
  Arrays.sortInPlace(a);
  return BalancedTree.Build(a,0,a.length-1);
 };
 AppendList.FromArray=function(xs)
 {
  var m;
  m=xs.length;
  return m===0?{
   $:0
  }:m===1?{
   $:1,
   $0:Arrays.get(xs,0)
  }:{
   $:3,
   $0:xs.slice()
  };
 };
 AppendList.ToArray=function(xs)
 {
  var out;
  function loop(xs$1)
  {
   var y,x;
   while(true)
    if(xs$1.$==1)
     return out.push(xs$1.$0);
    else
     if(xs$1.$==2)
      {
       y=xs$1.$1;
       x=xs$1.$0;
       loop(x);
       xs$1=y;
      }
     else
      return xs$1.$==3?Arrays.iter(function(v)
      {
       out.push(v);
      },xs$1.$0):null;
  }
  out=[];
  loop(xs);
  return out.slice(0);
 };
 AppendList.Append=function(x,y)
 {
  return x.$==0?y:y.$==0?x:{
   $:2,
   $0:x,
   $1:y
  };
 };
 AppendList.Concat=function(xs)
 {
  var x;
  x=Array.ofSeqNonCopying(xs);
  return Array.TreeReduce(AppendList.Empty(),AppendList.Append,x);
 };
 AppendList.Empty=function()
 {
  SC$9.$cctor();
  return SC$9.Empty;
 };
 DynamicAttrNode=UI.DynamicAttrNode=Runtime$1.Class({
  NGetExitAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetEnterAnim:function(parent)
  {
   return An.get_Empty();
  },
  NGetChangeAnim:function(parent)
  {
   return An.get_Empty();
  },
  NChanged:function()
  {
   return this.updates;
  },
  NSync:function(parent)
  {
   if(this.dirty)
    {
     (this.push(parent))(this.value);
     this.dirty=false;
    }
  }
 },Obj,DynamicAttrNode);
 DynamicAttrNode.New=Runtime$1.Ctor(function(view,push)
 {
  var $this;
  $this=this;
  Obj.New.call(this);
  this.push=push;
  this.value=void 0;
  this.dirty=false;
  this.updates=View.Map(function(x)
  {
   $this.value=x;
   $this.dirty=true;
  },view);
 },DynamicAttrNode);
 CheckedInput=UI.CheckedInput=Runtime$1.Class({
  get_Input:function()
  {
   return this.$==1?this.$0:this.$==2?this.$0:this.$1;
  }
 },null,CheckedInput);
 T$1=Enumerator.T=Runtime$1.Class({
  MoveNext:function()
  {
   return this.n(this);
  },
  Current:function()
  {
   return this.c;
  },
  Dispose:function()
  {
   if(this.d)
    this.d(this);
  }
 },Obj,T$1);
 T$1.New=Runtime$1.Ctor(function(s,c,n,d)
 {
  Obj.New.call(this);
  this.s=s;
  this.c=c;
  this.n=n;
  this.d=d;
 },T$1);
 BindVar.BoolCheckedApply=function()
 {
  SC$7.$cctor();
  return SC$7.BoolCheckedApply;
 };
 BindVar.StringApply=function()
 {
  SC$7.$cctor();
  return SC$7.StringApply;
 };
 BindVar.ApplyValue=function(get,set,_var,el,cb)
 {
  return[el(function(el$1)
  {
   function onChange()
   {
    _var.UpdateMaybe(function(v)
    {
     var m,$1;
     m=get(el$1);
     return m!=null&&m.$==1&&(!Unchecked.Equals(m.$0,v)&&($1=[m,m.$0],true))?$1[0]:null;
    });
   }
   el$1.addEventListener("change",onChange);
   el$1.addEventListener("input",onChange);
   el$1.addEventListener("keypress",onChange);
  }),cb(function(el$1)
  {
   return function(v)
   {
    var m,$1;
    m=get(el$1);
    return m!=null&&m.$==1&&(Unchecked.Equals(m.$0,v)&&($1=m.$0,true))?null:set(el$1,v);
   };
  })];
 };
 BindVar.StringSet=function()
 {
  SC$7.$cctor();
  return SC$7.StringSet;
 };
 BindVar.StringGet=function()
 {
  SC$7.$cctor();
  return SC$7.StringGet;
 };
 BindVar.IntSetUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntSetUnchecked;
 };
 BindVar.IntGetUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntGetUnchecked;
 };
 BindVar.IntSetChecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntSetChecked;
 };
 BindVar.IntGetChecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntGetChecked;
 };
 BindVar.FloatSetUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatSetUnchecked;
 };
 BindVar.FloatGetUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatGetUnchecked;
 };
 BindVar.FloatSetChecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatSetChecked;
 };
 BindVar.FloatGetChecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatGetChecked;
 };
 BindVar.IntApplyChecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntApplyChecked;
 };
 BindVar.IntApplyUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.IntApplyUnchecked;
 };
 BindVar.FloatApplyChecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatApplyChecked;
 };
 BindVar.FloatApplyUnchecked=function()
 {
  SC$7.$cctor();
  return SC$7.FloatApplyUnchecked;
 };
 Elt=UI.Elt=Runtime$1.Class({},Doc,Elt);
 Elt.New=function(el,attr$1,children)
 {
  var node,rvUpdates;
  node=Docs.CreateElemNode(el,attr$1,children.docNode);
  rvUpdates=Updates.Create(children.updates);
  return new Elt.New$1({
   $:1,
   $0:node
  },View.Map2Unit(Attrs.Updates(node.Attr),rvUpdates.v),el,rvUpdates);
 };
 Elt.TreeNode=function(tree,updates)
 {
  var rvUpdates,x;
  function f(t)
  {
   return t[1];
  }
  rvUpdates=Updates.Create(updates);
  return new Elt.New$1({
   $:6,
   $0:tree
  },View.Map2Unit((x=Arrays.map(function(x$1)
  {
   return Attrs.Updates(f(x$1));
  },tree.Attrs),Array.TreeReduce(View.Const(),View.Map2Unit,x)),rvUpdates.v),Arrays.get(tree.Els,0),rvUpdates);
 };
 Elt.New$1=Runtime$1.Ctor(function(docNode,updates,elt,rvUpdates)
 {
  Doc.New.call(this,docNode,updates);
  this.docNode$1=docNode;
  this.updates$1=updates;
  this.elt=elt;
  this.rvUpdates=rvUpdates;
 },Elt);
 SC$4.$cctor=function()
 {
  var table;
  SC$4.$cctor=Global.ignore;
  SC$4.rxhtmlTag=new Global.RegExp("<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\\w:]+)[^>]*)\\/>","gi");
  SC$4.rtagName=new Global.RegExp("<([\\w:]+)");
  SC$4.rhtml=new Global.RegExp("<|&#?\\w+;");
  SC$4.wrapMap=(table=[1,"<table>","</table>"],{
   option:[1,"<select multiple='multiple'>","</select>"],
   legend:[1,"<fieldset>","</fieldset>"],
   area:[1,"<map>","</map>"],
   param:[1,"<object>","</object>"],
   thead:table,
   tbody:table,
   tfoot:table,
   tr:[2,"<table><tbody>","</tbody></table>"],
   col:[2,"<table><colgroup>","</colgoup></table>"],
   td:[3,"<table><tbody><tr>","</tr></tbody></table>"]
  });
  SC$4.defaultWrap=[0,"",""];
 };
 SC$5.$cctor=function()
 {
  SC$5.$cctor=Global.ignore;
  SC$5.CubicInOut=Easing.Custom(function(t)
  {
   var t2;
   t2=t*t;
   return 3*t2-2*(t2*t);
  });
  SC$5.UseAnimations=true;
 };
 Tree.New=function(Node$1,Left,Right,Height,Count)
 {
  return{
   Node:Node$1,
   Left:Left,
   Right:Right,
   Height:Height,
   Count:Count
  };
 };
 Pair=Collections.Pair=Runtime$1.Class({
  Equals:function(other)
  {
   return Unchecked.Equals(this.Key,other.Key);
  },
  GetHashCode:function()
  {
   return Unchecked.Hash(this.Key);
  },
  CompareTo0:function(other)
  {
   return Unchecked.Compare(this.Key,other.Key);
  }
 },null,Pair);
 Pair.New=function(Key,Value)
 {
  return new Pair({
   Key:Key,
   Value:Value
  });
 };
 BalancedTree.OfSeq=function(data)
 {
  var a;
  a=Arrays.ofSeq(Seq.distinct(data));
  Arrays.sortInPlace(a);
  return BalancedTree.Build(a,0,a.length-1);
 };
 BalancedTree.Build=function(data,min,max)
 {
  var center,left,right;
  return max-min+1<=0?null:(center=(min+max)/2>>0,(left=BalancedTree.Build(data,min,center-1),(right=BalancedTree.Build(data,center+1,max),BalancedTree.Branch(Arrays.get(data,center),left,right))));
 };
 BalancedTree.Branch=function(node,left,right)
 {
  var a,b;
  return Tree.New(node,left,right,1+(a=left==null?0:left.Height,(b=right==null?0:right.Height,Unchecked.Compare(a,b)===1?a:b)),1+(left==null?0:left.Count)+(right==null?0:right.Count));
 };
 BalancedTree.Enumerate=function(flip,t)
 {
  function gen(t$1,spine)
  {
   var t$2;
   while(true)
    if(t$1==null)
     return spine.$==1?{
      $:1,
      $0:[spine.$0[0],[spine.$0[1],spine.$1]]
     }:null;
    else
     if(flip)
      {
       t$2=t$1;
       t$1=t$2.Right;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Left],
        $1:spine
       });
      }
     else
      {
       t$2=t$1;
       t$1=t$2.Left;
       spine=new T({
        $:1,
        $0:[t$2.Node,t$2.Right],
        $1:spine
       });
      }
  }
  return Seq.unfold(function($1)
  {
   return gen($1[0],$1[1]);
  },[t,T.Empty]);
 };
 SC$6.$cctor=function()
 {
  SC$6.$cctor=Global.ignore;
  SC$6.counter=0;
 };
 SC$7.$cctor=function()
 {
  var g,s,g$1,s$1,g$2,s$2,g$3,s$3,g$4,s$4;
  SC$7.$cctor=Global.ignore;
  SC$7.EmptyAttr=null;
  SC$7.BoolCheckedApply=Runtime$1.Curried3(function(_var,el,cb)
  {
   return[el(function(el$1)
   {
    el$1.addEventListener("change",function()
    {
     return!Unchecked.Equals(_var.Get(),el$1.checked)?_var.Set(el$1.checked):null;
    });
   }),cb(function(el$1)
   {
    return function(v)
    {
     el$1.checked=v;
    };
   })];
  });
  SC$7.StringSet=function(el)
  {
   return function(s$5)
   {
    el.value=s$5;
   };
  };
  SC$7.StringGet=function(el)
  {
   return{
    $:1,
    $0:el.value
   };
  };
  SC$7.StringApply=(g=BindVar.StringGet(),(s=BindVar.StringSet(),Runtime$1.Curried(BindVar.ApplyValue,3,[g,function($1,$2)
  {
   return(s($1))($2);
  }])));
  SC$7.IntSetUnchecked=function(el)
  {
   return function(i)
   {
    el.value=Global.String(i);
   };
  };
  SC$7.IntGetUnchecked=function(el)
  {
   var s$5,pd;
   s$5=el.value;
   return String.isBlank(s$5)?{
    $:1,
    $0:0
   }:(pd=+s$5,pd!==pd>>0?null:{
    $:1,
    $0:pd
   });
  };
  SC$7.IntApplyUnchecked=(g$1=BindVar.IntGetUnchecked(),(s$1=BindVar.IntSetUnchecked(),Runtime$1.Curried(BindVar.ApplyValue,3,[g$1,function($1,$2)
  {
   return(s$1($1))($2);
  }])));
  SC$7.IntSetChecked=function(el)
  {
   return function(i)
   {
    var i$1;
    i$1=i.get_Input();
    return el.value!==i$1?void(el.value=i$1):null;
   };
  };
  SC$7.IntGetChecked=function(el)
  {
   var s$5,m,o;
   s$5=el.value;
   return{
    $:1,
    $0:String.isBlank(s$5)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s$5
    }):new CheckedInput({
     $:1,
     $0:s$5
    }):(m=(o=0,[Numeric.TryParseInt32(s$5,{
     get:function()
     {
      return o;
     },
     set:function(v)
     {
      o=v;
     }
    }),o]),m[0]?new CheckedInput({
     $:0,
     $0:m[1],
     $1:s$5
    }):new CheckedInput({
     $:1,
     $0:s$5
    }))
   };
  };
  SC$7.IntApplyChecked=(g$2=BindVar.IntGetChecked(),(s$2=BindVar.IntSetChecked(),Runtime$1.Curried(BindVar.ApplyValue,3,[g$2,function($1,$2)
  {
   return(s$2($1))($2);
  }])));
  SC$7.FloatSetUnchecked=function(el)
  {
   return function(i)
   {
    el.value=Global.String(i);
   };
  };
  SC$7.FloatGetUnchecked=function(el)
  {
   var s$5,pd;
   s$5=el.value;
   return String.isBlank(s$5)?{
    $:1,
    $0:0
   }:(pd=+s$5,Global.isNaN(pd)?null:{
    $:1,
    $0:pd
   });
  };
  SC$7.FloatApplyUnchecked=(g$3=BindVar.FloatGetUnchecked(),(s$3=BindVar.FloatSetUnchecked(),Runtime$1.Curried(BindVar.ApplyValue,3,[g$3,function($1,$2)
  {
   return(s$3($1))($2);
  }])));
  SC$7.FloatSetChecked=function(el)
  {
   return function(i)
   {
    var i$1;
    i$1=i.get_Input();
    return el.value!==i$1?void(el.value=i$1):null;
   };
  };
  SC$7.FloatGetChecked=function(el)
  {
   var s$5,i;
   s$5=el.value;
   return{
    $:1,
    $0:String.isBlank(s$5)?(el.checkValidity?el.checkValidity():true)?new CheckedInput({
     $:2,
     $0:s$5
    }):new CheckedInput({
     $:1,
     $0:s$5
    }):(i=+s$5,Global.isNaN(i)?new CheckedInput({
     $:1,
     $0:s$5
    }):new CheckedInput({
     $:0,
     $0:i,
     $1:s$5
    }))
   };
  };
  SC$7.FloatApplyChecked=(g$4=BindVar.FloatGetChecked(),(s$4=BindVar.FloatSetChecked(),Runtime$1.Curried(BindVar.ApplyValue,3,[g$4,function($1,$2)
  {
   return(s$4($1))($2);
  }])));
 };
 Updates=UI.Updates=Runtime$1.Class({},null,Updates);
 Updates.Create=function(v)
 {
  var _var;
  _var=null;
  _var=Updates.New(v,null,function()
  {
   var c;
   c=_var.s;
   return c===null?(c=Snap.Copy(_var.c()),_var.s=c,Snap.WhenObsoleteRun(c,function()
   {
    _var.s=null;
   }),c):c;
  });
  return _var;
 };
 Updates.New=function(Current,Snap$1,VarView)
 {
  return new Updates({
   c:Current,
   s:Snap$1,
   v:VarView
  });
 };
 HashSetUtil.concat=function(o)
 {
  var r,k;
  r=[];
  for(var k$1 in o)r.push.apply(r,o[k$1]);
  return r;
 };
 Scheduler=Concurrency.Scheduler=Runtime$1.Class({
  Fork:function(action)
  {
   var $this;
   $this=this;
   this.robin.push(action);
   if(this.idle)
    {
     this.idle=false;
     Global.setTimeout(function()
     {
      $this.tick();
     },0);
    }
  },
  tick:function()
  {
   var loop,$this,t;
   $this=this;
   t=Date.now();
   loop=true;
   while(loop)
    if(this.robin.length===0)
     {
      this.idle=true;
      loop=false;
     }
    else
     {
      (this.robin.shift())();
      Date.now()-t>40?(Global.setTimeout(function()
      {
       $this.tick();
      },0),loop=false):void 0;
     }
  }
 },Obj,Scheduler);
 Scheduler.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
  this.idle=true;
  this.robin=[];
 },Scheduler);
 Easing=UI.Easing=Runtime$1.Class({},Obj,Easing);
 Easing.Custom=function(f)
 {
  return new Easing.New(f);
 };
 Easing.New=Runtime$1.Ctor(function(transformTime)
 {
  Obj.New.call(this);
  this.transformTime=transformTime;
 },Easing);
 AsyncBody.New=function(k,ct)
 {
  return{
   k:k,
   ct:ct
  };
 };
 SC$8.$cctor=function()
 {
  SC$8.$cctor=Global.ignore;
  SC$8.noneCT=CT.New(false,[]);
  SC$8.scheduler=new Scheduler.New();
  SC$8.defCTS=[new CancellationTokenSource.New()];
  SC$8.Zero=Concurrency.Return();
  SC$8.GetCT=function(c)
  {
   c.k({
    $:0,
    $0:c.ct
   });
  };
 };
 CT.New=function(IsCancellationRequested,Registrations)
 {
  return{
   c:IsCancellationRequested,
   r:Registrations
  };
 };
 HashSet$1.Filter=function(ok,set)
 {
  return new HashSet.New$2(Arrays.filter(ok,HashSet$1.ToArray(set)));
 };
 HashSet$1.Except=function(excluded,included)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(included));
  set.ExceptWith(HashSet$1.ToArray(excluded));
  return set;
 };
 HashSet$1.ToArray=function(set)
 {
  var arr;
  arr=Arrays.create(set.get_Count(),void 0);
  set.CopyTo(arr);
  return arr;
 };
 HashSet$1.Intersect=function(a,b)
 {
  var set;
  set=new HashSet.New$2(HashSet$1.ToArray(a));
  set.IntersectWith(HashSet$1.ToArray(b));
  return set;
 };
 Queue.Clear=function(a)
 {
  a.splice(0,Arrays.length(a));
 };
 String.isBlank=function(s)
 {
  return Strings.forall(Char.IsWhiteSpace,s);
 };
 CancellationTokenSource=WebSharper.CancellationTokenSource=Runtime$1.Class({},Obj,CancellationTokenSource);
 CancellationTokenSource.New=Runtime$1.Ctor(function()
 {
  Obj.New.call(this);
  this.c=false;
  this.pending=null;
  this.r=[];
  this.init=1;
 },CancellationTokenSource);
 DomNodes.Children=function(elem,delims)
 {
  var n,o,a;
  if(delims!=null&&delims.$==1)
   {
    a=[];
    n=delims.$0[0].nextSibling;
    while(n!==delims.$0[1])
     {
      a.push(n);
      n=n.nextSibling;
     }
    return{
     $:0,
     $0:a
    };
   }
  else
   return{
    $:0,
    $0:Arrays.init(elem.childNodes.length,(o=elem.childNodes,function(a$1)
    {
     return o[a$1];
    }))
   };
 };
 DomNodes.Except=function(a,a$1)
 {
  var excluded;
  excluded=a.$0;
  return{
   $:0,
   $0:Arrays.filter(function(n)
   {
    return Arrays.forall(function(k)
    {
     return!(n===k);
    },excluded);
   },a$1.$0)
  };
 };
 DomNodes.Iter=function(f,a)
 {
  Arrays.iter(f,a.$0);
 };
 DomNodes.DocChildren=function(node)
 {
  var q;
  function loop(doc)
  {
   var x,d,b,a;
   while(true)
    {
     if(doc!=null&&doc.$==2)
      {
       d=doc.$0;
       doc=d.Current;
      }
     else
      if(doc!=null&&doc.$==1)
       return q.push(doc.$0.El);
      else
       if(doc==null)
        return null;
       else
        if(doc!=null&&doc.$==5)
         return q.push(doc.$0);
        else
         if(doc!=null&&doc.$==4)
          return q.push(doc.$0.Text);
         else
          if(doc!=null&&doc.$==6)
           {
            x=doc.$0.Els;
            return(function(a$1)
            {
             return function(a$2)
             {
              Arrays.iter(a$1,a$2);
             };
            }(function(a$1)
            {
             if(a$1==null||a$1.constructor===Object)
              loop(a$1);
             else
              q.push(a$1);
            }))(x);
           }
          else
           {
            b=doc.$1;
            a=doc.$0;
            loop(a);
            doc=b;
           }
    }
  }
  q=[];
  loop(node.Children);
  return{
   $:0,
   $0:Array.ofSeqNonCopying(q)
  };
 };
 Char.IsWhiteSpace=function(c)
 {
  return c.match(new Global.RegExp("\\s"))!==null;
 };
 Numeric.TryParse=function(s,min,max,r)
 {
  var x,ok;
  x=+s;
  ok=x===x-x%1&&x>=min&&x<=max;
  if(ok)
   r.set(x);
  return ok;
 };
 ValueCollection=Collections.ValueCollection=Runtime$1.Class({
  GetEnumerator$1:function()
  {
   return Enumerator.Get(Seq.map(function(kvp)
   {
    return kvp.V;
   },this.d));
  },
  GetEnumerator:function()
  {
   return this.GetEnumerator$1();
  },
  GetEnumerator0:function()
  {
   return this.GetEnumerator$1();
  }
 },Obj,ValueCollection);
 ValueCollection.New=Runtime$1.Ctor(function(d)
 {
  Obj.New.call(this);
  this.d=d;
 },ValueCollection);
 OperationCanceledException=WebSharper.OperationCanceledException=Runtime$1.Class({},Error,OperationCanceledException);
 OperationCanceledException.New=Runtime$1.Ctor(function(ct)
 {
  OperationCanceledException.New$1.call(this,"The operation was canceled.",null,ct);
 },OperationCanceledException);
 OperationCanceledException.New$1=Runtime$1.Ctor(function(message,inner,ct)
 {
  this.message=message;
  this.inner=inner;
  Object.setPrototypeOf(this,OperationCanceledException.prototype);
  this.ct=ct;
 },OperationCanceledException);
 Lazy.Create=function(f)
 {
  return LazyRecord.New(false,f,Lazy.forceLazy);
 };
 Lazy.forceLazy=function()
 {
  var v;
  v=this.v();
  this.c=true;
  this.v=v;
  this.f=Lazy.cachedLazy;
  return v;
 };
 Lazy.cachedLazy=function()
 {
  return this.v;
 };
 SC$9.$cctor=function()
 {
  SC$9.$cctor=Global.ignore;
  SC$9.Empty={
   $:0
  };
 };
 LazyRecord.New=function(created,evalOrVal,force)
 {
  return{
   c:created,
   v:evalOrVal,
   f:force
  };
 };
 Runtime$1.OnLoad(function()
 {
  Client.Main();
 });
}(self));


if (typeof IntelliFactory !=='undefined') {
  IntelliFactory.Runtime.ScriptBasePath = '/Content/';
  IntelliFactory.Runtime.Start();
}
