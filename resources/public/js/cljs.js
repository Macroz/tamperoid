var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6418__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6418 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6418__delegate.call(this, array, i, idxs)
    };
    G__6418.cljs$lang$maxFixedArity = 2;
    G__6418.cljs$lang$applyTo = function(arglist__6419) {
      var array = cljs.core.first(arglist__6419);
      var i = cljs.core.first(cljs.core.next(arglist__6419));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6419));
      return G__6418__delegate(array, i, idxs)
    };
    G__6418.cljs$lang$arity$variadic = G__6418__delegate;
    return G__6418
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3546__auto____6420 = this$;
      if(and__3546__auto____6420) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3546__auto____6420
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3548__auto____6421 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6421) {
          return or__3548__auto____6421
        }else {
          var or__3548__auto____6422 = cljs.core._invoke["_"];
          if(or__3548__auto____6422) {
            return or__3548__auto____6422
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3546__auto____6423 = this$;
      if(and__3546__auto____6423) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3546__auto____6423
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3548__auto____6424 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6424) {
          return or__3548__auto____6424
        }else {
          var or__3548__auto____6425 = cljs.core._invoke["_"];
          if(or__3548__auto____6425) {
            return or__3548__auto____6425
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3546__auto____6426 = this$;
      if(and__3546__auto____6426) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3546__auto____6426
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3548__auto____6427 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6427) {
          return or__3548__auto____6427
        }else {
          var or__3548__auto____6428 = cljs.core._invoke["_"];
          if(or__3548__auto____6428) {
            return or__3548__auto____6428
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3546__auto____6429 = this$;
      if(and__3546__auto____6429) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3546__auto____6429
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3548__auto____6430 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6430) {
          return or__3548__auto____6430
        }else {
          var or__3548__auto____6431 = cljs.core._invoke["_"];
          if(or__3548__auto____6431) {
            return or__3548__auto____6431
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3546__auto____6432 = this$;
      if(and__3546__auto____6432) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3546__auto____6432
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3548__auto____6433 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6433) {
          return or__3548__auto____6433
        }else {
          var or__3548__auto____6434 = cljs.core._invoke["_"];
          if(or__3548__auto____6434) {
            return or__3548__auto____6434
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3546__auto____6435 = this$;
      if(and__3546__auto____6435) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3546__auto____6435
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3548__auto____6436 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6436) {
          return or__3548__auto____6436
        }else {
          var or__3548__auto____6437 = cljs.core._invoke["_"];
          if(or__3548__auto____6437) {
            return or__3548__auto____6437
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3546__auto____6438 = this$;
      if(and__3546__auto____6438) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3546__auto____6438
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3548__auto____6439 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6439) {
          return or__3548__auto____6439
        }else {
          var or__3548__auto____6440 = cljs.core._invoke["_"];
          if(or__3548__auto____6440) {
            return or__3548__auto____6440
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3546__auto____6441 = this$;
      if(and__3546__auto____6441) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3546__auto____6441
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3548__auto____6442 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6442) {
          return or__3548__auto____6442
        }else {
          var or__3548__auto____6443 = cljs.core._invoke["_"];
          if(or__3548__auto____6443) {
            return or__3548__auto____6443
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3546__auto____6444 = this$;
      if(and__3546__auto____6444) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3546__auto____6444
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3548__auto____6445 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6445) {
          return or__3548__auto____6445
        }else {
          var or__3548__auto____6446 = cljs.core._invoke["_"];
          if(or__3548__auto____6446) {
            return or__3548__auto____6446
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3546__auto____6447 = this$;
      if(and__3546__auto____6447) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3546__auto____6447
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3548__auto____6448 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6448) {
          return or__3548__auto____6448
        }else {
          var or__3548__auto____6449 = cljs.core._invoke["_"];
          if(or__3548__auto____6449) {
            return or__3548__auto____6449
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3546__auto____6450 = this$;
      if(and__3546__auto____6450) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3546__auto____6450
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3548__auto____6451 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6451) {
          return or__3548__auto____6451
        }else {
          var or__3548__auto____6452 = cljs.core._invoke["_"];
          if(or__3548__auto____6452) {
            return or__3548__auto____6452
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3546__auto____6453 = this$;
      if(and__3546__auto____6453) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3546__auto____6453
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3548__auto____6454 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6454) {
          return or__3548__auto____6454
        }else {
          var or__3548__auto____6455 = cljs.core._invoke["_"];
          if(or__3548__auto____6455) {
            return or__3548__auto____6455
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3546__auto____6456 = this$;
      if(and__3546__auto____6456) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3546__auto____6456
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3548__auto____6457 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6457) {
          return or__3548__auto____6457
        }else {
          var or__3548__auto____6458 = cljs.core._invoke["_"];
          if(or__3548__auto____6458) {
            return or__3548__auto____6458
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3546__auto____6459 = this$;
      if(and__3546__auto____6459) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3546__auto____6459
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3548__auto____6460 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6460) {
          return or__3548__auto____6460
        }else {
          var or__3548__auto____6461 = cljs.core._invoke["_"];
          if(or__3548__auto____6461) {
            return or__3548__auto____6461
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3546__auto____6462 = this$;
      if(and__3546__auto____6462) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3546__auto____6462
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3548__auto____6463 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6463) {
          return or__3548__auto____6463
        }else {
          var or__3548__auto____6464 = cljs.core._invoke["_"];
          if(or__3548__auto____6464) {
            return or__3548__auto____6464
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3546__auto____6465 = this$;
      if(and__3546__auto____6465) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3546__auto____6465
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3548__auto____6466 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6466) {
          return or__3548__auto____6466
        }else {
          var or__3548__auto____6467 = cljs.core._invoke["_"];
          if(or__3548__auto____6467) {
            return or__3548__auto____6467
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3546__auto____6468 = this$;
      if(and__3546__auto____6468) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3546__auto____6468
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3548__auto____6469 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6469) {
          return or__3548__auto____6469
        }else {
          var or__3548__auto____6470 = cljs.core._invoke["_"];
          if(or__3548__auto____6470) {
            return or__3548__auto____6470
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3546__auto____6471 = this$;
      if(and__3546__auto____6471) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3546__auto____6471
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3548__auto____6472 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6472) {
          return or__3548__auto____6472
        }else {
          var or__3548__auto____6473 = cljs.core._invoke["_"];
          if(or__3548__auto____6473) {
            return or__3548__auto____6473
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3546__auto____6474 = this$;
      if(and__3546__auto____6474) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3546__auto____6474
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3548__auto____6475 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6475) {
          return or__3548__auto____6475
        }else {
          var or__3548__auto____6476 = cljs.core._invoke["_"];
          if(or__3548__auto____6476) {
            return or__3548__auto____6476
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3546__auto____6477 = this$;
      if(and__3546__auto____6477) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3546__auto____6477
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3548__auto____6478 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6478) {
          return or__3548__auto____6478
        }else {
          var or__3548__auto____6479 = cljs.core._invoke["_"];
          if(or__3548__auto____6479) {
            return or__3548__auto____6479
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3546__auto____6480 = this$;
      if(and__3546__auto____6480) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3546__auto____6480
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3548__auto____6481 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3548__auto____6481) {
          return or__3548__auto____6481
        }else {
          var or__3548__auto____6482 = cljs.core._invoke["_"];
          if(or__3548__auto____6482) {
            return or__3548__auto____6482
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3546__auto____6483 = coll;
    if(and__3546__auto____6483) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3546__auto____6483
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6484 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6484) {
        return or__3548__auto____6484
      }else {
        var or__3548__auto____6485 = cljs.core._count["_"];
        if(or__3548__auto____6485) {
          return or__3548__auto____6485
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3546__auto____6486 = coll;
    if(and__3546__auto____6486) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3546__auto____6486
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6487 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6487) {
        return or__3548__auto____6487
      }else {
        var or__3548__auto____6488 = cljs.core._empty["_"];
        if(or__3548__auto____6488) {
          return or__3548__auto____6488
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3546__auto____6489 = coll;
    if(and__3546__auto____6489) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3546__auto____6489
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3548__auto____6490 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6490) {
        return or__3548__auto____6490
      }else {
        var or__3548__auto____6491 = cljs.core._conj["_"];
        if(or__3548__auto____6491) {
          return or__3548__auto____6491
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3546__auto____6492 = coll;
      if(and__3546__auto____6492) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3546__auto____6492
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3548__auto____6493 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____6493) {
          return or__3548__auto____6493
        }else {
          var or__3548__auto____6494 = cljs.core._nth["_"];
          if(or__3548__auto____6494) {
            return or__3548__auto____6494
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3546__auto____6495 = coll;
      if(and__3546__auto____6495) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3546__auto____6495
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3548__auto____6496 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3548__auto____6496) {
          return or__3548__auto____6496
        }else {
          var or__3548__auto____6497 = cljs.core._nth["_"];
          if(or__3548__auto____6497) {
            return or__3548__auto____6497
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3546__auto____6498 = coll;
    if(and__3546__auto____6498) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3546__auto____6498
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6499 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6499) {
        return or__3548__auto____6499
      }else {
        var or__3548__auto____6500 = cljs.core._first["_"];
        if(or__3548__auto____6500) {
          return or__3548__auto____6500
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3546__auto____6501 = coll;
    if(and__3546__auto____6501) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3546__auto____6501
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6502 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6502) {
        return or__3548__auto____6502
      }else {
        var or__3548__auto____6503 = cljs.core._rest["_"];
        if(or__3548__auto____6503) {
          return or__3548__auto____6503
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3546__auto____6504 = o;
      if(and__3546__auto____6504) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3546__auto____6504
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3548__auto____6505 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____6505) {
          return or__3548__auto____6505
        }else {
          var or__3548__auto____6506 = cljs.core._lookup["_"];
          if(or__3548__auto____6506) {
            return or__3548__auto____6506
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3546__auto____6507 = o;
      if(and__3546__auto____6507) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3546__auto____6507
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3548__auto____6508 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3548__auto____6508) {
          return or__3548__auto____6508
        }else {
          var or__3548__auto____6509 = cljs.core._lookup["_"];
          if(or__3548__auto____6509) {
            return or__3548__auto____6509
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3546__auto____6510 = coll;
    if(and__3546__auto____6510) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3546__auto____6510
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____6511 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6511) {
        return or__3548__auto____6511
      }else {
        var or__3548__auto____6512 = cljs.core._contains_key_QMARK_["_"];
        if(or__3548__auto____6512) {
          return or__3548__auto____6512
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3546__auto____6513 = coll;
    if(and__3546__auto____6513) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3546__auto____6513
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3548__auto____6514 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6514) {
        return or__3548__auto____6514
      }else {
        var or__3548__auto____6515 = cljs.core._assoc["_"];
        if(or__3548__auto____6515) {
          return or__3548__auto____6515
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3546__auto____6516 = coll;
    if(and__3546__auto____6516) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3546__auto____6516
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3548__auto____6517 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6517) {
        return or__3548__auto____6517
      }else {
        var or__3548__auto____6518 = cljs.core._dissoc["_"];
        if(or__3548__auto____6518) {
          return or__3548__auto____6518
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3546__auto____6519 = coll;
    if(and__3546__auto____6519) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3546__auto____6519
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6520 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6520) {
        return or__3548__auto____6520
      }else {
        var or__3548__auto____6521 = cljs.core._key["_"];
        if(or__3548__auto____6521) {
          return or__3548__auto____6521
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3546__auto____6522 = coll;
    if(and__3546__auto____6522) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3546__auto____6522
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6523 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6523) {
        return or__3548__auto____6523
      }else {
        var or__3548__auto____6524 = cljs.core._val["_"];
        if(or__3548__auto____6524) {
          return or__3548__auto____6524
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3546__auto____6525 = coll;
    if(and__3546__auto____6525) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3546__auto____6525
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3548__auto____6526 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6526) {
        return or__3548__auto____6526
      }else {
        var or__3548__auto____6527 = cljs.core._disjoin["_"];
        if(or__3548__auto____6527) {
          return or__3548__auto____6527
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3546__auto____6528 = coll;
    if(and__3546__auto____6528) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3546__auto____6528
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6529 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6529) {
        return or__3548__auto____6529
      }else {
        var or__3548__auto____6530 = cljs.core._peek["_"];
        if(or__3548__auto____6530) {
          return or__3548__auto____6530
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3546__auto____6531 = coll;
    if(and__3546__auto____6531) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3546__auto____6531
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6532 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6532) {
        return or__3548__auto____6532
      }else {
        var or__3548__auto____6533 = cljs.core._pop["_"];
        if(or__3548__auto____6533) {
          return or__3548__auto____6533
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3546__auto____6534 = coll;
    if(and__3546__auto____6534) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3546__auto____6534
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3548__auto____6535 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6535) {
        return or__3548__auto____6535
      }else {
        var or__3548__auto____6536 = cljs.core._assoc_n["_"];
        if(or__3548__auto____6536) {
          return or__3548__auto____6536
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3546__auto____6537 = o;
    if(and__3546__auto____6537) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3546__auto____6537
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____6538 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3548__auto____6538) {
        return or__3548__auto____6538
      }else {
        var or__3548__auto____6539 = cljs.core._deref["_"];
        if(or__3548__auto____6539) {
          return or__3548__auto____6539
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3546__auto____6540 = o;
    if(and__3546__auto____6540) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3546__auto____6540
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3548__auto____6541 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3548__auto____6541) {
        return or__3548__auto____6541
      }else {
        var or__3548__auto____6542 = cljs.core._deref_with_timeout["_"];
        if(or__3548__auto____6542) {
          return or__3548__auto____6542
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3546__auto____6543 = o;
    if(and__3546__auto____6543) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3546__auto____6543
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____6544 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____6544) {
        return or__3548__auto____6544
      }else {
        var or__3548__auto____6545 = cljs.core._meta["_"];
        if(or__3548__auto____6545) {
          return or__3548__auto____6545
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3546__auto____6546 = o;
    if(and__3546__auto____6546) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3546__auto____6546
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3548__auto____6547 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3548__auto____6547) {
        return or__3548__auto____6547
      }else {
        var or__3548__auto____6548 = cljs.core._with_meta["_"];
        if(or__3548__auto____6548) {
          return or__3548__auto____6548
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3546__auto____6549 = coll;
      if(and__3546__auto____6549) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3546__auto____6549
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3548__auto____6550 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____6550) {
          return or__3548__auto____6550
        }else {
          var or__3548__auto____6551 = cljs.core._reduce["_"];
          if(or__3548__auto____6551) {
            return or__3548__auto____6551
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3546__auto____6552 = coll;
      if(and__3546__auto____6552) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3546__auto____6552
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3548__auto____6553 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3548__auto____6553) {
          return or__3548__auto____6553
        }else {
          var or__3548__auto____6554 = cljs.core._reduce["_"];
          if(or__3548__auto____6554) {
            return or__3548__auto____6554
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3546__auto____6555 = coll;
    if(and__3546__auto____6555) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3546__auto____6555
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3548__auto____6556 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6556) {
        return or__3548__auto____6556
      }else {
        var or__3548__auto____6557 = cljs.core._kv_reduce["_"];
        if(or__3548__auto____6557) {
          return or__3548__auto____6557
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3546__auto____6558 = o;
    if(and__3546__auto____6558) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3546__auto____6558
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3548__auto____6559 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3548__auto____6559) {
        return or__3548__auto____6559
      }else {
        var or__3548__auto____6560 = cljs.core._equiv["_"];
        if(or__3548__auto____6560) {
          return or__3548__auto____6560
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3546__auto____6561 = o;
    if(and__3546__auto____6561) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3546__auto____6561
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____6562 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3548__auto____6562) {
        return or__3548__auto____6562
      }else {
        var or__3548__auto____6563 = cljs.core._hash["_"];
        if(or__3548__auto____6563) {
          return or__3548__auto____6563
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3546__auto____6564 = o;
    if(and__3546__auto____6564) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3546__auto____6564
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3548__auto____6565 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____6565) {
        return or__3548__auto____6565
      }else {
        var or__3548__auto____6566 = cljs.core._seq["_"];
        if(or__3548__auto____6566) {
          return or__3548__auto____6566
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3546__auto____6567 = coll;
    if(and__3546__auto____6567) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3546__auto____6567
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6568 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6568) {
        return or__3548__auto____6568
      }else {
        var or__3548__auto____6569 = cljs.core._rseq["_"];
        if(or__3548__auto____6569) {
          return or__3548__auto____6569
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____6570 = coll;
    if(and__3546__auto____6570) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3546__auto____6570
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____6571 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6571) {
        return or__3548__auto____6571
      }else {
        var or__3548__auto____6572 = cljs.core._sorted_seq["_"];
        if(or__3548__auto____6572) {
          return or__3548__auto____6572
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3546__auto____6573 = coll;
    if(and__3546__auto____6573) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3546__auto____6573
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3548__auto____6574 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6574) {
        return or__3548__auto____6574
      }else {
        var or__3548__auto____6575 = cljs.core._sorted_seq_from["_"];
        if(or__3548__auto____6575) {
          return or__3548__auto____6575
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3546__auto____6576 = coll;
    if(and__3546__auto____6576) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3546__auto____6576
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3548__auto____6577 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6577) {
        return or__3548__auto____6577
      }else {
        var or__3548__auto____6578 = cljs.core._entry_key["_"];
        if(or__3548__auto____6578) {
          return or__3548__auto____6578
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3546__auto____6579 = coll;
    if(and__3546__auto____6579) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3546__auto____6579
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6580 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6580) {
        return or__3548__auto____6580
      }else {
        var or__3548__auto____6581 = cljs.core._comparator["_"];
        if(or__3548__auto____6581) {
          return or__3548__auto____6581
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3546__auto____6582 = o;
    if(and__3546__auto____6582) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3546__auto____6582
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3548__auto____6583 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3548__auto____6583) {
        return or__3548__auto____6583
      }else {
        var or__3548__auto____6584 = cljs.core._pr_seq["_"];
        if(or__3548__auto____6584) {
          return or__3548__auto____6584
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3546__auto____6585 = d;
    if(and__3546__auto____6585) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3546__auto____6585
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3548__auto____6586 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3548__auto____6586) {
        return or__3548__auto____6586
      }else {
        var or__3548__auto____6587 = cljs.core._realized_QMARK_["_"];
        if(or__3548__auto____6587) {
          return or__3548__auto____6587
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3546__auto____6588 = this$;
    if(and__3546__auto____6588) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3546__auto____6588
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3548__auto____6589 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3548__auto____6589) {
        return or__3548__auto____6589
      }else {
        var or__3548__auto____6590 = cljs.core._notify_watches["_"];
        if(or__3548__auto____6590) {
          return or__3548__auto____6590
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3546__auto____6591 = this$;
    if(and__3546__auto____6591) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3546__auto____6591
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3548__auto____6592 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____6592) {
        return or__3548__auto____6592
      }else {
        var or__3548__auto____6593 = cljs.core._add_watch["_"];
        if(or__3548__auto____6593) {
          return or__3548__auto____6593
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3546__auto____6594 = this$;
    if(and__3546__auto____6594) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3546__auto____6594
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3548__auto____6595 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3548__auto____6595) {
        return or__3548__auto____6595
      }else {
        var or__3548__auto____6596 = cljs.core._remove_watch["_"];
        if(or__3548__auto____6596) {
          return or__3548__auto____6596
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3546__auto____6597 = coll;
    if(and__3546__auto____6597) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3546__auto____6597
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3548__auto____6598 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3548__auto____6598) {
        return or__3548__auto____6598
      }else {
        var or__3548__auto____6599 = cljs.core._as_transient["_"];
        if(or__3548__auto____6599) {
          return or__3548__auto____6599
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3546__auto____6600 = tcoll;
    if(and__3546__auto____6600) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3546__auto____6600
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3548__auto____6601 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6601) {
        return or__3548__auto____6601
      }else {
        var or__3548__auto____6602 = cljs.core._conj_BANG_["_"];
        if(or__3548__auto____6602) {
          return or__3548__auto____6602
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____6603 = tcoll;
    if(and__3546__auto____6603) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3546__auto____6603
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____6604 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6604) {
        return or__3548__auto____6604
      }else {
        var or__3548__auto____6605 = cljs.core._persistent_BANG_["_"];
        if(or__3548__auto____6605) {
          return or__3548__auto____6605
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3546__auto____6606 = tcoll;
    if(and__3546__auto____6606) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3546__auto____6606
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3548__auto____6607 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6607) {
        return or__3548__auto____6607
      }else {
        var or__3548__auto____6608 = cljs.core._assoc_BANG_["_"];
        if(or__3548__auto____6608) {
          return or__3548__auto____6608
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3546__auto____6609 = tcoll;
    if(and__3546__auto____6609) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3546__auto____6609
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3548__auto____6610 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6610) {
        return or__3548__auto____6610
      }else {
        var or__3548__auto____6611 = cljs.core._dissoc_BANG_["_"];
        if(or__3548__auto____6611) {
          return or__3548__auto____6611
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3546__auto____6612 = tcoll;
    if(and__3546__auto____6612) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3546__auto____6612
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3548__auto____6613 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6613) {
        return or__3548__auto____6613
      }else {
        var or__3548__auto____6614 = cljs.core._assoc_n_BANG_["_"];
        if(or__3548__auto____6614) {
          return or__3548__auto____6614
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3546__auto____6615 = tcoll;
    if(and__3546__auto____6615) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3546__auto____6615
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3548__auto____6616 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6616) {
        return or__3548__auto____6616
      }else {
        var or__3548__auto____6617 = cljs.core._pop_BANG_["_"];
        if(or__3548__auto____6617) {
          return or__3548__auto____6617
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3546__auto____6618 = tcoll;
    if(and__3546__auto____6618) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3546__auto____6618
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3548__auto____6619 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3548__auto____6619) {
        return or__3548__auto____6619
      }else {
        var or__3548__auto____6620 = cljs.core._disjoin_BANG_["_"];
        if(or__3548__auto____6620) {
          return or__3548__auto____6620
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3548__auto____6621 = x === y;
    if(or__3548__auto____6621) {
      return or__3548__auto____6621
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6622__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6623 = y;
            var G__6624 = cljs.core.first.call(null, more);
            var G__6625 = cljs.core.next.call(null, more);
            x = G__6623;
            y = G__6624;
            more = G__6625;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6622 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6622__delegate.call(this, x, y, more)
    };
    G__6622.cljs$lang$maxFixedArity = 2;
    G__6622.cljs$lang$applyTo = function(arglist__6626) {
      var x = cljs.core.first(arglist__6626);
      var y = cljs.core.first(cljs.core.next(arglist__6626));
      var more = cljs.core.rest(cljs.core.next(arglist__6626));
      return G__6622__delegate(x, y, more)
    };
    G__6622.cljs$lang$arity$variadic = G__6622__delegate;
    return G__6622
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3548__auto____6627 = x == null;
    if(or__3548__auto____6627) {
      return or__3548__auto____6627
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6628 = null;
  var G__6628__2 = function(o, k) {
    return null
  };
  var G__6628__3 = function(o, k, not_found) {
    return not_found
  };
  G__6628 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6628__2.call(this, o, k);
      case 3:
        return G__6628__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6628
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6629 = null;
  var G__6629__2 = function(_, f) {
    return f.call(null)
  };
  var G__6629__3 = function(_, f, start) {
    return start
  };
  G__6629 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6629__2.call(this, _, f);
      case 3:
        return G__6629__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6629
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6630 = null;
  var G__6630__2 = function(_, n) {
    return null
  };
  var G__6630__3 = function(_, n, not_found) {
    return not_found
  };
  G__6630 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6630__2.call(this, _, n);
      case 3:
        return G__6630__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6630
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__6631 = cljs.core._nth.call(null, cicoll, 0);
      var n__6632 = 1;
      while(true) {
        if(n__6632 < cljs.core._count.call(null, cicoll)) {
          var nval__6633 = f.call(null, val__6631, cljs.core._nth.call(null, cicoll, n__6632));
          if(cljs.core.reduced_QMARK_.call(null, nval__6633)) {
            return cljs.core.deref.call(null, nval__6633)
          }else {
            var G__6640 = nval__6633;
            var G__6641 = n__6632 + 1;
            val__6631 = G__6640;
            n__6632 = G__6641;
            continue
          }
        }else {
          return val__6631
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__6634 = val;
    var n__6635 = 0;
    while(true) {
      if(n__6635 < cljs.core._count.call(null, cicoll)) {
        var nval__6636 = f.call(null, val__6634, cljs.core._nth.call(null, cicoll, n__6635));
        if(cljs.core.reduced_QMARK_.call(null, nval__6636)) {
          return cljs.core.deref.call(null, nval__6636)
        }else {
          var G__6642 = nval__6636;
          var G__6643 = n__6635 + 1;
          val__6634 = G__6642;
          n__6635 = G__6643;
          continue
        }
      }else {
        return val__6634
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__6637 = val;
    var n__6638 = idx;
    while(true) {
      if(n__6638 < cljs.core._count.call(null, cicoll)) {
        var nval__6639 = f.call(null, val__6637, cljs.core._nth.call(null, cicoll, n__6638));
        if(cljs.core.reduced_QMARK_.call(null, nval__6639)) {
          return cljs.core.deref.call(null, nval__6639)
        }else {
          var G__6644 = nval__6639;
          var G__6645 = n__6638 + 1;
          val__6637 = G__6644;
          n__6638 = G__6645;
          continue
        }
      }else {
        return val__6637
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6646 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6647 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6648 = this;
  var this$__6649 = this;
  return cljs.core.pr_str.call(null, this$__6649)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6650 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6650.a)) {
    return cljs.core.ci_reduce.call(null, this__6650.a, f, this__6650.a[this__6650.i], this__6650.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6650.a[this__6650.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6651 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6651.a)) {
    return cljs.core.ci_reduce.call(null, this__6651.a, f, start, this__6651.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6652 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6653 = this;
  return this__6653.a.length - this__6653.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6654 = this;
  return this__6654.a[this__6654.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6655 = this;
  if(this__6655.i + 1 < this__6655.a.length) {
    return new cljs.core.IndexedSeq(this__6655.a, this__6655.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6656 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6657 = this;
  var i__6658 = n + this__6657.i;
  if(i__6658 < this__6657.a.length) {
    return this__6657.a[i__6658]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6659 = this;
  var i__6660 = n + this__6659.i;
  if(i__6660 < this__6659.a.length) {
    return this__6659.a[i__6660]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6661 = null;
  var G__6661__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6661__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6661 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6661__2.call(this, array, f);
      case 3:
        return G__6661__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6661
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6662 = null;
  var G__6662__2 = function(array, k) {
    return array[k]
  };
  var G__6662__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6662 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6662__2.call(this, array, k);
      case 3:
        return G__6662__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6662
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6663 = null;
  var G__6663__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6663__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6663 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6663__2.call(this, array, n);
      case 3:
        return G__6663__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6663
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__6664__6665 = coll;
      if(G__6664__6665 != null) {
        if(function() {
          var or__3548__auto____6666 = G__6664__6665.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3548__auto____6666) {
            return or__3548__auto____6666
          }else {
            return G__6664__6665.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6664__6665.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6664__6665)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6664__6665)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__6667__6668 = coll;
      if(G__6667__6668 != null) {
        if(function() {
          var or__3548__auto____6669 = G__6667__6668.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____6669) {
            return or__3548__auto____6669
          }else {
            return G__6667__6668.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6667__6668.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6667__6668)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6667__6668)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6670 = cljs.core.seq.call(null, coll);
      if(s__6670 != null) {
        return cljs.core._first.call(null, s__6670)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__6671__6672 = coll;
      if(G__6671__6672 != null) {
        if(function() {
          var or__3548__auto____6673 = G__6671__6672.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____6673) {
            return or__3548__auto____6673
          }else {
            return G__6671__6672.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6671__6672.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6671__6672)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6671__6672)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6674 = cljs.core.seq.call(null, coll);
      if(s__6674 != null) {
        return cljs.core._rest.call(null, s__6674)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__6675__6676 = coll;
      if(G__6675__6676 != null) {
        if(function() {
          var or__3548__auto____6677 = G__6675__6676.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____6677) {
            return or__3548__auto____6677
          }else {
            return G__6675__6676.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6675__6676.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6675__6676)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6675__6676)
      }
    }()) {
      var coll__6678 = cljs.core._rest.call(null, coll);
      if(coll__6678 != null) {
        if(function() {
          var G__6679__6680 = coll__6678;
          if(G__6679__6680 != null) {
            if(function() {
              var or__3548__auto____6681 = G__6679__6680.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3548__auto____6681) {
                return or__3548__auto____6681
              }else {
                return G__6679__6680.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__6679__6680.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6679__6680)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6679__6680)
          }
        }()) {
          return coll__6678
        }else {
          return cljs.core._seq.call(null, coll__6678)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__6682 = cljs.core.next.call(null, s);
      s = G__6682;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6683__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6684 = conj.call(null, coll, x);
          var G__6685 = cljs.core.first.call(null, xs);
          var G__6686 = cljs.core.next.call(null, xs);
          coll = G__6684;
          x = G__6685;
          xs = G__6686;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6683 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6683__delegate.call(this, coll, x, xs)
    };
    G__6683.cljs$lang$maxFixedArity = 2;
    G__6683.cljs$lang$applyTo = function(arglist__6687) {
      var coll = cljs.core.first(arglist__6687);
      var x = cljs.core.first(cljs.core.next(arglist__6687));
      var xs = cljs.core.rest(cljs.core.next(arglist__6687));
      return G__6683__delegate(coll, x, xs)
    };
    G__6683.cljs$lang$arity$variadic = G__6683__delegate;
    return G__6683
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6688 = cljs.core.seq.call(null, coll);
  var acc__6689 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6688)) {
      return acc__6689 + cljs.core._count.call(null, s__6688)
    }else {
      var G__6690 = cljs.core.next.call(null, s__6688);
      var G__6691 = acc__6689 + 1;
      s__6688 = G__6690;
      acc__6689 = G__6691;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__6692__6693 = coll;
        if(G__6692__6693 != null) {
          if(function() {
            var or__3548__auto____6694 = G__6692__6693.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____6694) {
              return or__3548__auto____6694
            }else {
              return G__6692__6693.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6692__6693.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6692__6693)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6692__6693)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__6695__6696 = coll;
        if(G__6695__6696 != null) {
          if(function() {
            var or__3548__auto____6697 = G__6695__6696.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3548__auto____6697) {
              return or__3548__auto____6697
            }else {
              return G__6695__6696.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6695__6696.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6695__6696)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6695__6696)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6699__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6698 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6700 = ret__6698;
          var G__6701 = cljs.core.first.call(null, kvs);
          var G__6702 = cljs.core.second.call(null, kvs);
          var G__6703 = cljs.core.nnext.call(null, kvs);
          coll = G__6700;
          k = G__6701;
          v = G__6702;
          kvs = G__6703;
          continue
        }else {
          return ret__6698
        }
        break
      }
    };
    var G__6699 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6699__delegate.call(this, coll, k, v, kvs)
    };
    G__6699.cljs$lang$maxFixedArity = 3;
    G__6699.cljs$lang$applyTo = function(arglist__6704) {
      var coll = cljs.core.first(arglist__6704);
      var k = cljs.core.first(cljs.core.next(arglist__6704));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6704)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6704)));
      return G__6699__delegate(coll, k, v, kvs)
    };
    G__6699.cljs$lang$arity$variadic = G__6699__delegate;
    return G__6699
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6706__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6705 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6707 = ret__6705;
          var G__6708 = cljs.core.first.call(null, ks);
          var G__6709 = cljs.core.next.call(null, ks);
          coll = G__6707;
          k = G__6708;
          ks = G__6709;
          continue
        }else {
          return ret__6705
        }
        break
      }
    };
    var G__6706 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6706__delegate.call(this, coll, k, ks)
    };
    G__6706.cljs$lang$maxFixedArity = 2;
    G__6706.cljs$lang$applyTo = function(arglist__6710) {
      var coll = cljs.core.first(arglist__6710);
      var k = cljs.core.first(cljs.core.next(arglist__6710));
      var ks = cljs.core.rest(cljs.core.next(arglist__6710));
      return G__6706__delegate(coll, k, ks)
    };
    G__6706.cljs$lang$arity$variadic = G__6706__delegate;
    return G__6706
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6711__6712 = o;
    if(G__6711__6712 != null) {
      if(function() {
        var or__3548__auto____6713 = G__6711__6712.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3548__auto____6713) {
          return or__3548__auto____6713
        }else {
          return G__6711__6712.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6711__6712.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6711__6712)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6711__6712)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6715__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6714 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6716 = ret__6714;
          var G__6717 = cljs.core.first.call(null, ks);
          var G__6718 = cljs.core.next.call(null, ks);
          coll = G__6716;
          k = G__6717;
          ks = G__6718;
          continue
        }else {
          return ret__6714
        }
        break
      }
    };
    var G__6715 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6715__delegate.call(this, coll, k, ks)
    };
    G__6715.cljs$lang$maxFixedArity = 2;
    G__6715.cljs$lang$applyTo = function(arglist__6719) {
      var coll = cljs.core.first(arglist__6719);
      var k = cljs.core.first(cljs.core.next(arglist__6719));
      var ks = cljs.core.rest(cljs.core.next(arglist__6719));
      return G__6715__delegate(coll, k, ks)
    };
    G__6715.cljs$lang$arity$variadic = G__6715__delegate;
    return G__6715
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6720__6721 = x;
    if(G__6720__6721 != null) {
      if(function() {
        var or__3548__auto____6722 = G__6720__6721.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3548__auto____6722) {
          return or__3548__auto____6722
        }else {
          return G__6720__6721.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6720__6721.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6720__6721)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6720__6721)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6723__6724 = x;
    if(G__6723__6724 != null) {
      if(function() {
        var or__3548__auto____6725 = G__6723__6724.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3548__auto____6725) {
          return or__3548__auto____6725
        }else {
          return G__6723__6724.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6723__6724.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6723__6724)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6723__6724)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6726__6727 = x;
  if(G__6726__6727 != null) {
    if(function() {
      var or__3548__auto____6728 = G__6726__6727.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3548__auto____6728) {
        return or__3548__auto____6728
      }else {
        return G__6726__6727.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6726__6727.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6726__6727)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6726__6727)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6729__6730 = x;
  if(G__6729__6730 != null) {
    if(function() {
      var or__3548__auto____6731 = G__6729__6730.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3548__auto____6731) {
        return or__3548__auto____6731
      }else {
        return G__6729__6730.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6729__6730.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6729__6730)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6729__6730)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6732__6733 = x;
  if(G__6732__6733 != null) {
    if(function() {
      var or__3548__auto____6734 = G__6732__6733.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3548__auto____6734) {
        return or__3548__auto____6734
      }else {
        return G__6732__6733.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6732__6733.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6732__6733)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6732__6733)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6735__6736 = x;
  if(G__6735__6736 != null) {
    if(function() {
      var or__3548__auto____6737 = G__6735__6736.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3548__auto____6737) {
        return or__3548__auto____6737
      }else {
        return G__6735__6736.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6735__6736.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6735__6736)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6735__6736)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6738__6739 = x;
  if(G__6738__6739 != null) {
    if(function() {
      var or__3548__auto____6740 = G__6738__6739.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3548__auto____6740) {
        return or__3548__auto____6740
      }else {
        return G__6738__6739.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6738__6739.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6738__6739)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6738__6739)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6741__6742 = x;
    if(G__6741__6742 != null) {
      if(function() {
        var or__3548__auto____6743 = G__6741__6742.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3548__auto____6743) {
          return or__3548__auto____6743
        }else {
          return G__6741__6742.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6741__6742.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6741__6742)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6741__6742)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6744__6745 = x;
  if(G__6744__6745 != null) {
    if(function() {
      var or__3548__auto____6746 = G__6744__6745.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3548__auto____6746) {
        return or__3548__auto____6746
      }else {
        return G__6744__6745.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6744__6745.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6744__6745)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6744__6745)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6747__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6747 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6747__delegate.call(this, keyvals)
    };
    G__6747.cljs$lang$maxFixedArity = 0;
    G__6747.cljs$lang$applyTo = function(arglist__6748) {
      var keyvals = cljs.core.seq(arglist__6748);
      return G__6747__delegate(keyvals)
    };
    G__6747.cljs$lang$arity$variadic = G__6747__delegate;
    return G__6747
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6749 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__6749.push(key)
  });
  return keys__6749
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6750 = i;
  var j__6751 = j;
  var len__6752 = len;
  while(true) {
    if(len__6752 === 0) {
      return to
    }else {
      to[j__6751] = from[i__6750];
      var G__6753 = i__6750 + 1;
      var G__6754 = j__6751 + 1;
      var G__6755 = len__6752 - 1;
      i__6750 = G__6753;
      j__6751 = G__6754;
      len__6752 = G__6755;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6756 = i + (len - 1);
  var j__6757 = j + (len - 1);
  var len__6758 = len;
  while(true) {
    if(len__6758 === 0) {
      return to
    }else {
      to[j__6757] = from[i__6756];
      var G__6759 = i__6756 - 1;
      var G__6760 = j__6757 - 1;
      var G__6761 = len__6758 - 1;
      i__6756 = G__6759;
      j__6757 = G__6760;
      len__6758 = G__6761;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6762__6763 = s;
    if(G__6762__6763 != null) {
      if(function() {
        var or__3548__auto____6764 = G__6762__6763.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3548__auto____6764) {
          return or__3548__auto____6764
        }else {
          return G__6762__6763.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6762__6763.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6762__6763)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6762__6763)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6765__6766 = s;
  if(G__6765__6766 != null) {
    if(function() {
      var or__3548__auto____6767 = G__6765__6766.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3548__auto____6767) {
        return or__3548__auto____6767
      }else {
        return G__6765__6766.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6765__6766.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6765__6766)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6765__6766)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3546__auto____6768 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____6768)) {
    return cljs.core.not.call(null, function() {
      var or__3548__auto____6769 = x.charAt(0) === "\ufdd0";
      if(or__3548__auto____6769) {
        return or__3548__auto____6769
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3546__auto____6768
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3546__auto____6770 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____6770)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3546__auto____6770
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3546__auto____6771 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3546__auto____6771)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3546__auto____6771
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3548__auto____6772 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3548__auto____6772) {
    return or__3548__auto____6772
  }else {
    var G__6773__6774 = f;
    if(G__6773__6774 != null) {
      if(function() {
        var or__3548__auto____6775 = G__6773__6774.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3548__auto____6775) {
          return or__3548__auto____6775
        }else {
          return G__6773__6774.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6773__6774.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6773__6774)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6773__6774)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3546__auto____6776 = cljs.core.number_QMARK_.call(null, n);
  if(and__3546__auto____6776) {
    return n == n.toFixed()
  }else {
    return and__3546__auto____6776
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3546__auto____6777 = coll;
    if(cljs.core.truth_(and__3546__auto____6777)) {
      var and__3546__auto____6778 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3546__auto____6778) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3546__auto____6778
      }
    }else {
      return and__3546__auto____6777
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__6783__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__6779 = cljs.core.set([y, x]);
        var xs__6780 = more;
        while(true) {
          var x__6781 = cljs.core.first.call(null, xs__6780);
          var etc__6782 = cljs.core.next.call(null, xs__6780);
          if(cljs.core.truth_(xs__6780)) {
            if(cljs.core.contains_QMARK_.call(null, s__6779, x__6781)) {
              return false
            }else {
              var G__6784 = cljs.core.conj.call(null, s__6779, x__6781);
              var G__6785 = etc__6782;
              s__6779 = G__6784;
              xs__6780 = G__6785;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6783 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6783__delegate.call(this, x, y, more)
    };
    G__6783.cljs$lang$maxFixedArity = 2;
    G__6783.cljs$lang$applyTo = function(arglist__6786) {
      var x = cljs.core.first(arglist__6786);
      var y = cljs.core.first(cljs.core.next(arglist__6786));
      var more = cljs.core.rest(cljs.core.next(arglist__6786));
      return G__6783__delegate(x, y, more)
    };
    G__6783.cljs$lang$arity$variadic = G__6783__delegate;
    return G__6783
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__6787 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__6787)) {
        return r__6787
      }else {
        if(cljs.core.truth_(r__6787)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__6788 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__6788, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__6788)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3695__auto____6789 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3695__auto____6789)) {
      var s__6790 = temp__3695__auto____6789;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__6790), cljs.core.next.call(null, s__6790))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__6791 = val;
    var coll__6792 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__6792)) {
        var nval__6793 = f.call(null, val__6791, cljs.core.first.call(null, coll__6792));
        if(cljs.core.reduced_QMARK_.call(null, nval__6793)) {
          return cljs.core.deref.call(null, nval__6793)
        }else {
          var G__6794 = nval__6793;
          var G__6795 = cljs.core.next.call(null, coll__6792);
          val__6791 = G__6794;
          coll__6792 = G__6795;
          continue
        }
      }else {
        return val__6791
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__6796__6797 = coll;
      if(G__6796__6797 != null) {
        if(function() {
          var or__3548__auto____6798 = G__6796__6797.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____6798) {
            return or__3548__auto____6798
          }else {
            return G__6796__6797.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6796__6797.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6796__6797)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6796__6797)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__6799__6800 = coll;
      if(G__6799__6800 != null) {
        if(function() {
          var or__3548__auto____6801 = G__6799__6800.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3548__auto____6801) {
            return or__3548__auto____6801
          }else {
            return G__6799__6800.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__6799__6800.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6799__6800)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6799__6800)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__6802 = this;
  return this__6802.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__6803__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__6803 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6803__delegate.call(this, x, y, more)
    };
    G__6803.cljs$lang$maxFixedArity = 2;
    G__6803.cljs$lang$applyTo = function(arglist__6804) {
      var x = cljs.core.first(arglist__6804);
      var y = cljs.core.first(cljs.core.next(arglist__6804));
      var more = cljs.core.rest(cljs.core.next(arglist__6804));
      return G__6803__delegate(x, y, more)
    };
    G__6803.cljs$lang$arity$variadic = G__6803__delegate;
    return G__6803
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__6805__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__6805 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6805__delegate.call(this, x, y, more)
    };
    G__6805.cljs$lang$maxFixedArity = 2;
    G__6805.cljs$lang$applyTo = function(arglist__6806) {
      var x = cljs.core.first(arglist__6806);
      var y = cljs.core.first(cljs.core.next(arglist__6806));
      var more = cljs.core.rest(cljs.core.next(arglist__6806));
      return G__6805__delegate(x, y, more)
    };
    G__6805.cljs$lang$arity$variadic = G__6805__delegate;
    return G__6805
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__6807__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__6807 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6807__delegate.call(this, x, y, more)
    };
    G__6807.cljs$lang$maxFixedArity = 2;
    G__6807.cljs$lang$applyTo = function(arglist__6808) {
      var x = cljs.core.first(arglist__6808);
      var y = cljs.core.first(cljs.core.next(arglist__6808));
      var more = cljs.core.rest(cljs.core.next(arglist__6808));
      return G__6807__delegate(x, y, more)
    };
    G__6807.cljs$lang$arity$variadic = G__6807__delegate;
    return G__6807
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__6809__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__6809 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6809__delegate.call(this, x, y, more)
    };
    G__6809.cljs$lang$maxFixedArity = 2;
    G__6809.cljs$lang$applyTo = function(arglist__6810) {
      var x = cljs.core.first(arglist__6810);
      var y = cljs.core.first(cljs.core.next(arglist__6810));
      var more = cljs.core.rest(cljs.core.next(arglist__6810));
      return G__6809__delegate(x, y, more)
    };
    G__6809.cljs$lang$arity$variadic = G__6809__delegate;
    return G__6809
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__6811__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6812 = y;
            var G__6813 = cljs.core.first.call(null, more);
            var G__6814 = cljs.core.next.call(null, more);
            x = G__6812;
            y = G__6813;
            more = G__6814;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6811 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6811__delegate.call(this, x, y, more)
    };
    G__6811.cljs$lang$maxFixedArity = 2;
    G__6811.cljs$lang$applyTo = function(arglist__6815) {
      var x = cljs.core.first(arglist__6815);
      var y = cljs.core.first(cljs.core.next(arglist__6815));
      var more = cljs.core.rest(cljs.core.next(arglist__6815));
      return G__6811__delegate(x, y, more)
    };
    G__6811.cljs$lang$arity$variadic = G__6811__delegate;
    return G__6811
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__6816__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6817 = y;
            var G__6818 = cljs.core.first.call(null, more);
            var G__6819 = cljs.core.next.call(null, more);
            x = G__6817;
            y = G__6818;
            more = G__6819;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6816 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6816__delegate.call(this, x, y, more)
    };
    G__6816.cljs$lang$maxFixedArity = 2;
    G__6816.cljs$lang$applyTo = function(arglist__6820) {
      var x = cljs.core.first(arglist__6820);
      var y = cljs.core.first(cljs.core.next(arglist__6820));
      var more = cljs.core.rest(cljs.core.next(arglist__6820));
      return G__6816__delegate(x, y, more)
    };
    G__6816.cljs$lang$arity$variadic = G__6816__delegate;
    return G__6816
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__6821__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6822 = y;
            var G__6823 = cljs.core.first.call(null, more);
            var G__6824 = cljs.core.next.call(null, more);
            x = G__6822;
            y = G__6823;
            more = G__6824;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6821 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6821__delegate.call(this, x, y, more)
    };
    G__6821.cljs$lang$maxFixedArity = 2;
    G__6821.cljs$lang$applyTo = function(arglist__6825) {
      var x = cljs.core.first(arglist__6825);
      var y = cljs.core.first(cljs.core.next(arglist__6825));
      var more = cljs.core.rest(cljs.core.next(arglist__6825));
      return G__6821__delegate(x, y, more)
    };
    G__6821.cljs$lang$arity$variadic = G__6821__delegate;
    return G__6821
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__6826__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6827 = y;
            var G__6828 = cljs.core.first.call(null, more);
            var G__6829 = cljs.core.next.call(null, more);
            x = G__6827;
            y = G__6828;
            more = G__6829;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6826 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6826__delegate.call(this, x, y, more)
    };
    G__6826.cljs$lang$maxFixedArity = 2;
    G__6826.cljs$lang$applyTo = function(arglist__6830) {
      var x = cljs.core.first(arglist__6830);
      var y = cljs.core.first(cljs.core.next(arglist__6830));
      var more = cljs.core.rest(cljs.core.next(arglist__6830));
      return G__6826__delegate(x, y, more)
    };
    G__6826.cljs$lang$arity$variadic = G__6826__delegate;
    return G__6826
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__6831__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__6831 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6831__delegate.call(this, x, y, more)
    };
    G__6831.cljs$lang$maxFixedArity = 2;
    G__6831.cljs$lang$applyTo = function(arglist__6832) {
      var x = cljs.core.first(arglist__6832);
      var y = cljs.core.first(cljs.core.next(arglist__6832));
      var more = cljs.core.rest(cljs.core.next(arglist__6832));
      return G__6831__delegate(x, y, more)
    };
    G__6831.cljs$lang$arity$variadic = G__6831__delegate;
    return G__6831
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__6833__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__6833 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6833__delegate.call(this, x, y, more)
    };
    G__6833.cljs$lang$maxFixedArity = 2;
    G__6833.cljs$lang$applyTo = function(arglist__6834) {
      var x = cljs.core.first(arglist__6834);
      var y = cljs.core.first(cljs.core.next(arglist__6834));
      var more = cljs.core.rest(cljs.core.next(arglist__6834));
      return G__6833__delegate(x, y, more)
    };
    G__6833.cljs$lang$arity$variadic = G__6833__delegate;
    return G__6833
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__6835 = n % d;
  return cljs.core.fix.call(null, (n - rem__6835) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__6836 = cljs.core.quot.call(null, n, d);
  return n - d * q__6836
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__6837 = 0;
  var n__6838 = n;
  while(true) {
    if(n__6838 === 0) {
      return c__6837
    }else {
      var G__6839 = c__6837 + 1;
      var G__6840 = n__6838 & n__6838 - 1;
      c__6837 = G__6839;
      n__6838 = G__6840;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__6841__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__6842 = y;
            var G__6843 = cljs.core.first.call(null, more);
            var G__6844 = cljs.core.next.call(null, more);
            x = G__6842;
            y = G__6843;
            more = G__6844;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6841 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6841__delegate.call(this, x, y, more)
    };
    G__6841.cljs$lang$maxFixedArity = 2;
    G__6841.cljs$lang$applyTo = function(arglist__6845) {
      var x = cljs.core.first(arglist__6845);
      var y = cljs.core.first(cljs.core.next(arglist__6845));
      var more = cljs.core.rest(cljs.core.next(arglist__6845));
      return G__6841__delegate(x, y, more)
    };
    G__6841.cljs$lang$arity$variadic = G__6841__delegate;
    return G__6841
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__6846 = n;
  var xs__6847 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____6848 = xs__6847;
      if(cljs.core.truth_(and__3546__auto____6848)) {
        return n__6846 > 0
      }else {
        return and__3546__auto____6848
      }
    }())) {
      var G__6849 = n__6846 - 1;
      var G__6850 = cljs.core.next.call(null, xs__6847);
      n__6846 = G__6849;
      xs__6847 = G__6850;
      continue
    }else {
      return xs__6847
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__6851__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6852 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__6853 = cljs.core.next.call(null, more);
            sb = G__6852;
            more = G__6853;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__6851 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6851__delegate.call(this, x, ys)
    };
    G__6851.cljs$lang$maxFixedArity = 1;
    G__6851.cljs$lang$applyTo = function(arglist__6854) {
      var x = cljs.core.first(arglist__6854);
      var ys = cljs.core.rest(arglist__6854);
      return G__6851__delegate(x, ys)
    };
    G__6851.cljs$lang$arity$variadic = G__6851__delegate;
    return G__6851
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__6855__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__6856 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__6857 = cljs.core.next.call(null, more);
            sb = G__6856;
            more = G__6857;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__6855 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6855__delegate.call(this, x, ys)
    };
    G__6855.cljs$lang$maxFixedArity = 1;
    G__6855.cljs$lang$applyTo = function(arglist__6858) {
      var x = cljs.core.first(arglist__6858);
      var ys = cljs.core.rest(arglist__6858);
      return G__6855__delegate(x, ys)
    };
    G__6855.cljs$lang$arity$variadic = G__6855__delegate;
    return G__6855
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__6859 = cljs.core.seq.call(null, x);
    var ys__6860 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__6859 == null) {
        return ys__6860 == null
      }else {
        if(ys__6860 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__6859), cljs.core.first.call(null, ys__6860))) {
            var G__6861 = cljs.core.next.call(null, xs__6859);
            var G__6862 = cljs.core.next.call(null, ys__6860);
            xs__6859 = G__6861;
            ys__6860 = G__6862;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__6863_SHARP_, p2__6864_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__6863_SHARP_, cljs.core.hash.call(null, p2__6864_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__6865 = 0;
  var s__6866 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__6866)) {
      var e__6867 = cljs.core.first.call(null, s__6866);
      var G__6868 = (h__6865 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__6867)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__6867)))) % 4503599627370496;
      var G__6869 = cljs.core.next.call(null, s__6866);
      h__6865 = G__6868;
      s__6866 = G__6869;
      continue
    }else {
      return h__6865
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__6870 = 0;
  var s__6871 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__6871)) {
      var e__6872 = cljs.core.first.call(null, s__6871);
      var G__6873 = (h__6870 + cljs.core.hash.call(null, e__6872)) % 4503599627370496;
      var G__6874 = cljs.core.next.call(null, s__6871);
      h__6870 = G__6873;
      s__6871 = G__6874;
      continue
    }else {
      return h__6870
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__6875__6876 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__6875__6876)) {
    var G__6878__6880 = cljs.core.first.call(null, G__6875__6876);
    var vec__6879__6881 = G__6878__6880;
    var key_name__6882 = cljs.core.nth.call(null, vec__6879__6881, 0, null);
    var f__6883 = cljs.core.nth.call(null, vec__6879__6881, 1, null);
    var G__6875__6884 = G__6875__6876;
    var G__6878__6885 = G__6878__6880;
    var G__6875__6886 = G__6875__6884;
    while(true) {
      var vec__6887__6888 = G__6878__6885;
      var key_name__6889 = cljs.core.nth.call(null, vec__6887__6888, 0, null);
      var f__6890 = cljs.core.nth.call(null, vec__6887__6888, 1, null);
      var G__6875__6891 = G__6875__6886;
      var str_name__6892 = cljs.core.name.call(null, key_name__6889);
      obj[str_name__6892] = f__6890;
      var temp__3698__auto____6893 = cljs.core.next.call(null, G__6875__6891);
      if(cljs.core.truth_(temp__3698__auto____6893)) {
        var G__6875__6894 = temp__3698__auto____6893;
        var G__6895 = cljs.core.first.call(null, G__6875__6894);
        var G__6896 = G__6875__6894;
        G__6878__6885 = G__6895;
        G__6875__6886 = G__6896;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6897 = this;
  var h__364__auto____6898 = this__6897.__hash;
  if(h__364__auto____6898 != null) {
    return h__364__auto____6898
  }else {
    var h__364__auto____6899 = cljs.core.hash_coll.call(null, coll);
    this__6897.__hash = h__364__auto____6899;
    return h__364__auto____6899
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6900 = this;
  return new cljs.core.List(this__6900.meta, o, coll, this__6900.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__6901 = this;
  var this$__6902 = this;
  return cljs.core.pr_str.call(null, this$__6902)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6903 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6904 = this;
  return this__6904.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6905 = this;
  return this__6905.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6906 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6907 = this;
  return this__6907.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6908 = this;
  return this__6908.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6909 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6910 = this;
  return new cljs.core.List(meta, this__6910.first, this__6910.rest, this__6910.count, this__6910.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6911 = this;
  return this__6911.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6912 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6913 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6914 = this;
  return new cljs.core.List(this__6914.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__6915 = this;
  var this$__6916 = this;
  return cljs.core.pr_str.call(null, this$__6916)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6917 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6918 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__6919 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__6920 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6921 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6922 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6923 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6924 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6925 = this;
  return this__6925.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6926 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__6927__6928 = coll;
  if(G__6927__6928 != null) {
    if(function() {
      var or__3548__auto____6929 = G__6927__6928.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3548__auto____6929) {
        return or__3548__auto____6929
      }else {
        return G__6927__6928.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__6927__6928.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6927__6928)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__6927__6928)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__6930) {
    var items = cljs.core.seq(arglist__6930);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6931 = this;
  var h__364__auto____6932 = this__6931.__hash;
  if(h__364__auto____6932 != null) {
    return h__364__auto____6932
  }else {
    var h__364__auto____6933 = cljs.core.hash_coll.call(null, coll);
    this__6931.__hash = h__364__auto____6933;
    return h__364__auto____6933
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6934 = this;
  return new cljs.core.Cons(null, o, coll, this__6934.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__6935 = this;
  var this$__6936 = this;
  return cljs.core.pr_str.call(null, this$__6936)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6937 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6938 = this;
  return this__6938.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6939 = this;
  if(this__6939.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__6939.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6940 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6941 = this;
  return new cljs.core.Cons(meta, this__6941.first, this__6941.rest, this__6941.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6942 = this;
  return this__6942.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6943 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6943.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3548__auto____6944 = coll == null;
    if(or__3548__auto____6944) {
      return or__3548__auto____6944
    }else {
      var G__6945__6946 = coll;
      if(G__6945__6946 != null) {
        if(function() {
          var or__3548__auto____6947 = G__6945__6946.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3548__auto____6947) {
            return or__3548__auto____6947
          }else {
            return G__6945__6946.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6945__6946.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6945__6946)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6945__6946)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__6948__6949 = x;
  if(G__6948__6949 != null) {
    if(function() {
      var or__3548__auto____6950 = G__6948__6949.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3548__auto____6950) {
        return or__3548__auto____6950
      }else {
        return G__6948__6949.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__6948__6949.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6948__6949)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__6948__6949)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__6951 = null;
  var G__6951__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__6951__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__6951 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6951__2.call(this, string, f);
      case 3:
        return G__6951__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6951
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__6952 = null;
  var G__6952__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__6952__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__6952 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6952__2.call(this, string, k);
      case 3:
        return G__6952__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6952
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__6953 = null;
  var G__6953__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__6953__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__6953 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6953__2.call(this, string, n);
      case 3:
        return G__6953__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6953
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__6962 = null;
  var G__6962__2 = function(tsym6956, coll) {
    var tsym6956__6958 = this;
    var this$__6959 = tsym6956__6958;
    return cljs.core.get.call(null, coll, this$__6959.toString())
  };
  var G__6962__3 = function(tsym6957, coll, not_found) {
    var tsym6957__6960 = this;
    var this$__6961 = tsym6957__6960;
    return cljs.core.get.call(null, coll, this$__6961.toString(), not_found)
  };
  G__6962 = function(tsym6957, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6962__2.call(this, tsym6957, coll);
      case 3:
        return G__6962__3.call(this, tsym6957, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6962
}();
String.prototype.apply = function(tsym6954, args6955) {
  return tsym6954.call.apply(tsym6954, [tsym6954].concat(cljs.core.aclone.call(null, args6955)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__6963 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__6963
  }else {
    lazy_seq.x = x__6963.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6964 = this;
  var h__364__auto____6965 = this__6964.__hash;
  if(h__364__auto____6965 != null) {
    return h__364__auto____6965
  }else {
    var h__364__auto____6966 = cljs.core.hash_coll.call(null, coll);
    this__6964.__hash = h__364__auto____6966;
    return h__364__auto____6966
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6967 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__6968 = this;
  var this$__6969 = this;
  return cljs.core.pr_str.call(null, this$__6969)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6970 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6971 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6972 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6973 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6974 = this;
  return new cljs.core.LazySeq(meta, this__6974.realized, this__6974.x, this__6974.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6975 = this;
  return this__6975.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6976 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6976.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__6977 = [];
  var s__6978 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__6978))) {
      ary__6977.push(cljs.core.first.call(null, s__6978));
      var G__6979 = cljs.core.next.call(null, s__6978);
      s__6978 = G__6979;
      continue
    }else {
      return ary__6977
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__6980 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__6981 = 0;
  var xs__6982 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__6982)) {
      ret__6980[i__6981] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__6982));
      var G__6983 = i__6981 + 1;
      var G__6984 = cljs.core.next.call(null, xs__6982);
      i__6981 = G__6983;
      xs__6982 = G__6984;
      continue
    }else {
    }
    break
  }
  return ret__6980
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__6985 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6986 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6987 = 0;
      var s__6988 = s__6986;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____6989 = s__6988;
          if(cljs.core.truth_(and__3546__auto____6989)) {
            return i__6987 < size
          }else {
            return and__3546__auto____6989
          }
        }())) {
          a__6985[i__6987] = cljs.core.first.call(null, s__6988);
          var G__6992 = i__6987 + 1;
          var G__6993 = cljs.core.next.call(null, s__6988);
          i__6987 = G__6992;
          s__6988 = G__6993;
          continue
        }else {
          return a__6985
        }
        break
      }
    }else {
      var n__685__auto____6990 = size;
      var i__6991 = 0;
      while(true) {
        if(i__6991 < n__685__auto____6990) {
          a__6985[i__6991] = init_val_or_seq;
          var G__6994 = i__6991 + 1;
          i__6991 = G__6994;
          continue
        }else {
        }
        break
      }
      return a__6985
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__6995 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__6996 = cljs.core.seq.call(null, init_val_or_seq);
      var i__6997 = 0;
      var s__6998 = s__6996;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____6999 = s__6998;
          if(cljs.core.truth_(and__3546__auto____6999)) {
            return i__6997 < size
          }else {
            return and__3546__auto____6999
          }
        }())) {
          a__6995[i__6997] = cljs.core.first.call(null, s__6998);
          var G__7002 = i__6997 + 1;
          var G__7003 = cljs.core.next.call(null, s__6998);
          i__6997 = G__7002;
          s__6998 = G__7003;
          continue
        }else {
          return a__6995
        }
        break
      }
    }else {
      var n__685__auto____7000 = size;
      var i__7001 = 0;
      while(true) {
        if(i__7001 < n__685__auto____7000) {
          a__6995[i__7001] = init_val_or_seq;
          var G__7004 = i__7001 + 1;
          i__7001 = G__7004;
          continue
        }else {
        }
        break
      }
      return a__6995
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7005 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7006 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7007 = 0;
      var s__7008 = s__7006;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3546__auto____7009 = s__7008;
          if(cljs.core.truth_(and__3546__auto____7009)) {
            return i__7007 < size
          }else {
            return and__3546__auto____7009
          }
        }())) {
          a__7005[i__7007] = cljs.core.first.call(null, s__7008);
          var G__7012 = i__7007 + 1;
          var G__7013 = cljs.core.next.call(null, s__7008);
          i__7007 = G__7012;
          s__7008 = G__7013;
          continue
        }else {
          return a__7005
        }
        break
      }
    }else {
      var n__685__auto____7010 = size;
      var i__7011 = 0;
      while(true) {
        if(i__7011 < n__685__auto____7010) {
          a__7005[i__7011] = init_val_or_seq;
          var G__7014 = i__7011 + 1;
          i__7011 = G__7014;
          continue
        }else {
        }
        break
      }
      return a__7005
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7015 = s;
    var i__7016 = n;
    var sum__7017 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____7018 = i__7016 > 0;
        if(and__3546__auto____7018) {
          return cljs.core.seq.call(null, s__7015)
        }else {
          return and__3546__auto____7018
        }
      }())) {
        var G__7019 = cljs.core.next.call(null, s__7015);
        var G__7020 = i__7016 - 1;
        var G__7021 = sum__7017 + 1;
        s__7015 = G__7019;
        i__7016 = G__7020;
        sum__7017 = G__7021;
        continue
      }else {
        return sum__7017
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7022 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__7022)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__7022), concat.call(null, cljs.core.rest.call(null, s__7022), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__7025__delegate = function(x, y, zs) {
      var cat__7024 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7023 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__7023)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7023), cat.call(null, cljs.core.rest.call(null, xys__7023), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__7024.call(null, concat.call(null, x, y), zs)
    };
    var G__7025 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7025__delegate.call(this, x, y, zs)
    };
    G__7025.cljs$lang$maxFixedArity = 2;
    G__7025.cljs$lang$applyTo = function(arglist__7026) {
      var x = cljs.core.first(arglist__7026);
      var y = cljs.core.first(cljs.core.next(arglist__7026));
      var zs = cljs.core.rest(cljs.core.next(arglist__7026));
      return G__7025__delegate(x, y, zs)
    };
    G__7025.cljs$lang$arity$variadic = G__7025__delegate;
    return G__7025
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7027__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7027 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7027__delegate.call(this, a, b, c, d, more)
    };
    G__7027.cljs$lang$maxFixedArity = 4;
    G__7027.cljs$lang$applyTo = function(arglist__7028) {
      var a = cljs.core.first(arglist__7028);
      var b = cljs.core.first(cljs.core.next(arglist__7028));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7028)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7028))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7028))));
      return G__7027__delegate(a, b, c, d, more)
    };
    G__7027.cljs$lang$arity$variadic = G__7027__delegate;
    return G__7027
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7029 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7030 = cljs.core._first.call(null, args__7029);
    var args__7031 = cljs.core._rest.call(null, args__7029);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7030)
      }else {
        return f.call(null, a__7030)
      }
    }else {
      var b__7032 = cljs.core._first.call(null, args__7031);
      var args__7033 = cljs.core._rest.call(null, args__7031);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7030, b__7032)
        }else {
          return f.call(null, a__7030, b__7032)
        }
      }else {
        var c__7034 = cljs.core._first.call(null, args__7033);
        var args__7035 = cljs.core._rest.call(null, args__7033);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7030, b__7032, c__7034)
          }else {
            return f.call(null, a__7030, b__7032, c__7034)
          }
        }else {
          var d__7036 = cljs.core._first.call(null, args__7035);
          var args__7037 = cljs.core._rest.call(null, args__7035);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7030, b__7032, c__7034, d__7036)
            }else {
              return f.call(null, a__7030, b__7032, c__7034, d__7036)
            }
          }else {
            var e__7038 = cljs.core._first.call(null, args__7037);
            var args__7039 = cljs.core._rest.call(null, args__7037);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7030, b__7032, c__7034, d__7036, e__7038)
              }else {
                return f.call(null, a__7030, b__7032, c__7034, d__7036, e__7038)
              }
            }else {
              var f__7040 = cljs.core._first.call(null, args__7039);
              var args__7041 = cljs.core._rest.call(null, args__7039);
              if(argc === 6) {
                if(f__7040.cljs$lang$arity$6) {
                  return f__7040.cljs$lang$arity$6(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040)
                }else {
                  return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040)
                }
              }else {
                var g__7042 = cljs.core._first.call(null, args__7041);
                var args__7043 = cljs.core._rest.call(null, args__7041);
                if(argc === 7) {
                  if(f__7040.cljs$lang$arity$7) {
                    return f__7040.cljs$lang$arity$7(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042)
                  }else {
                    return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042)
                  }
                }else {
                  var h__7044 = cljs.core._first.call(null, args__7043);
                  var args__7045 = cljs.core._rest.call(null, args__7043);
                  if(argc === 8) {
                    if(f__7040.cljs$lang$arity$8) {
                      return f__7040.cljs$lang$arity$8(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044)
                    }else {
                      return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044)
                    }
                  }else {
                    var i__7046 = cljs.core._first.call(null, args__7045);
                    var args__7047 = cljs.core._rest.call(null, args__7045);
                    if(argc === 9) {
                      if(f__7040.cljs$lang$arity$9) {
                        return f__7040.cljs$lang$arity$9(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046)
                      }else {
                        return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046)
                      }
                    }else {
                      var j__7048 = cljs.core._first.call(null, args__7047);
                      var args__7049 = cljs.core._rest.call(null, args__7047);
                      if(argc === 10) {
                        if(f__7040.cljs$lang$arity$10) {
                          return f__7040.cljs$lang$arity$10(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048)
                        }else {
                          return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048)
                        }
                      }else {
                        var k__7050 = cljs.core._first.call(null, args__7049);
                        var args__7051 = cljs.core._rest.call(null, args__7049);
                        if(argc === 11) {
                          if(f__7040.cljs$lang$arity$11) {
                            return f__7040.cljs$lang$arity$11(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050)
                          }else {
                            return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050)
                          }
                        }else {
                          var l__7052 = cljs.core._first.call(null, args__7051);
                          var args__7053 = cljs.core._rest.call(null, args__7051);
                          if(argc === 12) {
                            if(f__7040.cljs$lang$arity$12) {
                              return f__7040.cljs$lang$arity$12(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052)
                            }else {
                              return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052)
                            }
                          }else {
                            var m__7054 = cljs.core._first.call(null, args__7053);
                            var args__7055 = cljs.core._rest.call(null, args__7053);
                            if(argc === 13) {
                              if(f__7040.cljs$lang$arity$13) {
                                return f__7040.cljs$lang$arity$13(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054)
                              }else {
                                return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054)
                              }
                            }else {
                              var n__7056 = cljs.core._first.call(null, args__7055);
                              var args__7057 = cljs.core._rest.call(null, args__7055);
                              if(argc === 14) {
                                if(f__7040.cljs$lang$arity$14) {
                                  return f__7040.cljs$lang$arity$14(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056)
                                }else {
                                  return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056)
                                }
                              }else {
                                var o__7058 = cljs.core._first.call(null, args__7057);
                                var args__7059 = cljs.core._rest.call(null, args__7057);
                                if(argc === 15) {
                                  if(f__7040.cljs$lang$arity$15) {
                                    return f__7040.cljs$lang$arity$15(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058)
                                  }else {
                                    return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058)
                                  }
                                }else {
                                  var p__7060 = cljs.core._first.call(null, args__7059);
                                  var args__7061 = cljs.core._rest.call(null, args__7059);
                                  if(argc === 16) {
                                    if(f__7040.cljs$lang$arity$16) {
                                      return f__7040.cljs$lang$arity$16(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060)
                                    }else {
                                      return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060)
                                    }
                                  }else {
                                    var q__7062 = cljs.core._first.call(null, args__7061);
                                    var args__7063 = cljs.core._rest.call(null, args__7061);
                                    if(argc === 17) {
                                      if(f__7040.cljs$lang$arity$17) {
                                        return f__7040.cljs$lang$arity$17(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062)
                                      }else {
                                        return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062)
                                      }
                                    }else {
                                      var r__7064 = cljs.core._first.call(null, args__7063);
                                      var args__7065 = cljs.core._rest.call(null, args__7063);
                                      if(argc === 18) {
                                        if(f__7040.cljs$lang$arity$18) {
                                          return f__7040.cljs$lang$arity$18(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064)
                                        }else {
                                          return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064)
                                        }
                                      }else {
                                        var s__7066 = cljs.core._first.call(null, args__7065);
                                        var args__7067 = cljs.core._rest.call(null, args__7065);
                                        if(argc === 19) {
                                          if(f__7040.cljs$lang$arity$19) {
                                            return f__7040.cljs$lang$arity$19(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064, s__7066)
                                          }else {
                                            return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064, s__7066)
                                          }
                                        }else {
                                          var t__7068 = cljs.core._first.call(null, args__7067);
                                          var args__7069 = cljs.core._rest.call(null, args__7067);
                                          if(argc === 20) {
                                            if(f__7040.cljs$lang$arity$20) {
                                              return f__7040.cljs$lang$arity$20(a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064, s__7066, t__7068)
                                            }else {
                                              return f__7040.call(null, a__7030, b__7032, c__7034, d__7036, e__7038, f__7040, g__7042, h__7044, i__7046, j__7048, k__7050, l__7052, m__7054, n__7056, o__7058, p__7060, q__7062, r__7064, s__7066, t__7068)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7070 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7071 = cljs.core.bounded_count.call(null, args, fixed_arity__7070 + 1);
      if(bc__7071 <= fixed_arity__7070) {
        return cljs.core.apply_to.call(null, f, bc__7071, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7072 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7073 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7074 = cljs.core.bounded_count.call(null, arglist__7072, fixed_arity__7073 + 1);
      if(bc__7074 <= fixed_arity__7073) {
        return cljs.core.apply_to.call(null, f, bc__7074, arglist__7072)
      }else {
        return f.cljs$lang$applyTo(arglist__7072)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7072))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7075 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7076 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7077 = cljs.core.bounded_count.call(null, arglist__7075, fixed_arity__7076 + 1);
      if(bc__7077 <= fixed_arity__7076) {
        return cljs.core.apply_to.call(null, f, bc__7077, arglist__7075)
      }else {
        return f.cljs$lang$applyTo(arglist__7075)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7075))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7078 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7079 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7080 = cljs.core.bounded_count.call(null, arglist__7078, fixed_arity__7079 + 1);
      if(bc__7080 <= fixed_arity__7079) {
        return cljs.core.apply_to.call(null, f, bc__7080, arglist__7078)
      }else {
        return f.cljs$lang$applyTo(arglist__7078)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7078))
    }
  };
  var apply__6 = function() {
    var G__7084__delegate = function(f, a, b, c, d, args) {
      var arglist__7081 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7082 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7083 = cljs.core.bounded_count.call(null, arglist__7081, fixed_arity__7082 + 1);
        if(bc__7083 <= fixed_arity__7082) {
          return cljs.core.apply_to.call(null, f, bc__7083, arglist__7081)
        }else {
          return f.cljs$lang$applyTo(arglist__7081)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7081))
      }
    };
    var G__7084 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7084__delegate.call(this, f, a, b, c, d, args)
    };
    G__7084.cljs$lang$maxFixedArity = 5;
    G__7084.cljs$lang$applyTo = function(arglist__7085) {
      var f = cljs.core.first(arglist__7085);
      var a = cljs.core.first(cljs.core.next(arglist__7085));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7085)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7085)))));
      return G__7084__delegate(f, a, b, c, d, args)
    };
    G__7084.cljs$lang$arity$variadic = G__7084__delegate;
    return G__7084
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7086) {
    var obj = cljs.core.first(arglist__7086);
    var f = cljs.core.first(cljs.core.next(arglist__7086));
    var args = cljs.core.rest(cljs.core.next(arglist__7086));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__7087__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7087 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7087__delegate.call(this, x, y, more)
    };
    G__7087.cljs$lang$maxFixedArity = 2;
    G__7087.cljs$lang$applyTo = function(arglist__7088) {
      var x = cljs.core.first(arglist__7088);
      var y = cljs.core.first(cljs.core.next(arglist__7088));
      var more = cljs.core.rest(cljs.core.next(arglist__7088));
      return G__7087__delegate(x, y, more)
    };
    G__7087.cljs$lang$arity$variadic = G__7087__delegate;
    return G__7087
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7089 = pred;
        var G__7090 = cljs.core.next.call(null, coll);
        pred = G__7089;
        coll = G__7090;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3548__auto____7091 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3548__auto____7091)) {
        return or__3548__auto____7091
      }else {
        var G__7092 = pred;
        var G__7093 = cljs.core.next.call(null, coll);
        pred = G__7092;
        coll = G__7093;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7094 = null;
    var G__7094__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7094__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7094__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7094__3 = function() {
      var G__7095__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7095 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7095__delegate.call(this, x, y, zs)
      };
      G__7095.cljs$lang$maxFixedArity = 2;
      G__7095.cljs$lang$applyTo = function(arglist__7096) {
        var x = cljs.core.first(arglist__7096);
        var y = cljs.core.first(cljs.core.next(arglist__7096));
        var zs = cljs.core.rest(cljs.core.next(arglist__7096));
        return G__7095__delegate(x, y, zs)
      };
      G__7095.cljs$lang$arity$variadic = G__7095__delegate;
      return G__7095
    }();
    G__7094 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7094__0.call(this);
        case 1:
          return G__7094__1.call(this, x);
        case 2:
          return G__7094__2.call(this, x, y);
        default:
          return G__7094__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7094.cljs$lang$maxFixedArity = 2;
    G__7094.cljs$lang$applyTo = G__7094__3.cljs$lang$applyTo;
    return G__7094
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7097__delegate = function(args) {
      return x
    };
    var G__7097 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7097__delegate.call(this, args)
    };
    G__7097.cljs$lang$maxFixedArity = 0;
    G__7097.cljs$lang$applyTo = function(arglist__7098) {
      var args = cljs.core.seq(arglist__7098);
      return G__7097__delegate(args)
    };
    G__7097.cljs$lang$arity$variadic = G__7097__delegate;
    return G__7097
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7102 = null;
      var G__7102__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7102__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7102__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7102__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7102__4 = function() {
        var G__7103__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7103 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7103__delegate.call(this, x, y, z, args)
        };
        G__7103.cljs$lang$maxFixedArity = 3;
        G__7103.cljs$lang$applyTo = function(arglist__7104) {
          var x = cljs.core.first(arglist__7104);
          var y = cljs.core.first(cljs.core.next(arglist__7104));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7104)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7104)));
          return G__7103__delegate(x, y, z, args)
        };
        G__7103.cljs$lang$arity$variadic = G__7103__delegate;
        return G__7103
      }();
      G__7102 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7102__0.call(this);
          case 1:
            return G__7102__1.call(this, x);
          case 2:
            return G__7102__2.call(this, x, y);
          case 3:
            return G__7102__3.call(this, x, y, z);
          default:
            return G__7102__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7102.cljs$lang$maxFixedArity = 3;
      G__7102.cljs$lang$applyTo = G__7102__4.cljs$lang$applyTo;
      return G__7102
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7105 = null;
      var G__7105__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7105__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7105__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7105__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7105__4 = function() {
        var G__7106__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7106 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7106__delegate.call(this, x, y, z, args)
        };
        G__7106.cljs$lang$maxFixedArity = 3;
        G__7106.cljs$lang$applyTo = function(arglist__7107) {
          var x = cljs.core.first(arglist__7107);
          var y = cljs.core.first(cljs.core.next(arglist__7107));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7107)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7107)));
          return G__7106__delegate(x, y, z, args)
        };
        G__7106.cljs$lang$arity$variadic = G__7106__delegate;
        return G__7106
      }();
      G__7105 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7105__0.call(this);
          case 1:
            return G__7105__1.call(this, x);
          case 2:
            return G__7105__2.call(this, x, y);
          case 3:
            return G__7105__3.call(this, x, y, z);
          default:
            return G__7105__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7105.cljs$lang$maxFixedArity = 3;
      G__7105.cljs$lang$applyTo = G__7105__4.cljs$lang$applyTo;
      return G__7105
    }()
  };
  var comp__4 = function() {
    var G__7108__delegate = function(f1, f2, f3, fs) {
      var fs__7099 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7109__delegate = function(args) {
          var ret__7100 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7099), args);
          var fs__7101 = cljs.core.next.call(null, fs__7099);
          while(true) {
            if(cljs.core.truth_(fs__7101)) {
              var G__7110 = cljs.core.first.call(null, fs__7101).call(null, ret__7100);
              var G__7111 = cljs.core.next.call(null, fs__7101);
              ret__7100 = G__7110;
              fs__7101 = G__7111;
              continue
            }else {
              return ret__7100
            }
            break
          }
        };
        var G__7109 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7109__delegate.call(this, args)
        };
        G__7109.cljs$lang$maxFixedArity = 0;
        G__7109.cljs$lang$applyTo = function(arglist__7112) {
          var args = cljs.core.seq(arglist__7112);
          return G__7109__delegate(args)
        };
        G__7109.cljs$lang$arity$variadic = G__7109__delegate;
        return G__7109
      }()
    };
    var G__7108 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7108__delegate.call(this, f1, f2, f3, fs)
    };
    G__7108.cljs$lang$maxFixedArity = 3;
    G__7108.cljs$lang$applyTo = function(arglist__7113) {
      var f1 = cljs.core.first(arglist__7113);
      var f2 = cljs.core.first(cljs.core.next(arglist__7113));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7113)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7113)));
      return G__7108__delegate(f1, f2, f3, fs)
    };
    G__7108.cljs$lang$arity$variadic = G__7108__delegate;
    return G__7108
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7114__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7114 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7114__delegate.call(this, args)
      };
      G__7114.cljs$lang$maxFixedArity = 0;
      G__7114.cljs$lang$applyTo = function(arglist__7115) {
        var args = cljs.core.seq(arglist__7115);
        return G__7114__delegate(args)
      };
      G__7114.cljs$lang$arity$variadic = G__7114__delegate;
      return G__7114
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7116__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7116 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7116__delegate.call(this, args)
      };
      G__7116.cljs$lang$maxFixedArity = 0;
      G__7116.cljs$lang$applyTo = function(arglist__7117) {
        var args = cljs.core.seq(arglist__7117);
        return G__7116__delegate(args)
      };
      G__7116.cljs$lang$arity$variadic = G__7116__delegate;
      return G__7116
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7118__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7118 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7118__delegate.call(this, args)
      };
      G__7118.cljs$lang$maxFixedArity = 0;
      G__7118.cljs$lang$applyTo = function(arglist__7119) {
        var args = cljs.core.seq(arglist__7119);
        return G__7118__delegate(args)
      };
      G__7118.cljs$lang$arity$variadic = G__7118__delegate;
      return G__7118
    }()
  };
  var partial__5 = function() {
    var G__7120__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7121__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7121 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7121__delegate.call(this, args)
        };
        G__7121.cljs$lang$maxFixedArity = 0;
        G__7121.cljs$lang$applyTo = function(arglist__7122) {
          var args = cljs.core.seq(arglist__7122);
          return G__7121__delegate(args)
        };
        G__7121.cljs$lang$arity$variadic = G__7121__delegate;
        return G__7121
      }()
    };
    var G__7120 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7120__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7120.cljs$lang$maxFixedArity = 4;
    G__7120.cljs$lang$applyTo = function(arglist__7123) {
      var f = cljs.core.first(arglist__7123);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7123));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7123)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7123))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7123))));
      return G__7120__delegate(f, arg1, arg2, arg3, more)
    };
    G__7120.cljs$lang$arity$variadic = G__7120__delegate;
    return G__7120
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7124 = null;
      var G__7124__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7124__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7124__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7124__4 = function() {
        var G__7125__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7125 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7125__delegate.call(this, a, b, c, ds)
        };
        G__7125.cljs$lang$maxFixedArity = 3;
        G__7125.cljs$lang$applyTo = function(arglist__7126) {
          var a = cljs.core.first(arglist__7126);
          var b = cljs.core.first(cljs.core.next(arglist__7126));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7126)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7126)));
          return G__7125__delegate(a, b, c, ds)
        };
        G__7125.cljs$lang$arity$variadic = G__7125__delegate;
        return G__7125
      }();
      G__7124 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7124__1.call(this, a);
          case 2:
            return G__7124__2.call(this, a, b);
          case 3:
            return G__7124__3.call(this, a, b, c);
          default:
            return G__7124__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7124.cljs$lang$maxFixedArity = 3;
      G__7124.cljs$lang$applyTo = G__7124__4.cljs$lang$applyTo;
      return G__7124
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7127 = null;
      var G__7127__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7127__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7127__4 = function() {
        var G__7128__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7128 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7128__delegate.call(this, a, b, c, ds)
        };
        G__7128.cljs$lang$maxFixedArity = 3;
        G__7128.cljs$lang$applyTo = function(arglist__7129) {
          var a = cljs.core.first(arglist__7129);
          var b = cljs.core.first(cljs.core.next(arglist__7129));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7129)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7129)));
          return G__7128__delegate(a, b, c, ds)
        };
        G__7128.cljs$lang$arity$variadic = G__7128__delegate;
        return G__7128
      }();
      G__7127 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7127__2.call(this, a, b);
          case 3:
            return G__7127__3.call(this, a, b, c);
          default:
            return G__7127__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7127.cljs$lang$maxFixedArity = 3;
      G__7127.cljs$lang$applyTo = G__7127__4.cljs$lang$applyTo;
      return G__7127
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7130 = null;
      var G__7130__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7130__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7130__4 = function() {
        var G__7131__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7131 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7131__delegate.call(this, a, b, c, ds)
        };
        G__7131.cljs$lang$maxFixedArity = 3;
        G__7131.cljs$lang$applyTo = function(arglist__7132) {
          var a = cljs.core.first(arglist__7132);
          var b = cljs.core.first(cljs.core.next(arglist__7132));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7132)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7132)));
          return G__7131__delegate(a, b, c, ds)
        };
        G__7131.cljs$lang$arity$variadic = G__7131__delegate;
        return G__7131
      }();
      G__7130 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7130__2.call(this, a, b);
          case 3:
            return G__7130__3.call(this, a, b, c);
          default:
            return G__7130__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7130.cljs$lang$maxFixedArity = 3;
      G__7130.cljs$lang$applyTo = G__7130__4.cljs$lang$applyTo;
      return G__7130
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7135 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7133 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7133)) {
        var s__7134 = temp__3698__auto____7133;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7134)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__7134)))
      }else {
        return null
      }
    })
  };
  return mapi__7135.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____7136 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____7136)) {
      var s__7137 = temp__3698__auto____7136;
      var x__7138 = f.call(null, cljs.core.first.call(null, s__7137));
      if(x__7138 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__7137))
      }else {
        return cljs.core.cons.call(null, x__7138, keep.call(null, f, cljs.core.rest.call(null, s__7137)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7148 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7145 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7145)) {
        var s__7146 = temp__3698__auto____7145;
        var x__7147 = f.call(null, idx, cljs.core.first.call(null, s__7146));
        if(x__7147 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__7146))
        }else {
          return cljs.core.cons.call(null, x__7147, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__7146)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__7148.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7155 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7155)) {
            return p.call(null, y)
          }else {
            return and__3546__auto____7155
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7156 = p.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7156)) {
            var and__3546__auto____7157 = p.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7157)) {
              return p.call(null, z)
            }else {
              return and__3546__auto____7157
            }
          }else {
            return and__3546__auto____7156
          }
        }())
      };
      var ep1__4 = function() {
        var G__7193__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____7158 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____7158)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3546__auto____7158
            }
          }())
        };
        var G__7193 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7193__delegate.call(this, x, y, z, args)
        };
        G__7193.cljs$lang$maxFixedArity = 3;
        G__7193.cljs$lang$applyTo = function(arglist__7194) {
          var x = cljs.core.first(arglist__7194);
          var y = cljs.core.first(cljs.core.next(arglist__7194));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7194)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7194)));
          return G__7193__delegate(x, y, z, args)
        };
        G__7193.cljs$lang$arity$variadic = G__7193__delegate;
        return G__7193
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7159 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7159)) {
            return p2.call(null, x)
          }else {
            return and__3546__auto____7159
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7160 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7160)) {
            var and__3546__auto____7161 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7161)) {
              var and__3546__auto____7162 = p2.call(null, x);
              if(cljs.core.truth_(and__3546__auto____7162)) {
                return p2.call(null, y)
              }else {
                return and__3546__auto____7162
              }
            }else {
              return and__3546__auto____7161
            }
          }else {
            return and__3546__auto____7160
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7163 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7163)) {
            var and__3546__auto____7164 = p1.call(null, y);
            if(cljs.core.truth_(and__3546__auto____7164)) {
              var and__3546__auto____7165 = p1.call(null, z);
              if(cljs.core.truth_(and__3546__auto____7165)) {
                var and__3546__auto____7166 = p2.call(null, x);
                if(cljs.core.truth_(and__3546__auto____7166)) {
                  var and__3546__auto____7167 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____7167)) {
                    return p2.call(null, z)
                  }else {
                    return and__3546__auto____7167
                  }
                }else {
                  return and__3546__auto____7166
                }
              }else {
                return and__3546__auto____7165
              }
            }else {
              return and__3546__auto____7164
            }
          }else {
            return and__3546__auto____7163
          }
        }())
      };
      var ep2__4 = function() {
        var G__7195__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____7168 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____7168)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7139_SHARP_) {
                var and__3546__auto____7169 = p1.call(null, p1__7139_SHARP_);
                if(cljs.core.truth_(and__3546__auto____7169)) {
                  return p2.call(null, p1__7139_SHARP_)
                }else {
                  return and__3546__auto____7169
                }
              }, args)
            }else {
              return and__3546__auto____7168
            }
          }())
        };
        var G__7195 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7195__delegate.call(this, x, y, z, args)
        };
        G__7195.cljs$lang$maxFixedArity = 3;
        G__7195.cljs$lang$applyTo = function(arglist__7196) {
          var x = cljs.core.first(arglist__7196);
          var y = cljs.core.first(cljs.core.next(arglist__7196));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7196)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7196)));
          return G__7195__delegate(x, y, z, args)
        };
        G__7195.cljs$lang$arity$variadic = G__7195__delegate;
        return G__7195
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7170 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7170)) {
            var and__3546__auto____7171 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____7171)) {
              return p3.call(null, x)
            }else {
              return and__3546__auto____7171
            }
          }else {
            return and__3546__auto____7170
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7172 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7172)) {
            var and__3546__auto____7173 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____7173)) {
              var and__3546__auto____7174 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____7174)) {
                var and__3546__auto____7175 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____7175)) {
                  var and__3546__auto____7176 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____7176)) {
                    return p3.call(null, y)
                  }else {
                    return and__3546__auto____7176
                  }
                }else {
                  return and__3546__auto____7175
                }
              }else {
                return and__3546__auto____7174
              }
            }else {
              return and__3546__auto____7173
            }
          }else {
            return and__3546__auto____7172
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3546__auto____7177 = p1.call(null, x);
          if(cljs.core.truth_(and__3546__auto____7177)) {
            var and__3546__auto____7178 = p2.call(null, x);
            if(cljs.core.truth_(and__3546__auto____7178)) {
              var and__3546__auto____7179 = p3.call(null, x);
              if(cljs.core.truth_(and__3546__auto____7179)) {
                var and__3546__auto____7180 = p1.call(null, y);
                if(cljs.core.truth_(and__3546__auto____7180)) {
                  var and__3546__auto____7181 = p2.call(null, y);
                  if(cljs.core.truth_(and__3546__auto____7181)) {
                    var and__3546__auto____7182 = p3.call(null, y);
                    if(cljs.core.truth_(and__3546__auto____7182)) {
                      var and__3546__auto____7183 = p1.call(null, z);
                      if(cljs.core.truth_(and__3546__auto____7183)) {
                        var and__3546__auto____7184 = p2.call(null, z);
                        if(cljs.core.truth_(and__3546__auto____7184)) {
                          return p3.call(null, z)
                        }else {
                          return and__3546__auto____7184
                        }
                      }else {
                        return and__3546__auto____7183
                      }
                    }else {
                      return and__3546__auto____7182
                    }
                  }else {
                    return and__3546__auto____7181
                  }
                }else {
                  return and__3546__auto____7180
                }
              }else {
                return and__3546__auto____7179
              }
            }else {
              return and__3546__auto____7178
            }
          }else {
            return and__3546__auto____7177
          }
        }())
      };
      var ep3__4 = function() {
        var G__7197__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3546__auto____7185 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3546__auto____7185)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7140_SHARP_) {
                var and__3546__auto____7186 = p1.call(null, p1__7140_SHARP_);
                if(cljs.core.truth_(and__3546__auto____7186)) {
                  var and__3546__auto____7187 = p2.call(null, p1__7140_SHARP_);
                  if(cljs.core.truth_(and__3546__auto____7187)) {
                    return p3.call(null, p1__7140_SHARP_)
                  }else {
                    return and__3546__auto____7187
                  }
                }else {
                  return and__3546__auto____7186
                }
              }, args)
            }else {
              return and__3546__auto____7185
            }
          }())
        };
        var G__7197 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7197__delegate.call(this, x, y, z, args)
        };
        G__7197.cljs$lang$maxFixedArity = 3;
        G__7197.cljs$lang$applyTo = function(arglist__7198) {
          var x = cljs.core.first(arglist__7198);
          var y = cljs.core.first(cljs.core.next(arglist__7198));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7198)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7198)));
          return G__7197__delegate(x, y, z, args)
        };
        G__7197.cljs$lang$arity$variadic = G__7197__delegate;
        return G__7197
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7199__delegate = function(p1, p2, p3, ps) {
      var ps__7188 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7141_SHARP_) {
            return p1__7141_SHARP_.call(null, x)
          }, ps__7188)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7142_SHARP_) {
            var and__3546__auto____7189 = p1__7142_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____7189)) {
              return p1__7142_SHARP_.call(null, y)
            }else {
              return and__3546__auto____7189
            }
          }, ps__7188)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7143_SHARP_) {
            var and__3546__auto____7190 = p1__7143_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3546__auto____7190)) {
              var and__3546__auto____7191 = p1__7143_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3546__auto____7191)) {
                return p1__7143_SHARP_.call(null, z)
              }else {
                return and__3546__auto____7191
              }
            }else {
              return and__3546__auto____7190
            }
          }, ps__7188)
        };
        var epn__4 = function() {
          var G__7200__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3546__auto____7192 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3546__auto____7192)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7144_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7144_SHARP_, args)
                }, ps__7188)
              }else {
                return and__3546__auto____7192
              }
            }())
          };
          var G__7200 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7200__delegate.call(this, x, y, z, args)
          };
          G__7200.cljs$lang$maxFixedArity = 3;
          G__7200.cljs$lang$applyTo = function(arglist__7201) {
            var x = cljs.core.first(arglist__7201);
            var y = cljs.core.first(cljs.core.next(arglist__7201));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7201)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7201)));
            return G__7200__delegate(x, y, z, args)
          };
          G__7200.cljs$lang$arity$variadic = G__7200__delegate;
          return G__7200
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7199 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7199__delegate.call(this, p1, p2, p3, ps)
    };
    G__7199.cljs$lang$maxFixedArity = 3;
    G__7199.cljs$lang$applyTo = function(arglist__7202) {
      var p1 = cljs.core.first(arglist__7202);
      var p2 = cljs.core.first(cljs.core.next(arglist__7202));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7202)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7202)));
      return G__7199__delegate(p1, p2, p3, ps)
    };
    G__7199.cljs$lang$arity$variadic = G__7199__delegate;
    return G__7199
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3548__auto____7204 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7204)) {
          return or__3548__auto____7204
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3548__auto____7205 = p.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7205)) {
          return or__3548__auto____7205
        }else {
          var or__3548__auto____7206 = p.call(null, y);
          if(cljs.core.truth_(or__3548__auto____7206)) {
            return or__3548__auto____7206
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7242__delegate = function(x, y, z, args) {
          var or__3548__auto____7207 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____7207)) {
            return or__3548__auto____7207
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7242 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7242__delegate.call(this, x, y, z, args)
        };
        G__7242.cljs$lang$maxFixedArity = 3;
        G__7242.cljs$lang$applyTo = function(arglist__7243) {
          var x = cljs.core.first(arglist__7243);
          var y = cljs.core.first(cljs.core.next(arglist__7243));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7243)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7243)));
          return G__7242__delegate(x, y, z, args)
        };
        G__7242.cljs$lang$arity$variadic = G__7242__delegate;
        return G__7242
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3548__auto____7208 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7208)) {
          return or__3548__auto____7208
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3548__auto____7209 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7209)) {
          return or__3548__auto____7209
        }else {
          var or__3548__auto____7210 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____7210)) {
            return or__3548__auto____7210
          }else {
            var or__3548__auto____7211 = p2.call(null, x);
            if(cljs.core.truth_(or__3548__auto____7211)) {
              return or__3548__auto____7211
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3548__auto____7212 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7212)) {
          return or__3548__auto____7212
        }else {
          var or__3548__auto____7213 = p1.call(null, y);
          if(cljs.core.truth_(or__3548__auto____7213)) {
            return or__3548__auto____7213
          }else {
            var or__3548__auto____7214 = p1.call(null, z);
            if(cljs.core.truth_(or__3548__auto____7214)) {
              return or__3548__auto____7214
            }else {
              var or__3548__auto____7215 = p2.call(null, x);
              if(cljs.core.truth_(or__3548__auto____7215)) {
                return or__3548__auto____7215
              }else {
                var or__3548__auto____7216 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____7216)) {
                  return or__3548__auto____7216
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7244__delegate = function(x, y, z, args) {
          var or__3548__auto____7217 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____7217)) {
            return or__3548__auto____7217
          }else {
            return cljs.core.some.call(null, function(p1__7149_SHARP_) {
              var or__3548__auto____7218 = p1.call(null, p1__7149_SHARP_);
              if(cljs.core.truth_(or__3548__auto____7218)) {
                return or__3548__auto____7218
              }else {
                return p2.call(null, p1__7149_SHARP_)
              }
            }, args)
          }
        };
        var G__7244 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7244__delegate.call(this, x, y, z, args)
        };
        G__7244.cljs$lang$maxFixedArity = 3;
        G__7244.cljs$lang$applyTo = function(arglist__7245) {
          var x = cljs.core.first(arglist__7245);
          var y = cljs.core.first(cljs.core.next(arglist__7245));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7245)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7245)));
          return G__7244__delegate(x, y, z, args)
        };
        G__7244.cljs$lang$arity$variadic = G__7244__delegate;
        return G__7244
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3548__auto____7219 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7219)) {
          return or__3548__auto____7219
        }else {
          var or__3548__auto____7220 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____7220)) {
            return or__3548__auto____7220
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3548__auto____7221 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7221)) {
          return or__3548__auto____7221
        }else {
          var or__3548__auto____7222 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____7222)) {
            return or__3548__auto____7222
          }else {
            var or__3548__auto____7223 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____7223)) {
              return or__3548__auto____7223
            }else {
              var or__3548__auto____7224 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____7224)) {
                return or__3548__auto____7224
              }else {
                var or__3548__auto____7225 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____7225)) {
                  return or__3548__auto____7225
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3548__auto____7226 = p1.call(null, x);
        if(cljs.core.truth_(or__3548__auto____7226)) {
          return or__3548__auto____7226
        }else {
          var or__3548__auto____7227 = p2.call(null, x);
          if(cljs.core.truth_(or__3548__auto____7227)) {
            return or__3548__auto____7227
          }else {
            var or__3548__auto____7228 = p3.call(null, x);
            if(cljs.core.truth_(or__3548__auto____7228)) {
              return or__3548__auto____7228
            }else {
              var or__3548__auto____7229 = p1.call(null, y);
              if(cljs.core.truth_(or__3548__auto____7229)) {
                return or__3548__auto____7229
              }else {
                var or__3548__auto____7230 = p2.call(null, y);
                if(cljs.core.truth_(or__3548__auto____7230)) {
                  return or__3548__auto____7230
                }else {
                  var or__3548__auto____7231 = p3.call(null, y);
                  if(cljs.core.truth_(or__3548__auto____7231)) {
                    return or__3548__auto____7231
                  }else {
                    var or__3548__auto____7232 = p1.call(null, z);
                    if(cljs.core.truth_(or__3548__auto____7232)) {
                      return or__3548__auto____7232
                    }else {
                      var or__3548__auto____7233 = p2.call(null, z);
                      if(cljs.core.truth_(or__3548__auto____7233)) {
                        return or__3548__auto____7233
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7246__delegate = function(x, y, z, args) {
          var or__3548__auto____7234 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3548__auto____7234)) {
            return or__3548__auto____7234
          }else {
            return cljs.core.some.call(null, function(p1__7150_SHARP_) {
              var or__3548__auto____7235 = p1.call(null, p1__7150_SHARP_);
              if(cljs.core.truth_(or__3548__auto____7235)) {
                return or__3548__auto____7235
              }else {
                var or__3548__auto____7236 = p2.call(null, p1__7150_SHARP_);
                if(cljs.core.truth_(or__3548__auto____7236)) {
                  return or__3548__auto____7236
                }else {
                  return p3.call(null, p1__7150_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7246 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7246__delegate.call(this, x, y, z, args)
        };
        G__7246.cljs$lang$maxFixedArity = 3;
        G__7246.cljs$lang$applyTo = function(arglist__7247) {
          var x = cljs.core.first(arglist__7247);
          var y = cljs.core.first(cljs.core.next(arglist__7247));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7247)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7247)));
          return G__7246__delegate(x, y, z, args)
        };
        G__7246.cljs$lang$arity$variadic = G__7246__delegate;
        return G__7246
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7248__delegate = function(p1, p2, p3, ps) {
      var ps__7237 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7151_SHARP_) {
            return p1__7151_SHARP_.call(null, x)
          }, ps__7237)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7152_SHARP_) {
            var or__3548__auto____7238 = p1__7152_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____7238)) {
              return or__3548__auto____7238
            }else {
              return p1__7152_SHARP_.call(null, y)
            }
          }, ps__7237)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7153_SHARP_) {
            var or__3548__auto____7239 = p1__7153_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3548__auto____7239)) {
              return or__3548__auto____7239
            }else {
              var or__3548__auto____7240 = p1__7153_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3548__auto____7240)) {
                return or__3548__auto____7240
              }else {
                return p1__7153_SHARP_.call(null, z)
              }
            }
          }, ps__7237)
        };
        var spn__4 = function() {
          var G__7249__delegate = function(x, y, z, args) {
            var or__3548__auto____7241 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3548__auto____7241)) {
              return or__3548__auto____7241
            }else {
              return cljs.core.some.call(null, function(p1__7154_SHARP_) {
                return cljs.core.some.call(null, p1__7154_SHARP_, args)
              }, ps__7237)
            }
          };
          var G__7249 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7249__delegate.call(this, x, y, z, args)
          };
          G__7249.cljs$lang$maxFixedArity = 3;
          G__7249.cljs$lang$applyTo = function(arglist__7250) {
            var x = cljs.core.first(arglist__7250);
            var y = cljs.core.first(cljs.core.next(arglist__7250));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7250)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7250)));
            return G__7249__delegate(x, y, z, args)
          };
          G__7249.cljs$lang$arity$variadic = G__7249__delegate;
          return G__7249
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7248 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7248__delegate.call(this, p1, p2, p3, ps)
    };
    G__7248.cljs$lang$maxFixedArity = 3;
    G__7248.cljs$lang$applyTo = function(arglist__7251) {
      var p1 = cljs.core.first(arglist__7251);
      var p2 = cljs.core.first(cljs.core.next(arglist__7251));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7251)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7251)));
      return G__7248__delegate(p1, p2, p3, ps)
    };
    G__7248.cljs$lang$arity$variadic = G__7248__delegate;
    return G__7248
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7252 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7252)) {
        var s__7253 = temp__3698__auto____7252;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__7253)), map.call(null, f, cljs.core.rest.call(null, s__7253)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7254 = cljs.core.seq.call(null, c1);
      var s2__7255 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____7256 = s1__7254;
        if(cljs.core.truth_(and__3546__auto____7256)) {
          return s2__7255
        }else {
          return and__3546__auto____7256
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7254), cljs.core.first.call(null, s2__7255)), map.call(null, f, cljs.core.rest.call(null, s1__7254), cljs.core.rest.call(null, s2__7255)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7257 = cljs.core.seq.call(null, c1);
      var s2__7258 = cljs.core.seq.call(null, c2);
      var s3__7259 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3546__auto____7260 = s1__7257;
        if(cljs.core.truth_(and__3546__auto____7260)) {
          var and__3546__auto____7261 = s2__7258;
          if(cljs.core.truth_(and__3546__auto____7261)) {
            return s3__7259
          }else {
            return and__3546__auto____7261
          }
        }else {
          return and__3546__auto____7260
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7257), cljs.core.first.call(null, s2__7258), cljs.core.first.call(null, s3__7259)), map.call(null, f, cljs.core.rest.call(null, s1__7257), cljs.core.rest.call(null, s2__7258), cljs.core.rest.call(null, s3__7259)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__7264__delegate = function(f, c1, c2, c3, colls) {
      var step__7263 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__7262 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7262)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__7262), step.call(null, map.call(null, cljs.core.rest, ss__7262)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__7203_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7203_SHARP_)
      }, step__7263.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__7264 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7264__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7264.cljs$lang$maxFixedArity = 4;
    G__7264.cljs$lang$applyTo = function(arglist__7265) {
      var f = cljs.core.first(arglist__7265);
      var c1 = cljs.core.first(cljs.core.next(arglist__7265));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7265)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7265))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7265))));
      return G__7264__delegate(f, c1, c2, c3, colls)
    };
    G__7264.cljs$lang$arity$variadic = G__7264__delegate;
    return G__7264
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3698__auto____7266 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7266)) {
        var s__7267 = temp__3698__auto____7266;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__7267), take.call(null, n - 1, cljs.core.rest.call(null, s__7267)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__7270 = function(n, coll) {
    while(true) {
      var s__7268 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____7269 = n > 0;
        if(and__3546__auto____7269) {
          return s__7268
        }else {
          return and__3546__auto____7269
        }
      }())) {
        var G__7271 = n - 1;
        var G__7272 = cljs.core.rest.call(null, s__7268);
        n = G__7271;
        coll = G__7272;
        continue
      }else {
        return s__7268
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7270.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__7273 = cljs.core.seq.call(null, coll);
  var lead__7274 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__7274)) {
      var G__7275 = cljs.core.next.call(null, s__7273);
      var G__7276 = cljs.core.next.call(null, lead__7274);
      s__7273 = G__7275;
      lead__7274 = G__7276;
      continue
    }else {
      return s__7273
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__7279 = function(pred, coll) {
    while(true) {
      var s__7277 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3546__auto____7278 = s__7277;
        if(cljs.core.truth_(and__3546__auto____7278)) {
          return pred.call(null, cljs.core.first.call(null, s__7277))
        }else {
          return and__3546__auto____7278
        }
      }())) {
        var G__7280 = pred;
        var G__7281 = cljs.core.rest.call(null, s__7277);
        pred = G__7280;
        coll = G__7281;
        continue
      }else {
        return s__7277
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__7279.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____7282 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____7282)) {
      var s__7283 = temp__3698__auto____7282;
      return cljs.core.concat.call(null, s__7283, cycle.call(null, s__7283))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7284 = cljs.core.seq.call(null, c1);
      var s2__7285 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3546__auto____7286 = s1__7284;
        if(cljs.core.truth_(and__3546__auto____7286)) {
          return s2__7285
        }else {
          return and__3546__auto____7286
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__7284), cljs.core.cons.call(null, cljs.core.first.call(null, s2__7285), interleave.call(null, cljs.core.rest.call(null, s1__7284), cljs.core.rest.call(null, s2__7285))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__7288__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__7287 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7287)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__7287), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__7287)))
        }else {
          return null
        }
      })
    };
    var G__7288 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7288__delegate.call(this, c1, c2, colls)
    };
    G__7288.cljs$lang$maxFixedArity = 2;
    G__7288.cljs$lang$applyTo = function(arglist__7289) {
      var c1 = cljs.core.first(arglist__7289);
      var c2 = cljs.core.first(cljs.core.next(arglist__7289));
      var colls = cljs.core.rest(cljs.core.next(arglist__7289));
      return G__7288__delegate(c1, c2, colls)
    };
    G__7288.cljs$lang$arity$variadic = G__7288__delegate;
    return G__7288
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__7292 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____7290 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____7290)) {
        var coll__7291 = temp__3695__auto____7290;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__7291), cat.call(null, cljs.core.rest.call(null, coll__7291), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__7292.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__7293__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__7293 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7293__delegate.call(this, f, coll, colls)
    };
    G__7293.cljs$lang$maxFixedArity = 2;
    G__7293.cljs$lang$applyTo = function(arglist__7294) {
      var f = cljs.core.first(arglist__7294);
      var coll = cljs.core.first(cljs.core.next(arglist__7294));
      var colls = cljs.core.rest(cljs.core.next(arglist__7294));
      return G__7293__delegate(f, coll, colls)
    };
    G__7293.cljs$lang$arity$variadic = G__7293__delegate;
    return G__7293
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____7295 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____7295)) {
      var s__7296 = temp__3698__auto____7295;
      var f__7297 = cljs.core.first.call(null, s__7296);
      var r__7298 = cljs.core.rest.call(null, s__7296);
      if(cljs.core.truth_(pred.call(null, f__7297))) {
        return cljs.core.cons.call(null, f__7297, filter.call(null, pred, r__7298))
      }else {
        return filter.call(null, pred, r__7298)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__7300 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__7300.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__7299_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__7299_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__7301__7302 = to;
    if(G__7301__7302 != null) {
      if(function() {
        var or__3548__auto____7303 = G__7301__7302.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3548__auto____7303) {
          return or__3548__auto____7303
        }else {
          return G__7301__7302.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__7301__7302.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7301__7302)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__7301__7302)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__7304__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__7304 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7304__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7304.cljs$lang$maxFixedArity = 4;
    G__7304.cljs$lang$applyTo = function(arglist__7305) {
      var f = cljs.core.first(arglist__7305);
      var c1 = cljs.core.first(cljs.core.next(arglist__7305));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7305)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7305))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7305))));
      return G__7304__delegate(f, c1, c2, c3, colls)
    };
    G__7304.cljs$lang$arity$variadic = G__7304__delegate;
    return G__7304
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7306 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7306)) {
        var s__7307 = temp__3698__auto____7306;
        var p__7308 = cljs.core.take.call(null, n, s__7307);
        if(n === cljs.core.count.call(null, p__7308)) {
          return cljs.core.cons.call(null, p__7308, partition.call(null, n, step, cljs.core.drop.call(null, step, s__7307)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____7309 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____7309)) {
        var s__7310 = temp__3698__auto____7309;
        var p__7311 = cljs.core.take.call(null, n, s__7310);
        if(n === cljs.core.count.call(null, p__7311)) {
          return cljs.core.cons.call(null, p__7311, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__7310)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__7311, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__7312 = cljs.core.lookup_sentinel;
    var m__7313 = m;
    var ks__7314 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__7314)) {
        var m__7315 = cljs.core.get.call(null, m__7313, cljs.core.first.call(null, ks__7314), sentinel__7312);
        if(sentinel__7312 === m__7315) {
          return not_found
        }else {
          var G__7316 = sentinel__7312;
          var G__7317 = m__7315;
          var G__7318 = cljs.core.next.call(null, ks__7314);
          sentinel__7312 = G__7316;
          m__7313 = G__7317;
          ks__7314 = G__7318;
          continue
        }
      }else {
        return m__7313
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__7319, v) {
  var vec__7320__7321 = p__7319;
  var k__7322 = cljs.core.nth.call(null, vec__7320__7321, 0, null);
  var ks__7323 = cljs.core.nthnext.call(null, vec__7320__7321, 1);
  if(cljs.core.truth_(ks__7323)) {
    return cljs.core.assoc.call(null, m, k__7322, assoc_in.call(null, cljs.core.get.call(null, m, k__7322), ks__7323, v))
  }else {
    return cljs.core.assoc.call(null, m, k__7322, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__7324, f, args) {
    var vec__7325__7326 = p__7324;
    var k__7327 = cljs.core.nth.call(null, vec__7325__7326, 0, null);
    var ks__7328 = cljs.core.nthnext.call(null, vec__7325__7326, 1);
    if(cljs.core.truth_(ks__7328)) {
      return cljs.core.assoc.call(null, m, k__7327, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__7327), ks__7328, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__7327, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__7327), args))
    }
  };
  var update_in = function(m, p__7324, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__7324, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__7329) {
    var m = cljs.core.first(arglist__7329);
    var p__7324 = cljs.core.first(cljs.core.next(arglist__7329));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7329)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7329)));
    return update_in__delegate(m, p__7324, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7334 = this;
  var h__364__auto____7335 = this__7334.__hash;
  if(h__364__auto____7335 != null) {
    return h__364__auto____7335
  }else {
    var h__364__auto____7336 = cljs.core.hash_coll.call(null, coll);
    this__7334.__hash = h__364__auto____7336;
    return h__364__auto____7336
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7337 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7338 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7339 = this;
  var new_array__7340 = cljs.core.aclone.call(null, this__7339.array);
  new_array__7340[k] = v;
  return new cljs.core.Vector(this__7339.meta, new_array__7340, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__7369 = null;
  var G__7369__2 = function(tsym7332, k) {
    var this__7341 = this;
    var tsym7332__7342 = this;
    var coll__7343 = tsym7332__7342;
    return cljs.core._lookup.call(null, coll__7343, k)
  };
  var G__7369__3 = function(tsym7333, k, not_found) {
    var this__7344 = this;
    var tsym7333__7345 = this;
    var coll__7346 = tsym7333__7345;
    return cljs.core._lookup.call(null, coll__7346, k, not_found)
  };
  G__7369 = function(tsym7333, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7369__2.call(this, tsym7333, k);
      case 3:
        return G__7369__3.call(this, tsym7333, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7369
}();
cljs.core.Vector.prototype.apply = function(tsym7330, args7331) {
  return tsym7330.call.apply(tsym7330, [tsym7330].concat(cljs.core.aclone.call(null, args7331)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7347 = this;
  var new_array__7348 = cljs.core.aclone.call(null, this__7347.array);
  new_array__7348.push(o);
  return new cljs.core.Vector(this__7347.meta, new_array__7348, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__7349 = this;
  var this$__7350 = this;
  return cljs.core.pr_str.call(null, this$__7350)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7351 = this;
  return cljs.core.ci_reduce.call(null, this__7351.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7352 = this;
  return cljs.core.ci_reduce.call(null, this__7352.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7353 = this;
  if(this__7353.array.length > 0) {
    var vector_seq__7354 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__7353.array.length) {
          return cljs.core.cons.call(null, this__7353.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__7354.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7355 = this;
  return this__7355.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7356 = this;
  var count__7357 = this__7356.array.length;
  if(count__7357 > 0) {
    return this__7356.array[count__7357 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7358 = this;
  if(this__7358.array.length > 0) {
    var new_array__7359 = cljs.core.aclone.call(null, this__7358.array);
    new_array__7359.pop();
    return new cljs.core.Vector(this__7358.meta, new_array__7359, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7360 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7361 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7362 = this;
  return new cljs.core.Vector(meta, this__7362.array, this__7362.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7363 = this;
  return this__7363.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7365 = this;
  if(function() {
    var and__3546__auto____7366 = 0 <= n;
    if(and__3546__auto____7366) {
      return n < this__7365.array.length
    }else {
      return and__3546__auto____7366
    }
  }()) {
    return this__7365.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7367 = this;
  if(function() {
    var and__3546__auto____7368 = 0 <= n;
    if(and__3546__auto____7368) {
      return n < this__7367.array.length
    }else {
      return and__3546__auto____7368
    }
  }()) {
    return this__7367.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7364 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7364.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__7370 = pv.cnt;
  if(cnt__7370 < 32) {
    return 0
  }else {
    return cnt__7370 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__7371 = level;
  var ret__7372 = node;
  while(true) {
    if(ll__7371 === 0) {
      return ret__7372
    }else {
      var embed__7373 = ret__7372;
      var r__7374 = cljs.core.pv_fresh_node.call(null, edit);
      var ___7375 = cljs.core.pv_aset.call(null, r__7374, 0, embed__7373);
      var G__7376 = ll__7371 - 5;
      var G__7377 = r__7374;
      ll__7371 = G__7376;
      ret__7372 = G__7377;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__7378 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__7379 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__7378, subidx__7379, tailnode);
    return ret__7378
  }else {
    var temp__3695__auto____7380 = cljs.core.pv_aget.call(null, parent, subidx__7379);
    if(cljs.core.truth_(temp__3695__auto____7380)) {
      var child__7381 = temp__3695__auto____7380;
      var node_to_insert__7382 = push_tail.call(null, pv, level - 5, child__7381, tailnode);
      cljs.core.pv_aset.call(null, ret__7378, subidx__7379, node_to_insert__7382);
      return ret__7378
    }else {
      var node_to_insert__7383 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__7378, subidx__7379, node_to_insert__7383);
      return ret__7378
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3546__auto____7384 = 0 <= i;
    if(and__3546__auto____7384) {
      return i < pv.cnt
    }else {
      return and__3546__auto____7384
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__7385 = pv.root;
      var level__7386 = pv.shift;
      while(true) {
        if(level__7386 > 0) {
          var G__7387 = cljs.core.pv_aget.call(null, node__7385, i >>> level__7386 & 31);
          var G__7388 = level__7386 - 5;
          node__7385 = G__7387;
          level__7386 = G__7388;
          continue
        }else {
          return node__7385.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__7389 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__7389, i & 31, val);
    return ret__7389
  }else {
    var subidx__7390 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__7389, subidx__7390, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7390), i, val));
    return ret__7389
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__7391 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7392 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__7391));
    if(function() {
      var and__3546__auto____7393 = new_child__7392 == null;
      if(and__3546__auto____7393) {
        return subidx__7391 === 0
      }else {
        return and__3546__auto____7393
      }
    }()) {
      return null
    }else {
      var ret__7394 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__7394, subidx__7391, new_child__7392);
      return ret__7394
    }
  }else {
    if(subidx__7391 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__7395 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__7395, subidx__7391, null);
        return ret__7395
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__7396 = cljs.core._count.call(null, v);
  if(c__7396 > 0) {
    if(void 0 === cljs.core.t7397) {
      cljs.core.t7397 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t7397.cljs$lang$type = true;
      cljs.core.t7397.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t7397")
      };
      cljs.core.t7397.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t7397.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__7398 = this;
        return vseq
      };
      cljs.core.t7397.prototype.cljs$core$ISeq$ = true;
      cljs.core.t7397.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__7399 = this;
        return cljs.core._nth.call(null, this__7399.v, this__7399.offset)
      };
      cljs.core.t7397.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__7400 = this;
        var offset__7401 = this__7400.offset + 1;
        if(offset__7401 < this__7400.c) {
          return this__7400.vector_seq.call(null, this__7400.v, offset__7401)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t7397.prototype.cljs$core$ASeq$ = true;
      cljs.core.t7397.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t7397.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__7402 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t7397.prototype.cljs$core$ISequential$ = true;
      cljs.core.t7397.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t7397.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__7403 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t7397.prototype.cljs$core$IMeta$ = true;
      cljs.core.t7397.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__7404 = this;
        return this__7404.__meta__389__auto__
      };
      cljs.core.t7397.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t7397.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__7405 = this;
        return new cljs.core.t7397(this__7405.c, this__7405.offset, this__7405.v, this__7405.vector_seq, __meta__389__auto__)
      };
      cljs.core.t7397
    }else {
    }
    return new cljs.core.t7397(c__7396, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7410 = this;
  return new cljs.core.TransientVector(this__7410.cnt, this__7410.shift, cljs.core.tv_editable_root.call(null, this__7410.root), cljs.core.tv_editable_tail.call(null, this__7410.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7411 = this;
  var h__364__auto____7412 = this__7411.__hash;
  if(h__364__auto____7412 != null) {
    return h__364__auto____7412
  }else {
    var h__364__auto____7413 = cljs.core.hash_coll.call(null, coll);
    this__7411.__hash = h__364__auto____7413;
    return h__364__auto____7413
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7414 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7415 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7416 = this;
  if(function() {
    var and__3546__auto____7417 = 0 <= k;
    if(and__3546__auto____7417) {
      return k < this__7416.cnt
    }else {
      return and__3546__auto____7417
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__7418 = cljs.core.aclone.call(null, this__7416.tail);
      new_tail__7418[k & 31] = v;
      return new cljs.core.PersistentVector(this__7416.meta, this__7416.cnt, this__7416.shift, this__7416.root, new_tail__7418, null)
    }else {
      return new cljs.core.PersistentVector(this__7416.meta, this__7416.cnt, this__7416.shift, cljs.core.do_assoc.call(null, coll, this__7416.shift, this__7416.root, k, v), this__7416.tail, null)
    }
  }else {
    if(k === this__7416.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__7416.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__7463 = null;
  var G__7463__2 = function(tsym7408, k) {
    var this__7419 = this;
    var tsym7408__7420 = this;
    var coll__7421 = tsym7408__7420;
    return cljs.core._lookup.call(null, coll__7421, k)
  };
  var G__7463__3 = function(tsym7409, k, not_found) {
    var this__7422 = this;
    var tsym7409__7423 = this;
    var coll__7424 = tsym7409__7423;
    return cljs.core._lookup.call(null, coll__7424, k, not_found)
  };
  G__7463 = function(tsym7409, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7463__2.call(this, tsym7409, k);
      case 3:
        return G__7463__3.call(this, tsym7409, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7463
}();
cljs.core.PersistentVector.prototype.apply = function(tsym7406, args7407) {
  return tsym7406.call.apply(tsym7406, [tsym7406].concat(cljs.core.aclone.call(null, args7407)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__7425 = this;
  var step_init__7426 = [0, init];
  var i__7427 = 0;
  while(true) {
    if(i__7427 < this__7425.cnt) {
      var arr__7428 = cljs.core.array_for.call(null, v, i__7427);
      var len__7429 = arr__7428.length;
      var init__7433 = function() {
        var j__7430 = 0;
        var init__7431 = step_init__7426[1];
        while(true) {
          if(j__7430 < len__7429) {
            var init__7432 = f.call(null, init__7431, j__7430 + i__7427, arr__7428[j__7430]);
            if(cljs.core.reduced_QMARK_.call(null, init__7432)) {
              return init__7432
            }else {
              var G__7464 = j__7430 + 1;
              var G__7465 = init__7432;
              j__7430 = G__7464;
              init__7431 = G__7465;
              continue
            }
          }else {
            step_init__7426[0] = len__7429;
            step_init__7426[1] = init__7431;
            return init__7431
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__7433)) {
        return cljs.core.deref.call(null, init__7433)
      }else {
        var G__7466 = i__7427 + step_init__7426[0];
        i__7427 = G__7466;
        continue
      }
    }else {
      return step_init__7426[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7434 = this;
  if(this__7434.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__7435 = cljs.core.aclone.call(null, this__7434.tail);
    new_tail__7435.push(o);
    return new cljs.core.PersistentVector(this__7434.meta, this__7434.cnt + 1, this__7434.shift, this__7434.root, new_tail__7435, null)
  }else {
    var root_overflow_QMARK___7436 = this__7434.cnt >>> 5 > 1 << this__7434.shift;
    var new_shift__7437 = root_overflow_QMARK___7436 ? this__7434.shift + 5 : this__7434.shift;
    var new_root__7439 = root_overflow_QMARK___7436 ? function() {
      var n_r__7438 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__7438, 0, this__7434.root);
      cljs.core.pv_aset.call(null, n_r__7438, 1, cljs.core.new_path.call(null, null, this__7434.shift, new cljs.core.VectorNode(null, this__7434.tail)));
      return n_r__7438
    }() : cljs.core.push_tail.call(null, coll, this__7434.shift, this__7434.root, new cljs.core.VectorNode(null, this__7434.tail));
    return new cljs.core.PersistentVector(this__7434.meta, this__7434.cnt + 1, new_shift__7437, new_root__7439, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__7440 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__7441 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__7442 = this;
  var this$__7443 = this;
  return cljs.core.pr_str.call(null, this$__7443)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__7444 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__7445 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7446 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7447 = this;
  return this__7447.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7448 = this;
  if(this__7448.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__7448.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7449 = this;
  if(this__7449.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__7449.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7449.meta)
    }else {
      if(1 < this__7449.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__7449.meta, this__7449.cnt - 1, this__7449.shift, this__7449.root, this__7449.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__7450 = cljs.core.array_for.call(null, coll, this__7449.cnt - 2);
          var nr__7451 = cljs.core.pop_tail.call(null, coll, this__7449.shift, this__7449.root);
          var new_root__7452 = nr__7451 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__7451;
          var cnt_1__7453 = this__7449.cnt - 1;
          if(function() {
            var and__3546__auto____7454 = 5 < this__7449.shift;
            if(and__3546__auto____7454) {
              return cljs.core.pv_aget.call(null, new_root__7452, 1) == null
            }else {
              return and__3546__auto____7454
            }
          }()) {
            return new cljs.core.PersistentVector(this__7449.meta, cnt_1__7453, this__7449.shift - 5, cljs.core.pv_aget.call(null, new_root__7452, 0), new_tail__7450, null)
          }else {
            return new cljs.core.PersistentVector(this__7449.meta, cnt_1__7453, this__7449.shift, new_root__7452, new_tail__7450, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7456 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7457 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7458 = this;
  return new cljs.core.PersistentVector(meta, this__7458.cnt, this__7458.shift, this__7458.root, this__7458.tail, this__7458.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7459 = this;
  return this__7459.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7460 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7461 = this;
  if(function() {
    var and__3546__auto____7462 = 0 <= n;
    if(and__3546__auto____7462) {
      return n < this__7461.cnt
    }else {
      return and__3546__auto____7462
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7455 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__7455.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__7467 = cljs.core.seq.call(null, xs);
  var out__7468 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__7467)) {
      var G__7469 = cljs.core.next.call(null, xs__7467);
      var G__7470 = cljs.core.conj_BANG_.call(null, out__7468, cljs.core.first.call(null, xs__7467));
      xs__7467 = G__7469;
      out__7468 = G__7470;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__7468)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__7471) {
    var args = cljs.core.seq(arglist__7471);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7476 = this;
  var h__364__auto____7477 = this__7476.__hash;
  if(h__364__auto____7477 != null) {
    return h__364__auto____7477
  }else {
    var h__364__auto____7478 = cljs.core.hash_coll.call(null, coll);
    this__7476.__hash = h__364__auto____7478;
    return h__364__auto____7478
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7479 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7480 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__7481 = this;
  var v_pos__7482 = this__7481.start + key;
  return new cljs.core.Subvec(this__7481.meta, cljs.core._assoc.call(null, this__7481.v, v_pos__7482, val), this__7481.start, this__7481.end > v_pos__7482 + 1 ? this__7481.end : v_pos__7482 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__7506 = null;
  var G__7506__2 = function(tsym7474, k) {
    var this__7483 = this;
    var tsym7474__7484 = this;
    var coll__7485 = tsym7474__7484;
    return cljs.core._lookup.call(null, coll__7485, k)
  };
  var G__7506__3 = function(tsym7475, k, not_found) {
    var this__7486 = this;
    var tsym7475__7487 = this;
    var coll__7488 = tsym7475__7487;
    return cljs.core._lookup.call(null, coll__7488, k, not_found)
  };
  G__7506 = function(tsym7475, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7506__2.call(this, tsym7475, k);
      case 3:
        return G__7506__3.call(this, tsym7475, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7506
}();
cljs.core.Subvec.prototype.apply = function(tsym7472, args7473) {
  return tsym7472.call.apply(tsym7472, [tsym7472].concat(cljs.core.aclone.call(null, args7473)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7489 = this;
  return new cljs.core.Subvec(this__7489.meta, cljs.core._assoc_n.call(null, this__7489.v, this__7489.end, o), this__7489.start, this__7489.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__7490 = this;
  var this$__7491 = this;
  return cljs.core.pr_str.call(null, this$__7491)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7492 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7493 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7494 = this;
  var subvec_seq__7495 = function subvec_seq(i) {
    if(i === this__7494.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__7494.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__7495.call(null, this__7494.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7496 = this;
  return this__7496.end - this__7496.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7497 = this;
  return cljs.core._nth.call(null, this__7497.v, this__7497.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7498 = this;
  if(this__7498.start === this__7498.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__7498.meta, this__7498.v, this__7498.start, this__7498.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__7499 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7500 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7501 = this;
  return new cljs.core.Subvec(meta, this__7501.v, this__7501.start, this__7501.end, this__7501.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7502 = this;
  return this__7502.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7504 = this;
  return cljs.core._nth.call(null, this__7504.v, this__7504.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7505 = this;
  return cljs.core._nth.call(null, this__7505.v, this__7505.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7503 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__7503.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__7507 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__7507, 0, tl.length);
  return ret__7507
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__7508 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__7509 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__7508, subidx__7509, level === 5 ? tail_node : function() {
    var child__7510 = cljs.core.pv_aget.call(null, ret__7508, subidx__7509);
    if(child__7510 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__7510, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__7508
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__7511 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__7512 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__7513 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__7511, subidx__7512));
    if(function() {
      var and__3546__auto____7514 = new_child__7513 == null;
      if(and__3546__auto____7514) {
        return subidx__7512 === 0
      }else {
        return and__3546__auto____7514
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__7511, subidx__7512, new_child__7513);
      return node__7511
    }
  }else {
    if(subidx__7512 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__7511, subidx__7512, null);
        return node__7511
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3546__auto____7515 = 0 <= i;
    if(and__3546__auto____7515) {
      return i < tv.cnt
    }else {
      return and__3546__auto____7515
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__7516 = tv.root;
      var node__7517 = root__7516;
      var level__7518 = tv.shift;
      while(true) {
        if(level__7518 > 0) {
          var G__7519 = cljs.core.tv_ensure_editable.call(null, root__7516.edit, cljs.core.pv_aget.call(null, node__7517, i >>> level__7518 & 31));
          var G__7520 = level__7518 - 5;
          node__7517 = G__7519;
          level__7518 = G__7520;
          continue
        }else {
          return node__7517.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__7558 = null;
  var G__7558__2 = function(tsym7523, k) {
    var this__7525 = this;
    var tsym7523__7526 = this;
    var coll__7527 = tsym7523__7526;
    return cljs.core._lookup.call(null, coll__7527, k)
  };
  var G__7558__3 = function(tsym7524, k, not_found) {
    var this__7528 = this;
    var tsym7524__7529 = this;
    var coll__7530 = tsym7524__7529;
    return cljs.core._lookup.call(null, coll__7530, k, not_found)
  };
  G__7558 = function(tsym7524, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7558__2.call(this, tsym7524, k);
      case 3:
        return G__7558__3.call(this, tsym7524, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7558
}();
cljs.core.TransientVector.prototype.apply = function(tsym7521, args7522) {
  return tsym7521.call.apply(tsym7521, [tsym7521].concat(cljs.core.aclone.call(null, args7522)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7531 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7532 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__7533 = this;
  if(cljs.core.truth_(this__7533.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__7534 = this;
  if(function() {
    var and__3546__auto____7535 = 0 <= n;
    if(and__3546__auto____7535) {
      return n < this__7534.cnt
    }else {
      return and__3546__auto____7535
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7536 = this;
  if(cljs.core.truth_(this__7536.root.edit)) {
    return this__7536.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__7537 = this;
  if(cljs.core.truth_(this__7537.root.edit)) {
    if(function() {
      var and__3546__auto____7538 = 0 <= n;
      if(and__3546__auto____7538) {
        return n < this__7537.cnt
      }else {
        return and__3546__auto____7538
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__7537.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__7541 = function go(level, node) {
          var node__7539 = cljs.core.tv_ensure_editable.call(null, this__7537.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__7539, n & 31, val);
            return node__7539
          }else {
            var subidx__7540 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__7539, subidx__7540, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__7539, subidx__7540)));
            return node__7539
          }
        }.call(null, this__7537.shift, this__7537.root);
        this__7537.root = new_root__7541;
        return tcoll
      }
    }else {
      if(n === this__7537.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__7537.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__7542 = this;
  if(cljs.core.truth_(this__7542.root.edit)) {
    if(this__7542.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__7542.cnt) {
        this__7542.cnt = 0;
        return tcoll
      }else {
        if((this__7542.cnt - 1 & 31) > 0) {
          this__7542.cnt = this__7542.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__7543 = cljs.core.editable_array_for.call(null, tcoll, this__7542.cnt - 2);
            var new_root__7545 = function() {
              var nr__7544 = cljs.core.tv_pop_tail.call(null, tcoll, this__7542.shift, this__7542.root);
              if(nr__7544 != null) {
                return nr__7544
              }else {
                return new cljs.core.VectorNode(this__7542.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3546__auto____7546 = 5 < this__7542.shift;
              if(and__3546__auto____7546) {
                return cljs.core.pv_aget.call(null, new_root__7545, 1) == null
              }else {
                return and__3546__auto____7546
              }
            }()) {
              var new_root__7547 = cljs.core.tv_ensure_editable.call(null, this__7542.root.edit, cljs.core.pv_aget.call(null, new_root__7545, 0));
              this__7542.root = new_root__7547;
              this__7542.shift = this__7542.shift - 5;
              this__7542.cnt = this__7542.cnt - 1;
              this__7542.tail = new_tail__7543;
              return tcoll
            }else {
              this__7542.root = new_root__7545;
              this__7542.cnt = this__7542.cnt - 1;
              this__7542.tail = new_tail__7543;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7548 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7549 = this;
  if(cljs.core.truth_(this__7549.root.edit)) {
    if(this__7549.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__7549.tail[this__7549.cnt & 31] = o;
      this__7549.cnt = this__7549.cnt + 1;
      return tcoll
    }else {
      var tail_node__7550 = new cljs.core.VectorNode(this__7549.root.edit, this__7549.tail);
      var new_tail__7551 = cljs.core.make_array.call(null, 32);
      new_tail__7551[0] = o;
      this__7549.tail = new_tail__7551;
      if(this__7549.cnt >>> 5 > 1 << this__7549.shift) {
        var new_root_array__7552 = cljs.core.make_array.call(null, 32);
        var new_shift__7553 = this__7549.shift + 5;
        new_root_array__7552[0] = this__7549.root;
        new_root_array__7552[1] = cljs.core.new_path.call(null, this__7549.root.edit, this__7549.shift, tail_node__7550);
        this__7549.root = new cljs.core.VectorNode(this__7549.root.edit, new_root_array__7552);
        this__7549.shift = new_shift__7553;
        this__7549.cnt = this__7549.cnt + 1;
        return tcoll
      }else {
        var new_root__7554 = cljs.core.tv_push_tail.call(null, tcoll, this__7549.shift, this__7549.root, tail_node__7550);
        this__7549.root = new_root__7554;
        this__7549.cnt = this__7549.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7555 = this;
  if(cljs.core.truth_(this__7555.root.edit)) {
    this__7555.root.edit = null;
    var len__7556 = this__7555.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__7557 = cljs.core.make_array.call(null, len__7556);
    cljs.core.array_copy.call(null, this__7555.tail, 0, trimmed_tail__7557, 0, len__7556);
    return new cljs.core.PersistentVector(null, this__7555.cnt, this__7555.shift, this__7555.root, trimmed_tail__7557, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7559 = this;
  var h__364__auto____7560 = this__7559.__hash;
  if(h__364__auto____7560 != null) {
    return h__364__auto____7560
  }else {
    var h__364__auto____7561 = cljs.core.hash_coll.call(null, coll);
    this__7559.__hash = h__364__auto____7561;
    return h__364__auto____7561
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7562 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__7563 = this;
  var this$__7564 = this;
  return cljs.core.pr_str.call(null, this$__7564)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7565 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7566 = this;
  return cljs.core._first.call(null, this__7566.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7567 = this;
  var temp__3695__auto____7568 = cljs.core.next.call(null, this__7567.front);
  if(cljs.core.truth_(temp__3695__auto____7568)) {
    var f1__7569 = temp__3695__auto____7568;
    return new cljs.core.PersistentQueueSeq(this__7567.meta, f1__7569, this__7567.rear, null)
  }else {
    if(this__7567.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__7567.meta, this__7567.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7570 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7571 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__7571.front, this__7571.rear, this__7571.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7572 = this;
  return this__7572.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7573 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7573.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7574 = this;
  var h__364__auto____7575 = this__7574.__hash;
  if(h__364__auto____7575 != null) {
    return h__364__auto____7575
  }else {
    var h__364__auto____7576 = cljs.core.hash_coll.call(null, coll);
    this__7574.__hash = h__364__auto____7576;
    return h__364__auto____7576
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7577 = this;
  if(cljs.core.truth_(this__7577.front)) {
    return new cljs.core.PersistentQueue(this__7577.meta, this__7577.count + 1, this__7577.front, cljs.core.conj.call(null, function() {
      var or__3548__auto____7578 = this__7577.rear;
      if(cljs.core.truth_(or__3548__auto____7578)) {
        return or__3548__auto____7578
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__7577.meta, this__7577.count + 1, cljs.core.conj.call(null, this__7577.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__7579 = this;
  var this$__7580 = this;
  return cljs.core.pr_str.call(null, this$__7580)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7581 = this;
  var rear__7582 = cljs.core.seq.call(null, this__7581.rear);
  if(cljs.core.truth_(function() {
    var or__3548__auto____7583 = this__7581.front;
    if(cljs.core.truth_(or__3548__auto____7583)) {
      return or__3548__auto____7583
    }else {
      return rear__7582
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__7581.front, cljs.core.seq.call(null, rear__7582), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7584 = this;
  return this__7584.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7585 = this;
  return cljs.core._first.call(null, this__7585.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7586 = this;
  if(cljs.core.truth_(this__7586.front)) {
    var temp__3695__auto____7587 = cljs.core.next.call(null, this__7586.front);
    if(cljs.core.truth_(temp__3695__auto____7587)) {
      var f1__7588 = temp__3695__auto____7587;
      return new cljs.core.PersistentQueue(this__7586.meta, this__7586.count - 1, f1__7588, this__7586.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__7586.meta, this__7586.count - 1, cljs.core.seq.call(null, this__7586.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7589 = this;
  return cljs.core.first.call(null, this__7589.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7590 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7591 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7592 = this;
  return new cljs.core.PersistentQueue(meta, this__7592.count, this__7592.front, this__7592.rear, this__7592.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7593 = this;
  return this__7593.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7594 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__7595 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__7596 = array.length;
  var i__7597 = 0;
  while(true) {
    if(i__7597 < len__7596) {
      if(cljs.core._EQ_.call(null, k, array[i__7597])) {
        return i__7597
      }else {
        var G__7598 = i__7597 + incr;
        i__7597 = G__7598;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____7599 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3546__auto____7599)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3546__auto____7599
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__7600 = cljs.core.hash.call(null, a);
  var b__7601 = cljs.core.hash.call(null, b);
  if(a__7600 < b__7601) {
    return-1
  }else {
    if(a__7600 > b__7601) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__7603 = m.keys;
  var len__7604 = ks__7603.length;
  var so__7605 = m.strobj;
  var out__7606 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__7607 = 0;
  var out__7608 = cljs.core.transient$.call(null, out__7606);
  while(true) {
    if(i__7607 < len__7604) {
      var k__7609 = ks__7603[i__7607];
      var G__7610 = i__7607 + 1;
      var G__7611 = cljs.core.assoc_BANG_.call(null, out__7608, k__7609, so__7605[k__7609]);
      i__7607 = G__7610;
      out__7608 = G__7611;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__7608, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7616 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7617 = this;
  var h__364__auto____7618 = this__7617.__hash;
  if(h__364__auto____7618 != null) {
    return h__364__auto____7618
  }else {
    var h__364__auto____7619 = cljs.core.hash_imap.call(null, coll);
    this__7617.__hash = h__364__auto____7619;
    return h__364__auto____7619
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7620 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7621 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__7621.strobj, this__7621.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7622 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___7623 = this__7622.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___7623)) {
      var new_strobj__7624 = goog.object.clone.call(null, this__7622.strobj);
      new_strobj__7624[k] = v;
      return new cljs.core.ObjMap(this__7622.meta, this__7622.keys, new_strobj__7624, this__7622.update_count + 1, null)
    }else {
      if(this__7622.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__7625 = goog.object.clone.call(null, this__7622.strobj);
        var new_keys__7626 = cljs.core.aclone.call(null, this__7622.keys);
        new_strobj__7625[k] = v;
        new_keys__7626.push(k);
        return new cljs.core.ObjMap(this__7622.meta, new_keys__7626, new_strobj__7625, this__7622.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7627 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__7627.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__7647 = null;
  var G__7647__2 = function(tsym7614, k) {
    var this__7628 = this;
    var tsym7614__7629 = this;
    var coll__7630 = tsym7614__7629;
    return cljs.core._lookup.call(null, coll__7630, k)
  };
  var G__7647__3 = function(tsym7615, k, not_found) {
    var this__7631 = this;
    var tsym7615__7632 = this;
    var coll__7633 = tsym7615__7632;
    return cljs.core._lookup.call(null, coll__7633, k, not_found)
  };
  G__7647 = function(tsym7615, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7647__2.call(this, tsym7615, k);
      case 3:
        return G__7647__3.call(this, tsym7615, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7647
}();
cljs.core.ObjMap.prototype.apply = function(tsym7612, args7613) {
  return tsym7612.call.apply(tsym7612, [tsym7612].concat(cljs.core.aclone.call(null, args7613)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7634 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__7635 = this;
  var this$__7636 = this;
  return cljs.core.pr_str.call(null, this$__7636)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7637 = this;
  if(this__7637.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__7602_SHARP_) {
      return cljs.core.vector.call(null, p1__7602_SHARP_, this__7637.strobj[p1__7602_SHARP_])
    }, this__7637.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7638 = this;
  return this__7638.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7639 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7640 = this;
  return new cljs.core.ObjMap(meta, this__7640.keys, this__7640.strobj, this__7640.update_count, this__7640.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7641 = this;
  return this__7641.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7642 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__7642.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7643 = this;
  if(cljs.core.truth_(function() {
    var and__3546__auto____7644 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3546__auto____7644)) {
      return this__7643.strobj.hasOwnProperty(k)
    }else {
      return and__3546__auto____7644
    }
  }())) {
    var new_keys__7645 = cljs.core.aclone.call(null, this__7643.keys);
    var new_strobj__7646 = goog.object.clone.call(null, this__7643.strobj);
    new_keys__7645.splice(cljs.core.scan_array.call(null, 1, k, new_keys__7645), 1);
    cljs.core.js_delete.call(null, new_strobj__7646, k);
    return new cljs.core.ObjMap(this__7643.meta, new_keys__7645, new_strobj__7646, this__7643.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7653 = this;
  var h__364__auto____7654 = this__7653.__hash;
  if(h__364__auto____7654 != null) {
    return h__364__auto____7654
  }else {
    var h__364__auto____7655 = cljs.core.hash_imap.call(null, coll);
    this__7653.__hash = h__364__auto____7655;
    return h__364__auto____7655
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7656 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7657 = this;
  var bucket__7658 = this__7657.hashobj[cljs.core.hash.call(null, k)];
  var i__7659 = cljs.core.truth_(bucket__7658) ? cljs.core.scan_array.call(null, 2, k, bucket__7658) : null;
  if(cljs.core.truth_(i__7659)) {
    return bucket__7658[i__7659 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7660 = this;
  var h__7661 = cljs.core.hash.call(null, k);
  var bucket__7662 = this__7660.hashobj[h__7661];
  if(cljs.core.truth_(bucket__7662)) {
    var new_bucket__7663 = cljs.core.aclone.call(null, bucket__7662);
    var new_hashobj__7664 = goog.object.clone.call(null, this__7660.hashobj);
    new_hashobj__7664[h__7661] = new_bucket__7663;
    var temp__3695__auto____7665 = cljs.core.scan_array.call(null, 2, k, new_bucket__7663);
    if(cljs.core.truth_(temp__3695__auto____7665)) {
      var i__7666 = temp__3695__auto____7665;
      new_bucket__7663[i__7666 + 1] = v;
      return new cljs.core.HashMap(this__7660.meta, this__7660.count, new_hashobj__7664, null)
    }else {
      new_bucket__7663.push(k, v);
      return new cljs.core.HashMap(this__7660.meta, this__7660.count + 1, new_hashobj__7664, null)
    }
  }else {
    var new_hashobj__7667 = goog.object.clone.call(null, this__7660.hashobj);
    new_hashobj__7667[h__7661] = [k, v];
    return new cljs.core.HashMap(this__7660.meta, this__7660.count + 1, new_hashobj__7667, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7668 = this;
  var bucket__7669 = this__7668.hashobj[cljs.core.hash.call(null, k)];
  var i__7670 = cljs.core.truth_(bucket__7669) ? cljs.core.scan_array.call(null, 2, k, bucket__7669) : null;
  if(cljs.core.truth_(i__7670)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__7693 = null;
  var G__7693__2 = function(tsym7651, k) {
    var this__7671 = this;
    var tsym7651__7672 = this;
    var coll__7673 = tsym7651__7672;
    return cljs.core._lookup.call(null, coll__7673, k)
  };
  var G__7693__3 = function(tsym7652, k, not_found) {
    var this__7674 = this;
    var tsym7652__7675 = this;
    var coll__7676 = tsym7652__7675;
    return cljs.core._lookup.call(null, coll__7676, k, not_found)
  };
  G__7693 = function(tsym7652, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7693__2.call(this, tsym7652, k);
      case 3:
        return G__7693__3.call(this, tsym7652, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7693
}();
cljs.core.HashMap.prototype.apply = function(tsym7649, args7650) {
  return tsym7649.call.apply(tsym7649, [tsym7649].concat(cljs.core.aclone.call(null, args7650)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7677 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__7678 = this;
  var this$__7679 = this;
  return cljs.core.pr_str.call(null, this$__7679)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7680 = this;
  if(this__7680.count > 0) {
    var hashes__7681 = cljs.core.js_keys.call(null, this__7680.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__7648_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__7680.hashobj[p1__7648_SHARP_]))
    }, hashes__7681)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7682 = this;
  return this__7682.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7683 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7684 = this;
  return new cljs.core.HashMap(meta, this__7684.count, this__7684.hashobj, this__7684.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7685 = this;
  return this__7685.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7686 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__7686.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7687 = this;
  var h__7688 = cljs.core.hash.call(null, k);
  var bucket__7689 = this__7687.hashobj[h__7688];
  var i__7690 = cljs.core.truth_(bucket__7689) ? cljs.core.scan_array.call(null, 2, k, bucket__7689) : null;
  if(cljs.core.not.call(null, i__7690)) {
    return coll
  }else {
    var new_hashobj__7691 = goog.object.clone.call(null, this__7687.hashobj);
    if(3 > bucket__7689.length) {
      cljs.core.js_delete.call(null, new_hashobj__7691, h__7688)
    }else {
      var new_bucket__7692 = cljs.core.aclone.call(null, bucket__7689);
      new_bucket__7692.splice(i__7690, 2);
      new_hashobj__7691[h__7688] = new_bucket__7692
    }
    return new cljs.core.HashMap(this__7687.meta, this__7687.count - 1, new_hashobj__7691, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__7694 = ks.length;
  var i__7695 = 0;
  var out__7696 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__7695 < len__7694) {
      var G__7697 = i__7695 + 1;
      var G__7698 = cljs.core.assoc.call(null, out__7696, ks[i__7695], vs[i__7695]);
      i__7695 = G__7697;
      out__7696 = G__7698;
      continue
    }else {
      return out__7696
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__7699 = m.arr;
  var len__7700 = arr__7699.length;
  var i__7701 = 0;
  while(true) {
    if(len__7700 <= i__7701) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__7699[i__7701], k)) {
        return i__7701
      }else {
        if("\ufdd0'else") {
          var G__7702 = i__7701 + 2;
          i__7701 = G__7702;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__7707 = this;
  return new cljs.core.TransientArrayMap({}, this__7707.arr.length, cljs.core.aclone.call(null, this__7707.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7708 = this;
  var h__364__auto____7709 = this__7708.__hash;
  if(h__364__auto____7709 != null) {
    return h__364__auto____7709
  }else {
    var h__364__auto____7710 = cljs.core.hash_imap.call(null, coll);
    this__7708.__hash = h__364__auto____7710;
    return h__364__auto____7710
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__7711 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__7712 = this;
  var idx__7713 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7713 === -1) {
    return not_found
  }else {
    return this__7712.arr[idx__7713 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__7714 = this;
  var idx__7715 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7715 === -1) {
    if(this__7714.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__7714.meta, this__7714.cnt + 1, function() {
        var G__7716__7717 = cljs.core.aclone.call(null, this__7714.arr);
        G__7716__7717.push(k);
        G__7716__7717.push(v);
        return G__7716__7717
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__7714.arr[idx__7715 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__7714.meta, this__7714.cnt, function() {
          var G__7718__7719 = cljs.core.aclone.call(null, this__7714.arr);
          G__7718__7719[idx__7715 + 1] = v;
          return G__7718__7719
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__7720 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__7750 = null;
  var G__7750__2 = function(tsym7705, k) {
    var this__7721 = this;
    var tsym7705__7722 = this;
    var coll__7723 = tsym7705__7722;
    return cljs.core._lookup.call(null, coll__7723, k)
  };
  var G__7750__3 = function(tsym7706, k, not_found) {
    var this__7724 = this;
    var tsym7706__7725 = this;
    var coll__7726 = tsym7706__7725;
    return cljs.core._lookup.call(null, coll__7726, k, not_found)
  };
  G__7750 = function(tsym7706, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7750__2.call(this, tsym7706, k);
      case 3:
        return G__7750__3.call(this, tsym7706, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7750
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym7703, args7704) {
  return tsym7703.call.apply(tsym7703, [tsym7703].concat(cljs.core.aclone.call(null, args7704)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__7727 = this;
  var len__7728 = this__7727.arr.length;
  var i__7729 = 0;
  var init__7730 = init;
  while(true) {
    if(i__7729 < len__7728) {
      var init__7731 = f.call(null, init__7730, this__7727.arr[i__7729], this__7727.arr[i__7729 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__7731)) {
        return cljs.core.deref.call(null, init__7731)
      }else {
        var G__7751 = i__7729 + 2;
        var G__7752 = init__7731;
        i__7729 = G__7751;
        init__7730 = G__7752;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__7732 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__7733 = this;
  var this$__7734 = this;
  return cljs.core.pr_str.call(null, this$__7734)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7735 = this;
  if(this__7735.cnt > 0) {
    var len__7736 = this__7735.arr.length;
    var array_map_seq__7737 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__7736) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__7735.arr[i], this__7735.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__7737.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7738 = this;
  return this__7738.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7739 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7740 = this;
  return new cljs.core.PersistentArrayMap(meta, this__7740.cnt, this__7740.arr, this__7740.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7741 = this;
  return this__7741.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7742 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__7742.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__7743 = this;
  var idx__7744 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__7744 >= 0) {
    var len__7745 = this__7743.arr.length;
    var new_len__7746 = len__7745 - 2;
    if(new_len__7746 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__7747 = cljs.core.make_array.call(null, new_len__7746);
      var s__7748 = 0;
      var d__7749 = 0;
      while(true) {
        if(s__7748 >= len__7745) {
          return new cljs.core.PersistentArrayMap(this__7743.meta, this__7743.cnt - 1, new_arr__7747, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__7743.arr[s__7748])) {
            var G__7753 = s__7748 + 2;
            var G__7754 = d__7749;
            s__7748 = G__7753;
            d__7749 = G__7754;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__7747[d__7749] = this__7743.arr[s__7748];
              new_arr__7747[d__7749 + 1] = this__7743.arr[s__7748 + 1];
              var G__7755 = s__7748 + 2;
              var G__7756 = d__7749 + 2;
              s__7748 = G__7755;
              d__7749 = G__7756;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__7757 = cljs.core.count.call(null, ks);
  var i__7758 = 0;
  var out__7759 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__7758 < len__7757) {
      var G__7760 = i__7758 + 1;
      var G__7761 = cljs.core.assoc_BANG_.call(null, out__7759, ks[i__7758], vs[i__7758]);
      i__7758 = G__7760;
      out__7759 = G__7761;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__7759)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__7762 = this;
  if(cljs.core.truth_(this__7762.editable_QMARK_)) {
    var idx__7763 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__7763 >= 0) {
      this__7762.arr[idx__7763] = this__7762.arr[this__7762.len - 2];
      this__7762.arr[idx__7763 + 1] = this__7762.arr[this__7762.len - 1];
      var G__7764__7765 = this__7762.arr;
      G__7764__7765.pop();
      G__7764__7765.pop();
      G__7764__7765;
      this__7762.len = this__7762.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__7766 = this;
  if(cljs.core.truth_(this__7766.editable_QMARK_)) {
    var idx__7767 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__7767 === -1) {
      if(this__7766.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__7766.len = this__7766.len + 2;
        this__7766.arr.push(key);
        this__7766.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__7766.len, this__7766.arr), key, val)
      }
    }else {
      if(val === this__7766.arr[idx__7767 + 1]) {
        return tcoll
      }else {
        this__7766.arr[idx__7767 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__7768 = this;
  if(cljs.core.truth_(this__7768.editable_QMARK_)) {
    if(function() {
      var G__7769__7770 = o;
      if(G__7769__7770 != null) {
        if(function() {
          var or__3548__auto____7771 = G__7769__7770.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____7771) {
            return or__3548__auto____7771
          }else {
            return G__7769__7770.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__7769__7770.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7769__7770)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__7769__7770)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__7772 = cljs.core.seq.call(null, o);
      var tcoll__7773 = tcoll;
      while(true) {
        var temp__3695__auto____7774 = cljs.core.first.call(null, es__7772);
        if(cljs.core.truth_(temp__3695__auto____7774)) {
          var e__7775 = temp__3695__auto____7774;
          var G__7781 = cljs.core.next.call(null, es__7772);
          var G__7782 = cljs.core._assoc_BANG_.call(null, tcoll__7773, cljs.core.key.call(null, e__7775), cljs.core.val.call(null, e__7775));
          es__7772 = G__7781;
          tcoll__7773 = G__7782;
          continue
        }else {
          return tcoll__7773
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__7776 = this;
  if(cljs.core.truth_(this__7776.editable_QMARK_)) {
    this__7776.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__7776.len, 2), this__7776.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__7777 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__7778 = this;
  if(cljs.core.truth_(this__7778.editable_QMARK_)) {
    var idx__7779 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__7779 === -1) {
      return not_found
    }else {
      return this__7778.arr[idx__7779 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__7780 = this;
  if(cljs.core.truth_(this__7780.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__7780.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__7783 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__7784 = 0;
  while(true) {
    if(i__7784 < len) {
      var G__7785 = cljs.core.assoc_BANG_.call(null, out__7783, arr[i__7784], arr[i__7784 + 1]);
      var G__7786 = i__7784 + 2;
      out__7783 = G__7785;
      i__7784 = G__7786;
      continue
    }else {
      return out__7783
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__7787__7788 = cljs.core.aclone.call(null, arr);
    G__7787__7788[i] = a;
    return G__7787__7788
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__7789__7790 = cljs.core.aclone.call(null, arr);
    G__7789__7790[i] = a;
    G__7789__7790[j] = b;
    return G__7789__7790
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__7791 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__7791, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__7791, 2 * i, new_arr__7791.length - 2 * i);
  return new_arr__7791
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__7792 = inode.ensure_editable(edit);
    editable__7792.arr[i] = a;
    return editable__7792
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__7793 = inode.ensure_editable(edit);
    editable__7793.arr[i] = a;
    editable__7793.arr[j] = b;
    return editable__7793
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__7794 = arr.length;
  var i__7795 = 0;
  var init__7796 = init;
  while(true) {
    if(i__7795 < len__7794) {
      var init__7799 = function() {
        var k__7797 = arr[i__7795];
        if(k__7797 != null) {
          return f.call(null, init__7796, k__7797, arr[i__7795 + 1])
        }else {
          var node__7798 = arr[i__7795 + 1];
          if(node__7798 != null) {
            return node__7798.kv_reduce(f, init__7796)
          }else {
            return init__7796
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__7799)) {
        return cljs.core.deref.call(null, init__7799)
      }else {
        var G__7800 = i__7795 + 2;
        var G__7801 = init__7799;
        i__7795 = G__7800;
        init__7796 = G__7801;
        continue
      }
    }else {
      return init__7796
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__7802 = this;
  var inode__7803 = this;
  if(this__7802.bitmap === bit) {
    return null
  }else {
    var editable__7804 = inode__7803.ensure_editable(e);
    var earr__7805 = editable__7804.arr;
    var len__7806 = earr__7805.length;
    editable__7804.bitmap = bit ^ editable__7804.bitmap;
    cljs.core.array_copy.call(null, earr__7805, 2 * (i + 1), earr__7805, 2 * i, len__7806 - 2 * (i + 1));
    earr__7805[len__7806 - 2] = null;
    earr__7805[len__7806 - 1] = null;
    return editable__7804
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7807 = this;
  var inode__7808 = this;
  var bit__7809 = 1 << (hash >>> shift & 31);
  var idx__7810 = cljs.core.bitmap_indexed_node_index.call(null, this__7807.bitmap, bit__7809);
  if((this__7807.bitmap & bit__7809) === 0) {
    var n__7811 = cljs.core.bit_count.call(null, this__7807.bitmap);
    if(2 * n__7811 < this__7807.arr.length) {
      var editable__7812 = inode__7808.ensure_editable(edit);
      var earr__7813 = editable__7812.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__7813, 2 * idx__7810, earr__7813, 2 * (idx__7810 + 1), 2 * (n__7811 - idx__7810));
      earr__7813[2 * idx__7810] = key;
      earr__7813[2 * idx__7810 + 1] = val;
      editable__7812.bitmap = editable__7812.bitmap | bit__7809;
      return editable__7812
    }else {
      if(n__7811 >= 16) {
        var nodes__7814 = cljs.core.make_array.call(null, 32);
        var jdx__7815 = hash >>> shift & 31;
        nodes__7814[jdx__7815] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__7816 = 0;
        var j__7817 = 0;
        while(true) {
          if(i__7816 < 32) {
            if((this__7807.bitmap >>> i__7816 & 1) === 0) {
              var G__7870 = i__7816 + 1;
              var G__7871 = j__7817;
              i__7816 = G__7870;
              j__7817 = G__7871;
              continue
            }else {
              nodes__7814[i__7816] = null != this__7807.arr[j__7817] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__7807.arr[j__7817]), this__7807.arr[j__7817], this__7807.arr[j__7817 + 1], added_leaf_QMARK_) : this__7807.arr[j__7817 + 1];
              var G__7872 = i__7816 + 1;
              var G__7873 = j__7817 + 2;
              i__7816 = G__7872;
              j__7817 = G__7873;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__7811 + 1, nodes__7814)
      }else {
        if("\ufdd0'else") {
          var new_arr__7818 = cljs.core.make_array.call(null, 2 * (n__7811 + 4));
          cljs.core.array_copy.call(null, this__7807.arr, 0, new_arr__7818, 0, 2 * idx__7810);
          new_arr__7818[2 * idx__7810] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__7818[2 * idx__7810 + 1] = val;
          cljs.core.array_copy.call(null, this__7807.arr, 2 * idx__7810, new_arr__7818, 2 * (idx__7810 + 1), 2 * (n__7811 - idx__7810));
          var editable__7819 = inode__7808.ensure_editable(edit);
          editable__7819.arr = new_arr__7818;
          editable__7819.bitmap = editable__7819.bitmap | bit__7809;
          return editable__7819
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__7820 = this__7807.arr[2 * idx__7810];
    var val_or_node__7821 = this__7807.arr[2 * idx__7810 + 1];
    if(null == key_or_nil__7820) {
      var n__7822 = val_or_node__7821.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__7822 === val_or_node__7821) {
        return inode__7808
      }else {
        return cljs.core.edit_and_set.call(null, inode__7808, edit, 2 * idx__7810 + 1, n__7822)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__7820)) {
        if(val === val_or_node__7821) {
          return inode__7808
        }else {
          return cljs.core.edit_and_set.call(null, inode__7808, edit, 2 * idx__7810 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__7808, edit, 2 * idx__7810, null, 2 * idx__7810 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__7820, val_or_node__7821, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__7823 = this;
  var inode__7824 = this;
  return cljs.core.create_inode_seq.call(null, this__7823.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7825 = this;
  var inode__7826 = this;
  var bit__7827 = 1 << (hash >>> shift & 31);
  if((this__7825.bitmap & bit__7827) === 0) {
    return inode__7826
  }else {
    var idx__7828 = cljs.core.bitmap_indexed_node_index.call(null, this__7825.bitmap, bit__7827);
    var key_or_nil__7829 = this__7825.arr[2 * idx__7828];
    var val_or_node__7830 = this__7825.arr[2 * idx__7828 + 1];
    if(null == key_or_nil__7829) {
      var n__7831 = val_or_node__7830.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__7831 === val_or_node__7830) {
        return inode__7826
      }else {
        if(null != n__7831) {
          return cljs.core.edit_and_set.call(null, inode__7826, edit, 2 * idx__7828 + 1, n__7831)
        }else {
          if(this__7825.bitmap === bit__7827) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__7826.edit_and_remove_pair(edit, bit__7827, idx__7828)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__7829)) {
        removed_leaf_QMARK_[0] = true;
        return inode__7826.edit_and_remove_pair(edit, bit__7827, idx__7828)
      }else {
        if("\ufdd0'else") {
          return inode__7826
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__7832 = this;
  var inode__7833 = this;
  if(e === this__7832.edit) {
    return inode__7833
  }else {
    var n__7834 = cljs.core.bit_count.call(null, this__7832.bitmap);
    var new_arr__7835 = cljs.core.make_array.call(null, n__7834 < 0 ? 4 : 2 * (n__7834 + 1));
    cljs.core.array_copy.call(null, this__7832.arr, 0, new_arr__7835, 0, 2 * n__7834);
    return new cljs.core.BitmapIndexedNode(e, this__7832.bitmap, new_arr__7835)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__7836 = this;
  var inode__7837 = this;
  return cljs.core.inode_kv_reduce.call(null, this__7836.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__7874 = null;
  var G__7874__3 = function(shift, hash, key) {
    var this__7838 = this;
    var inode__7839 = this;
    var bit__7840 = 1 << (hash >>> shift & 31);
    if((this__7838.bitmap & bit__7840) === 0) {
      return null
    }else {
      var idx__7841 = cljs.core.bitmap_indexed_node_index.call(null, this__7838.bitmap, bit__7840);
      var key_or_nil__7842 = this__7838.arr[2 * idx__7841];
      var val_or_node__7843 = this__7838.arr[2 * idx__7841 + 1];
      if(null == key_or_nil__7842) {
        return val_or_node__7843.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__7842)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__7842, val_or_node__7843])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__7874__4 = function(shift, hash, key, not_found) {
    var this__7844 = this;
    var inode__7845 = this;
    var bit__7846 = 1 << (hash >>> shift & 31);
    if((this__7844.bitmap & bit__7846) === 0) {
      return not_found
    }else {
      var idx__7847 = cljs.core.bitmap_indexed_node_index.call(null, this__7844.bitmap, bit__7846);
      var key_or_nil__7848 = this__7844.arr[2 * idx__7847];
      var val_or_node__7849 = this__7844.arr[2 * idx__7847 + 1];
      if(null == key_or_nil__7848) {
        return val_or_node__7849.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__7848)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__7848, val_or_node__7849])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__7874 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__7874__3.call(this, shift, hash, key);
      case 4:
        return G__7874__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7874
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__7850 = this;
  var inode__7851 = this;
  var bit__7852 = 1 << (hash >>> shift & 31);
  if((this__7850.bitmap & bit__7852) === 0) {
    return inode__7851
  }else {
    var idx__7853 = cljs.core.bitmap_indexed_node_index.call(null, this__7850.bitmap, bit__7852);
    var key_or_nil__7854 = this__7850.arr[2 * idx__7853];
    var val_or_node__7855 = this__7850.arr[2 * idx__7853 + 1];
    if(null == key_or_nil__7854) {
      var n__7856 = val_or_node__7855.inode_without(shift + 5, hash, key);
      if(n__7856 === val_or_node__7855) {
        return inode__7851
      }else {
        if(null != n__7856) {
          return new cljs.core.BitmapIndexedNode(null, this__7850.bitmap, cljs.core.clone_and_set.call(null, this__7850.arr, 2 * idx__7853 + 1, n__7856))
        }else {
          if(this__7850.bitmap === bit__7852) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__7850.bitmap ^ bit__7852, cljs.core.remove_pair.call(null, this__7850.arr, idx__7853))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__7854)) {
        return new cljs.core.BitmapIndexedNode(null, this__7850.bitmap ^ bit__7852, cljs.core.remove_pair.call(null, this__7850.arr, idx__7853))
      }else {
        if("\ufdd0'else") {
          return inode__7851
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7857 = this;
  var inode__7858 = this;
  var bit__7859 = 1 << (hash >>> shift & 31);
  var idx__7860 = cljs.core.bitmap_indexed_node_index.call(null, this__7857.bitmap, bit__7859);
  if((this__7857.bitmap & bit__7859) === 0) {
    var n__7861 = cljs.core.bit_count.call(null, this__7857.bitmap);
    if(n__7861 >= 16) {
      var nodes__7862 = cljs.core.make_array.call(null, 32);
      var jdx__7863 = hash >>> shift & 31;
      nodes__7862[jdx__7863] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__7864 = 0;
      var j__7865 = 0;
      while(true) {
        if(i__7864 < 32) {
          if((this__7857.bitmap >>> i__7864 & 1) === 0) {
            var G__7875 = i__7864 + 1;
            var G__7876 = j__7865;
            i__7864 = G__7875;
            j__7865 = G__7876;
            continue
          }else {
            nodes__7862[i__7864] = null != this__7857.arr[j__7865] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__7857.arr[j__7865]), this__7857.arr[j__7865], this__7857.arr[j__7865 + 1], added_leaf_QMARK_) : this__7857.arr[j__7865 + 1];
            var G__7877 = i__7864 + 1;
            var G__7878 = j__7865 + 2;
            i__7864 = G__7877;
            j__7865 = G__7878;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__7861 + 1, nodes__7862)
    }else {
      var new_arr__7866 = cljs.core.make_array.call(null, 2 * (n__7861 + 1));
      cljs.core.array_copy.call(null, this__7857.arr, 0, new_arr__7866, 0, 2 * idx__7860);
      new_arr__7866[2 * idx__7860] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__7866[2 * idx__7860 + 1] = val;
      cljs.core.array_copy.call(null, this__7857.arr, 2 * idx__7860, new_arr__7866, 2 * (idx__7860 + 1), 2 * (n__7861 - idx__7860));
      return new cljs.core.BitmapIndexedNode(null, this__7857.bitmap | bit__7859, new_arr__7866)
    }
  }else {
    var key_or_nil__7867 = this__7857.arr[2 * idx__7860];
    var val_or_node__7868 = this__7857.arr[2 * idx__7860 + 1];
    if(null == key_or_nil__7867) {
      var n__7869 = val_or_node__7868.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__7869 === val_or_node__7868) {
        return inode__7858
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__7857.bitmap, cljs.core.clone_and_set.call(null, this__7857.arr, 2 * idx__7860 + 1, n__7869))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__7867)) {
        if(val === val_or_node__7868) {
          return inode__7858
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__7857.bitmap, cljs.core.clone_and_set.call(null, this__7857.arr, 2 * idx__7860 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__7857.bitmap, cljs.core.clone_and_set.call(null, this__7857.arr, 2 * idx__7860, null, 2 * idx__7860 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__7867, val_or_node__7868, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__7879 = array_node.arr;
  var len__7880 = 2 * (array_node.cnt - 1);
  var new_arr__7881 = cljs.core.make_array.call(null, len__7880);
  var i__7882 = 0;
  var j__7883 = 1;
  var bitmap__7884 = 0;
  while(true) {
    if(i__7882 < len__7880) {
      if(function() {
        var and__3546__auto____7885 = i__7882 != idx;
        if(and__3546__auto____7885) {
          return null != arr__7879[i__7882]
        }else {
          return and__3546__auto____7885
        }
      }()) {
        new_arr__7881[j__7883] = arr__7879[i__7882];
        var G__7886 = i__7882 + 1;
        var G__7887 = j__7883 + 2;
        var G__7888 = bitmap__7884 | 1 << i__7882;
        i__7882 = G__7886;
        j__7883 = G__7887;
        bitmap__7884 = G__7888;
        continue
      }else {
        var G__7889 = i__7882 + 1;
        var G__7890 = j__7883;
        var G__7891 = bitmap__7884;
        i__7882 = G__7889;
        j__7883 = G__7890;
        bitmap__7884 = G__7891;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__7884, new_arr__7881)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7892 = this;
  var inode__7893 = this;
  var idx__7894 = hash >>> shift & 31;
  var node__7895 = this__7892.arr[idx__7894];
  if(null == node__7895) {
    return new cljs.core.ArrayNode(null, this__7892.cnt + 1, cljs.core.clone_and_set.call(null, this__7892.arr, idx__7894, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__7896 = node__7895.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__7896 === node__7895) {
      return inode__7893
    }else {
      return new cljs.core.ArrayNode(null, this__7892.cnt, cljs.core.clone_and_set.call(null, this__7892.arr, idx__7894, n__7896))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__7897 = this;
  var inode__7898 = this;
  var idx__7899 = hash >>> shift & 31;
  var node__7900 = this__7897.arr[idx__7899];
  if(null != node__7900) {
    var n__7901 = node__7900.inode_without(shift + 5, hash, key);
    if(n__7901 === node__7900) {
      return inode__7898
    }else {
      if(n__7901 == null) {
        if(this__7897.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__7898, null, idx__7899)
        }else {
          return new cljs.core.ArrayNode(null, this__7897.cnt - 1, cljs.core.clone_and_set.call(null, this__7897.arr, idx__7899, n__7901))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__7897.cnt, cljs.core.clone_and_set.call(null, this__7897.arr, idx__7899, n__7901))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__7898
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__7933 = null;
  var G__7933__3 = function(shift, hash, key) {
    var this__7902 = this;
    var inode__7903 = this;
    var idx__7904 = hash >>> shift & 31;
    var node__7905 = this__7902.arr[idx__7904];
    if(null != node__7905) {
      return node__7905.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__7933__4 = function(shift, hash, key, not_found) {
    var this__7906 = this;
    var inode__7907 = this;
    var idx__7908 = hash >>> shift & 31;
    var node__7909 = this__7906.arr[idx__7908];
    if(null != node__7909) {
      return node__7909.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__7933 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__7933__3.call(this, shift, hash, key);
      case 4:
        return G__7933__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7933
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__7910 = this;
  var inode__7911 = this;
  return cljs.core.create_array_node_seq.call(null, this__7910.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__7912 = this;
  var inode__7913 = this;
  if(e === this__7912.edit) {
    return inode__7913
  }else {
    return new cljs.core.ArrayNode(e, this__7912.cnt, cljs.core.aclone.call(null, this__7912.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7914 = this;
  var inode__7915 = this;
  var idx__7916 = hash >>> shift & 31;
  var node__7917 = this__7914.arr[idx__7916];
  if(null == node__7917) {
    var editable__7918 = cljs.core.edit_and_set.call(null, inode__7915, edit, idx__7916, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__7918.cnt = editable__7918.cnt + 1;
    return editable__7918
  }else {
    var n__7919 = node__7917.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__7919 === node__7917) {
      return inode__7915
    }else {
      return cljs.core.edit_and_set.call(null, inode__7915, edit, idx__7916, n__7919)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7920 = this;
  var inode__7921 = this;
  var idx__7922 = hash >>> shift & 31;
  var node__7923 = this__7920.arr[idx__7922];
  if(null == node__7923) {
    return inode__7921
  }else {
    var n__7924 = node__7923.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__7924 === node__7923) {
      return inode__7921
    }else {
      if(null == n__7924) {
        if(this__7920.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__7921, edit, idx__7922)
        }else {
          var editable__7925 = cljs.core.edit_and_set.call(null, inode__7921, edit, idx__7922, n__7924);
          editable__7925.cnt = editable__7925.cnt - 1;
          return editable__7925
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__7921, edit, idx__7922, n__7924)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__7926 = this;
  var inode__7927 = this;
  var len__7928 = this__7926.arr.length;
  var i__7929 = 0;
  var init__7930 = init;
  while(true) {
    if(i__7929 < len__7928) {
      var node__7931 = this__7926.arr[i__7929];
      if(node__7931 != null) {
        var init__7932 = node__7931.kv_reduce(f, init__7930);
        if(cljs.core.reduced_QMARK_.call(null, init__7932)) {
          return cljs.core.deref.call(null, init__7932)
        }else {
          var G__7934 = i__7929 + 1;
          var G__7935 = init__7932;
          i__7929 = G__7934;
          init__7930 = G__7935;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__7930
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__7936 = 2 * cnt;
  var i__7937 = 0;
  while(true) {
    if(i__7937 < lim__7936) {
      if(cljs.core._EQ_.call(null, key, arr[i__7937])) {
        return i__7937
      }else {
        var G__7938 = i__7937 + 2;
        i__7937 = G__7938;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__7939 = this;
  var inode__7940 = this;
  if(hash === this__7939.collision_hash) {
    var idx__7941 = cljs.core.hash_collision_node_find_index.call(null, this__7939.arr, this__7939.cnt, key);
    if(idx__7941 === -1) {
      var len__7942 = this__7939.arr.length;
      var new_arr__7943 = cljs.core.make_array.call(null, len__7942 + 2);
      cljs.core.array_copy.call(null, this__7939.arr, 0, new_arr__7943, 0, len__7942);
      new_arr__7943[len__7942] = key;
      new_arr__7943[len__7942 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__7939.collision_hash, this__7939.cnt + 1, new_arr__7943)
    }else {
      if(cljs.core._EQ_.call(null, this__7939.arr[idx__7941], val)) {
        return inode__7940
      }else {
        return new cljs.core.HashCollisionNode(null, this__7939.collision_hash, this__7939.cnt, cljs.core.clone_and_set.call(null, this__7939.arr, idx__7941 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__7939.collision_hash >>> shift & 31), [null, inode__7940])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__7944 = this;
  var inode__7945 = this;
  var idx__7946 = cljs.core.hash_collision_node_find_index.call(null, this__7944.arr, this__7944.cnt, key);
  if(idx__7946 === -1) {
    return inode__7945
  }else {
    if(this__7944.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__7944.collision_hash, this__7944.cnt - 1, cljs.core.remove_pair.call(null, this__7944.arr, cljs.core.quot.call(null, idx__7946, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__7973 = null;
  var G__7973__3 = function(shift, hash, key) {
    var this__7947 = this;
    var inode__7948 = this;
    var idx__7949 = cljs.core.hash_collision_node_find_index.call(null, this__7947.arr, this__7947.cnt, key);
    if(idx__7949 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__7947.arr[idx__7949])) {
        return cljs.core.PersistentVector.fromArray([this__7947.arr[idx__7949], this__7947.arr[idx__7949 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__7973__4 = function(shift, hash, key, not_found) {
    var this__7950 = this;
    var inode__7951 = this;
    var idx__7952 = cljs.core.hash_collision_node_find_index.call(null, this__7950.arr, this__7950.cnt, key);
    if(idx__7952 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__7950.arr[idx__7952])) {
        return cljs.core.PersistentVector.fromArray([this__7950.arr[idx__7952], this__7950.arr[idx__7952 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__7973 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__7973__3.call(this, shift, hash, key);
      case 4:
        return G__7973__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7973
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__7953 = this;
  var inode__7954 = this;
  return cljs.core.create_inode_seq.call(null, this__7953.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__7974 = null;
  var G__7974__1 = function(e) {
    var this__7955 = this;
    var inode__7956 = this;
    if(e === this__7955.edit) {
      return inode__7956
    }else {
      var new_arr__7957 = cljs.core.make_array.call(null, 2 * (this__7955.cnt + 1));
      cljs.core.array_copy.call(null, this__7955.arr, 0, new_arr__7957, 0, 2 * this__7955.cnt);
      return new cljs.core.HashCollisionNode(e, this__7955.collision_hash, this__7955.cnt, new_arr__7957)
    }
  };
  var G__7974__3 = function(e, count, array) {
    var this__7958 = this;
    var inode__7959 = this;
    if(e === this__7958.edit) {
      this__7958.arr = array;
      this__7958.cnt = count;
      return inode__7959
    }else {
      return new cljs.core.HashCollisionNode(this__7958.edit, this__7958.collision_hash, count, array)
    }
  };
  G__7974 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__7974__1.call(this, e);
      case 3:
        return G__7974__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7974
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__7960 = this;
  var inode__7961 = this;
  if(hash === this__7960.collision_hash) {
    var idx__7962 = cljs.core.hash_collision_node_find_index.call(null, this__7960.arr, this__7960.cnt, key);
    if(idx__7962 === -1) {
      if(this__7960.arr.length > 2 * this__7960.cnt) {
        var editable__7963 = cljs.core.edit_and_set.call(null, inode__7961, edit, 2 * this__7960.cnt, key, 2 * this__7960.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__7963.cnt = editable__7963.cnt + 1;
        return editable__7963
      }else {
        var len__7964 = this__7960.arr.length;
        var new_arr__7965 = cljs.core.make_array.call(null, len__7964 + 2);
        cljs.core.array_copy.call(null, this__7960.arr, 0, new_arr__7965, 0, len__7964);
        new_arr__7965[len__7964] = key;
        new_arr__7965[len__7964 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__7961.ensure_editable(edit, this__7960.cnt + 1, new_arr__7965)
      }
    }else {
      if(this__7960.arr[idx__7962 + 1] === val) {
        return inode__7961
      }else {
        return cljs.core.edit_and_set.call(null, inode__7961, edit, idx__7962 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__7960.collision_hash >>> shift & 31), [null, inode__7961, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__7966 = this;
  var inode__7967 = this;
  var idx__7968 = cljs.core.hash_collision_node_find_index.call(null, this__7966.arr, this__7966.cnt, key);
  if(idx__7968 === -1) {
    return inode__7967
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__7966.cnt === 1) {
      return null
    }else {
      var editable__7969 = inode__7967.ensure_editable(edit);
      var earr__7970 = editable__7969.arr;
      earr__7970[idx__7968] = earr__7970[2 * this__7966.cnt - 2];
      earr__7970[idx__7968 + 1] = earr__7970[2 * this__7966.cnt - 1];
      earr__7970[2 * this__7966.cnt - 1] = null;
      earr__7970[2 * this__7966.cnt - 2] = null;
      editable__7969.cnt = editable__7969.cnt - 1;
      return editable__7969
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__7971 = this;
  var inode__7972 = this;
  return cljs.core.inode_kv_reduce.call(null, this__7971.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__7975 = cljs.core.hash.call(null, key1);
    if(key1hash__7975 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__7975, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___7976 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__7975, key1, val1, added_leaf_QMARK___7976).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___7976)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__7977 = cljs.core.hash.call(null, key1);
    if(key1hash__7977 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__7977, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___7978 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__7977, key1, val1, added_leaf_QMARK___7978).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___7978)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7979 = this;
  var h__364__auto____7980 = this__7979.__hash;
  if(h__364__auto____7980 != null) {
    return h__364__auto____7980
  }else {
    var h__364__auto____7981 = cljs.core.hash_coll.call(null, coll);
    this__7979.__hash = h__364__auto____7981;
    return h__364__auto____7981
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7982 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__7983 = this;
  var this$__7984 = this;
  return cljs.core.pr_str.call(null, this$__7984)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__7985 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7986 = this;
  if(this__7986.s == null) {
    return cljs.core.PersistentVector.fromArray([this__7986.nodes[this__7986.i], this__7986.nodes[this__7986.i + 1]])
  }else {
    return cljs.core.first.call(null, this__7986.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7987 = this;
  if(this__7987.s == null) {
    return cljs.core.create_inode_seq.call(null, this__7987.nodes, this__7987.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__7987.nodes, this__7987.i, cljs.core.next.call(null, this__7987.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7988 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7989 = this;
  return new cljs.core.NodeSeq(meta, this__7989.nodes, this__7989.i, this__7989.s, this__7989.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7990 = this;
  return this__7990.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7991 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7991.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__7992 = nodes.length;
      var j__7993 = i;
      while(true) {
        if(j__7993 < len__7992) {
          if(null != nodes[j__7993]) {
            return new cljs.core.NodeSeq(null, nodes, j__7993, null, null)
          }else {
            var temp__3695__auto____7994 = nodes[j__7993 + 1];
            if(cljs.core.truth_(temp__3695__auto____7994)) {
              var node__7995 = temp__3695__auto____7994;
              var temp__3695__auto____7996 = node__7995.inode_seq();
              if(cljs.core.truth_(temp__3695__auto____7996)) {
                var node_seq__7997 = temp__3695__auto____7996;
                return new cljs.core.NodeSeq(null, nodes, j__7993 + 2, node_seq__7997, null)
              }else {
                var G__7998 = j__7993 + 2;
                j__7993 = G__7998;
                continue
              }
            }else {
              var G__7999 = j__7993 + 2;
              j__7993 = G__7999;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8000 = this;
  var h__364__auto____8001 = this__8000.__hash;
  if(h__364__auto____8001 != null) {
    return h__364__auto____8001
  }else {
    var h__364__auto____8002 = cljs.core.hash_coll.call(null, coll);
    this__8000.__hash = h__364__auto____8002;
    return h__364__auto____8002
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8003 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8004 = this;
  var this$__8005 = this;
  return cljs.core.pr_str.call(null, this$__8005)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8006 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8007 = this;
  return cljs.core.first.call(null, this__8007.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8008 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8008.nodes, this__8008.i, cljs.core.next.call(null, this__8008.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8009 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8010 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8010.nodes, this__8010.i, this__8010.s, this__8010.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8011 = this;
  return this__8011.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8012 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8012.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8013 = nodes.length;
      var j__8014 = i;
      while(true) {
        if(j__8014 < len__8013) {
          var temp__3695__auto____8015 = nodes[j__8014];
          if(cljs.core.truth_(temp__3695__auto____8015)) {
            var nj__8016 = temp__3695__auto____8015;
            var temp__3695__auto____8017 = nj__8016.inode_seq();
            if(cljs.core.truth_(temp__3695__auto____8017)) {
              var ns__8018 = temp__3695__auto____8017;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8014 + 1, ns__8018, null)
            }else {
              var G__8019 = j__8014 + 1;
              j__8014 = G__8019;
              continue
            }
          }else {
            var G__8020 = j__8014 + 1;
            j__8014 = G__8020;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8025 = this;
  return new cljs.core.TransientHashMap({}, this__8025.root, this__8025.cnt, this__8025.has_nil_QMARK_, this__8025.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8026 = this;
  var h__364__auto____8027 = this__8026.__hash;
  if(h__364__auto____8027 != null) {
    return h__364__auto____8027
  }else {
    var h__364__auto____8028 = cljs.core.hash_imap.call(null, coll);
    this__8026.__hash = h__364__auto____8028;
    return h__364__auto____8028
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8029 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8030 = this;
  if(k == null) {
    if(cljs.core.truth_(this__8030.has_nil_QMARK_)) {
      return this__8030.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8030.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__8030.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8031 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8032 = this__8031.has_nil_QMARK_;
      if(cljs.core.truth_(and__3546__auto____8032)) {
        return v === this__8031.nil_val
      }else {
        return and__3546__auto____8032
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8031.meta, cljs.core.truth_(this__8031.has_nil_QMARK_) ? this__8031.cnt : this__8031.cnt + 1, this__8031.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8033 = [false];
    var new_root__8034 = (this__8031.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8031.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8033);
    if(new_root__8034 === this__8031.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8031.meta, cljs.core.truth_(added_leaf_QMARK___8033[0]) ? this__8031.cnt + 1 : this__8031.cnt, new_root__8034, this__8031.has_nil_QMARK_, this__8031.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8035 = this;
  if(k == null) {
    return this__8035.has_nil_QMARK_
  }else {
    if(this__8035.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__8035.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8056 = null;
  var G__8056__2 = function(tsym8023, k) {
    var this__8036 = this;
    var tsym8023__8037 = this;
    var coll__8038 = tsym8023__8037;
    return cljs.core._lookup.call(null, coll__8038, k)
  };
  var G__8056__3 = function(tsym8024, k, not_found) {
    var this__8039 = this;
    var tsym8024__8040 = this;
    var coll__8041 = tsym8024__8040;
    return cljs.core._lookup.call(null, coll__8041, k, not_found)
  };
  G__8056 = function(tsym8024, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8056__2.call(this, tsym8024, k);
      case 3:
        return G__8056__3.call(this, tsym8024, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8056
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym8021, args8022) {
  return tsym8021.call.apply(tsym8021, [tsym8021].concat(cljs.core.aclone.call(null, args8022)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8042 = this;
  var init__8043 = cljs.core.truth_(this__8042.has_nil_QMARK_) ? f.call(null, init, null, this__8042.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8043)) {
    return cljs.core.deref.call(null, init__8043)
  }else {
    if(null != this__8042.root) {
      return this__8042.root.kv_reduce(f, init__8043)
    }else {
      if("\ufdd0'else") {
        return init__8043
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8044 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8045 = this;
  var this$__8046 = this;
  return cljs.core.pr_str.call(null, this$__8046)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8047 = this;
  if(this__8047.cnt > 0) {
    var s__8048 = null != this__8047.root ? this__8047.root.inode_seq() : null;
    if(cljs.core.truth_(this__8047.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8047.nil_val]), s__8048)
    }else {
      return s__8048
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8049 = this;
  return this__8049.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8050 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8051 = this;
  return new cljs.core.PersistentHashMap(meta, this__8051.cnt, this__8051.root, this__8051.has_nil_QMARK_, this__8051.nil_val, this__8051.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8052 = this;
  return this__8052.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8053 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8053.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8054 = this;
  if(k == null) {
    if(cljs.core.truth_(this__8054.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__8054.meta, this__8054.cnt - 1, this__8054.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8054.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8055 = this__8054.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8055 === this__8054.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8054.meta, this__8054.cnt - 1, new_root__8055, this__8054.has_nil_QMARK_, this__8054.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8057 = ks.length;
  var i__8058 = 0;
  var out__8059 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8058 < len__8057) {
      var G__8060 = i__8058 + 1;
      var G__8061 = cljs.core.assoc_BANG_.call(null, out__8059, ks[i__8058], vs[i__8058]);
      i__8058 = G__8060;
      out__8059 = G__8061;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8059)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8062 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8063 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8064 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8065 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8066 = this;
  if(k == null) {
    if(cljs.core.truth_(this__8066.has_nil_QMARK_)) {
      return this__8066.nil_val
    }else {
      return null
    }
  }else {
    if(this__8066.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__8066.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8067 = this;
  if(k == null) {
    if(cljs.core.truth_(this__8067.has_nil_QMARK_)) {
      return this__8067.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8067.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__8067.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8068 = this;
  if(cljs.core.truth_(this__8068.edit)) {
    return this__8068.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8069 = this;
  var tcoll__8070 = this;
  if(cljs.core.truth_(this__8069.edit)) {
    if(function() {
      var G__8071__8072 = o;
      if(G__8071__8072 != null) {
        if(function() {
          var or__3548__auto____8073 = G__8071__8072.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3548__auto____8073) {
            return or__3548__auto____8073
          }else {
            return G__8071__8072.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8071__8072.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8071__8072)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8071__8072)
      }
    }()) {
      return tcoll__8070.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8074 = cljs.core.seq.call(null, o);
      var tcoll__8075 = tcoll__8070;
      while(true) {
        var temp__3695__auto____8076 = cljs.core.first.call(null, es__8074);
        if(cljs.core.truth_(temp__3695__auto____8076)) {
          var e__8077 = temp__3695__auto____8076;
          var G__8088 = cljs.core.next.call(null, es__8074);
          var G__8089 = tcoll__8075.assoc_BANG_(cljs.core.key.call(null, e__8077), cljs.core.val.call(null, e__8077));
          es__8074 = G__8088;
          tcoll__8075 = G__8089;
          continue
        }else {
          return tcoll__8075
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__8078 = this;
  var tcoll__8079 = this;
  if(cljs.core.truth_(this__8078.edit)) {
    if(k == null) {
      if(this__8078.nil_val === v) {
      }else {
        this__8078.nil_val = v
      }
      if(cljs.core.truth_(this__8078.has_nil_QMARK_)) {
      }else {
        this__8078.count = this__8078.count + 1;
        this__8078.has_nil_QMARK_ = true
      }
      return tcoll__8079
    }else {
      var added_leaf_QMARK___8080 = [false];
      var node__8081 = (this__8078.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8078.root).inode_assoc_BANG_(this__8078.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8080);
      if(node__8081 === this__8078.root) {
      }else {
        this__8078.root = node__8081
      }
      if(cljs.core.truth_(added_leaf_QMARK___8080[0])) {
        this__8078.count = this__8078.count + 1
      }else {
      }
      return tcoll__8079
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__8082 = this;
  var tcoll__8083 = this;
  if(cljs.core.truth_(this__8082.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__8082.has_nil_QMARK_)) {
        this__8082.has_nil_QMARK_ = false;
        this__8082.nil_val = null;
        this__8082.count = this__8082.count - 1;
        return tcoll__8083
      }else {
        return tcoll__8083
      }
    }else {
      if(this__8082.root == null) {
        return tcoll__8083
      }else {
        var removed_leaf_QMARK___8084 = [false];
        var node__8085 = this__8082.root.inode_without_BANG_(this__8082.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___8084);
        if(node__8085 === this__8082.root) {
        }else {
          this__8082.root = node__8085
        }
        if(cljs.core.truth_(removed_leaf_QMARK___8084[0])) {
          this__8082.count = this__8082.count - 1
        }else {
        }
        return tcoll__8083
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__8086 = this;
  var tcoll__8087 = this;
  if(cljs.core.truth_(this__8086.edit)) {
    this__8086.edit = null;
    return new cljs.core.PersistentHashMap(null, this__8086.count, this__8086.root, this__8086.has_nil_QMARK_, this__8086.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__8090 = node;
  var stack__8091 = stack;
  while(true) {
    if(t__8090 != null) {
      var G__8092 = cljs.core.truth_(ascending_QMARK_) ? t__8090.left : t__8090.right;
      var G__8093 = cljs.core.conj.call(null, stack__8091, t__8090);
      t__8090 = G__8092;
      stack__8091 = G__8093;
      continue
    }else {
      return stack__8091
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8094 = this;
  var h__364__auto____8095 = this__8094.__hash;
  if(h__364__auto____8095 != null) {
    return h__364__auto____8095
  }else {
    var h__364__auto____8096 = cljs.core.hash_coll.call(null, coll);
    this__8094.__hash = h__364__auto____8096;
    return h__364__auto____8096
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8097 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__8098 = this;
  var this$__8099 = this;
  return cljs.core.pr_str.call(null, this$__8099)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8100 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8101 = this;
  if(this__8101.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__8101.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__8102 = this;
  return cljs.core.peek.call(null, this__8102.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__8103 = this;
  var t__8104 = cljs.core.peek.call(null, this__8103.stack);
  var next_stack__8105 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__8103.ascending_QMARK_) ? t__8104.right : t__8104.left, cljs.core.pop.call(null, this__8103.stack), this__8103.ascending_QMARK_);
  if(next_stack__8105 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__8105, this__8103.ascending_QMARK_, this__8103.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8106 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8107 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__8107.stack, this__8107.ascending_QMARK_, this__8107.cnt, this__8107.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8108 = this;
  return this__8108.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3546__auto____8109 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3546__auto____8109) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3546__auto____8109
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3546__auto____8110 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3546__auto____8110) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3546__auto____8110
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__8111 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__8111)) {
    return cljs.core.deref.call(null, init__8111)
  }else {
    var init__8112 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__8111) : init__8111;
    if(cljs.core.reduced_QMARK_.call(null, init__8112)) {
      return cljs.core.deref.call(null, init__8112)
    }else {
      var init__8113 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__8112) : init__8112;
      if(cljs.core.reduced_QMARK_.call(null, init__8113)) {
        return cljs.core.deref.call(null, init__8113)
      }else {
        return init__8113
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8118 = this;
  var h__364__auto____8119 = this__8118.__hash;
  if(h__364__auto____8119 != null) {
    return h__364__auto____8119
  }else {
    var h__364__auto____8120 = cljs.core.hash_coll.call(null, coll);
    this__8118.__hash = h__364__auto____8120;
    return h__364__auto____8120
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8121 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8122 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8123 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8123.key, this__8123.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__8170 = null;
  var G__8170__2 = function(tsym8116, k) {
    var this__8124 = this;
    var tsym8116__8125 = this;
    var node__8126 = tsym8116__8125;
    return cljs.core._lookup.call(null, node__8126, k)
  };
  var G__8170__3 = function(tsym8117, k, not_found) {
    var this__8127 = this;
    var tsym8117__8128 = this;
    var node__8129 = tsym8117__8128;
    return cljs.core._lookup.call(null, node__8129, k, not_found)
  };
  G__8170 = function(tsym8117, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8170__2.call(this, tsym8117, k);
      case 3:
        return G__8170__3.call(this, tsym8117, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8170
}();
cljs.core.BlackNode.prototype.apply = function(tsym8114, args8115) {
  return tsym8114.call.apply(tsym8114, [tsym8114].concat(cljs.core.aclone.call(null, args8115)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8130 = this;
  return cljs.core.PersistentVector.fromArray([this__8130.key, this__8130.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8131 = this;
  return this__8131.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8132 = this;
  return this__8132.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__8133 = this;
  var node__8134 = this;
  return ins.balance_right(node__8134)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__8135 = this;
  var node__8136 = this;
  return new cljs.core.RedNode(this__8135.key, this__8135.val, this__8135.left, this__8135.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__8137 = this;
  var node__8138 = this;
  return cljs.core.balance_right_del.call(null, this__8137.key, this__8137.val, this__8137.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__8139 = this;
  var node__8140 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__8141 = this;
  var node__8142 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8142, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__8143 = this;
  var node__8144 = this;
  return cljs.core.balance_left_del.call(null, this__8143.key, this__8143.val, del, this__8143.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__8145 = this;
  var node__8146 = this;
  return ins.balance_left(node__8146)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__8147 = this;
  var node__8148 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__8148, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__8171 = null;
  var G__8171__0 = function() {
    var this__8151 = this;
    var this$__8152 = this;
    return cljs.core.pr_str.call(null, this$__8152)
  };
  G__8171 = function() {
    switch(arguments.length) {
      case 0:
        return G__8171__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8171
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__8153 = this;
  var node__8154 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8154, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__8155 = this;
  var node__8156 = this;
  return node__8156
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8157 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8158 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8159 = this;
  return cljs.core.list.call(null, this__8159.key, this__8159.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8161 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8162 = this;
  return this__8162.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8163 = this;
  return cljs.core.PersistentVector.fromArray([this__8163.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8164 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8164.key, this__8164.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8165 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8166 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8166.key, this__8166.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8167 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8168 = this;
  if(n === 0) {
    return this__8168.key
  }else {
    if(n === 1) {
      return this__8168.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8169 = this;
  if(n === 0) {
    return this__8169.key
  }else {
    if(n === 1) {
      return this__8169.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8160 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8176 = this;
  var h__364__auto____8177 = this__8176.__hash;
  if(h__364__auto____8177 != null) {
    return h__364__auto____8177
  }else {
    var h__364__auto____8178 = cljs.core.hash_coll.call(null, coll);
    this__8176.__hash = h__364__auto____8178;
    return h__364__auto____8178
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__8179 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__8180 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__8181 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__8181.key, this__8181.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__8228 = null;
  var G__8228__2 = function(tsym8174, k) {
    var this__8182 = this;
    var tsym8174__8183 = this;
    var node__8184 = tsym8174__8183;
    return cljs.core._lookup.call(null, node__8184, k)
  };
  var G__8228__3 = function(tsym8175, k, not_found) {
    var this__8185 = this;
    var tsym8175__8186 = this;
    var node__8187 = tsym8175__8186;
    return cljs.core._lookup.call(null, node__8187, k, not_found)
  };
  G__8228 = function(tsym8175, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8228__2.call(this, tsym8175, k);
      case 3:
        return G__8228__3.call(this, tsym8175, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8228
}();
cljs.core.RedNode.prototype.apply = function(tsym8172, args8173) {
  return tsym8172.call.apply(tsym8172, [tsym8172].concat(cljs.core.aclone.call(null, args8173)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__8188 = this;
  return cljs.core.PersistentVector.fromArray([this__8188.key, this__8188.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__8189 = this;
  return this__8189.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__8190 = this;
  return this__8190.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__8191 = this;
  var node__8192 = this;
  return new cljs.core.RedNode(this__8191.key, this__8191.val, this__8191.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__8193 = this;
  var node__8194 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__8195 = this;
  var node__8196 = this;
  return new cljs.core.RedNode(this__8195.key, this__8195.val, this__8195.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__8197 = this;
  var node__8198 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__8199 = this;
  var node__8200 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__8200, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__8201 = this;
  var node__8202 = this;
  return new cljs.core.RedNode(this__8201.key, this__8201.val, del, this__8201.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__8203 = this;
  var node__8204 = this;
  return new cljs.core.RedNode(this__8203.key, this__8203.val, ins, this__8203.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__8205 = this;
  var node__8206 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8205.left)) {
    return new cljs.core.RedNode(this__8205.key, this__8205.val, this__8205.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__8205.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8205.right)) {
      return new cljs.core.RedNode(this__8205.right.key, this__8205.right.val, new cljs.core.BlackNode(this__8205.key, this__8205.val, this__8205.left, this__8205.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__8205.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__8206, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__8229 = null;
  var G__8229__0 = function() {
    var this__8209 = this;
    var this$__8210 = this;
    return cljs.core.pr_str.call(null, this$__8210)
  };
  G__8229 = function() {
    switch(arguments.length) {
      case 0:
        return G__8229__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8229
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__8211 = this;
  var node__8212 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8211.right)) {
    return new cljs.core.RedNode(this__8211.key, this__8211.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8211.left, null), this__8211.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__8211.left)) {
      return new cljs.core.RedNode(this__8211.left.key, this__8211.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__8211.left.left, null), new cljs.core.BlackNode(this__8211.key, this__8211.val, this__8211.left.right, this__8211.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__8212, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__8213 = this;
  var node__8214 = this;
  return new cljs.core.BlackNode(this__8213.key, this__8213.val, this__8213.left, this__8213.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__8215 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__8216 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__8217 = this;
  return cljs.core.list.call(null, this__8217.key, this__8217.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__8219 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__8220 = this;
  return this__8220.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__8221 = this;
  return cljs.core.PersistentVector.fromArray([this__8221.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__8222 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__8222.key, this__8222.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8223 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__8224 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__8224.key, this__8224.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__8225 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__8226 = this;
  if(n === 0) {
    return this__8226.key
  }else {
    if(n === 1) {
      return this__8226.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__8227 = this;
  if(n === 0) {
    return this__8227.key
  }else {
    if(n === 1) {
      return this__8227.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__8218 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__8230 = comp.call(null, k, tree.key);
    if(c__8230 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__8230 < 0) {
        var ins__8231 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__8231 != null) {
          return tree.add_left(ins__8231)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__8232 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__8232 != null) {
            return tree.add_right(ins__8232)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__8233 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8233)) {
            return new cljs.core.RedNode(app__8233.key, app__8233.val, new cljs.core.RedNode(left.key, left.val, left.left, app__8233.left), new cljs.core.RedNode(right.key, right.val, app__8233.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__8233, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__8234 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__8234)) {
              return new cljs.core.RedNode(app__8234.key, app__8234.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__8234.left, null), new cljs.core.BlackNode(right.key, right.val, app__8234.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__8234, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__8235 = comp.call(null, k, tree.key);
    if(c__8235 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__8235 < 0) {
        var del__8236 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3548__auto____8237 = del__8236 != null;
          if(or__3548__auto____8237) {
            return or__3548__auto____8237
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__8236, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__8236, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__8238 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3548__auto____8239 = del__8238 != null;
            if(or__3548__auto____8239) {
              return or__3548__auto____8239
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__8238)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__8238, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__8240 = tree.key;
  var c__8241 = comp.call(null, k, tk__8240);
  if(c__8241 === 0) {
    return tree.replace(tk__8240, v, tree.left, tree.right)
  }else {
    if(c__8241 < 0) {
      return tree.replace(tk__8240, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__8240, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8246 = this;
  var h__364__auto____8247 = this__8246.__hash;
  if(h__364__auto____8247 != null) {
    return h__364__auto____8247
  }else {
    var h__364__auto____8248 = cljs.core.hash_imap.call(null, coll);
    this__8246.__hash = h__364__auto____8248;
    return h__364__auto____8248
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8249 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8250 = this;
  var n__8251 = coll.entry_at(k);
  if(n__8251 != null) {
    return n__8251.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8252 = this;
  var found__8253 = [null];
  var t__8254 = cljs.core.tree_map_add.call(null, this__8252.comp, this__8252.tree, k, v, found__8253);
  if(t__8254 == null) {
    var found_node__8255 = cljs.core.nth.call(null, found__8253, 0);
    if(cljs.core._EQ_.call(null, v, found_node__8255.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8252.comp, cljs.core.tree_map_replace.call(null, this__8252.comp, this__8252.tree, k, v), this__8252.cnt, this__8252.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8252.comp, t__8254.blacken(), this__8252.cnt + 1, this__8252.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8256 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__8288 = null;
  var G__8288__2 = function(tsym8244, k) {
    var this__8257 = this;
    var tsym8244__8258 = this;
    var coll__8259 = tsym8244__8258;
    return cljs.core._lookup.call(null, coll__8259, k)
  };
  var G__8288__3 = function(tsym8245, k, not_found) {
    var this__8260 = this;
    var tsym8245__8261 = this;
    var coll__8262 = tsym8245__8261;
    return cljs.core._lookup.call(null, coll__8262, k, not_found)
  };
  G__8288 = function(tsym8245, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8288__2.call(this, tsym8245, k);
      case 3:
        return G__8288__3.call(this, tsym8245, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8288
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym8242, args8243) {
  return tsym8242.call.apply(tsym8242, [tsym8242].concat(cljs.core.aclone.call(null, args8243)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8263 = this;
  if(this__8263.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__8263.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8264 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8265 = this;
  if(this__8265.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8265.tree, false, this__8265.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__8266 = this;
  var this$__8267 = this;
  return cljs.core.pr_str.call(null, this$__8267)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__8268 = this;
  var coll__8269 = this;
  var t__8270 = this__8268.tree;
  while(true) {
    if(t__8270 != null) {
      var c__8271 = this__8268.comp.call(null, k, t__8270.key);
      if(c__8271 === 0) {
        return t__8270
      }else {
        if(c__8271 < 0) {
          var G__8289 = t__8270.left;
          t__8270 = G__8289;
          continue
        }else {
          if("\ufdd0'else") {
            var G__8290 = t__8270.right;
            t__8270 = G__8290;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8272 = this;
  if(this__8272.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8272.tree, ascending_QMARK_, this__8272.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8273 = this;
  if(this__8273.cnt > 0) {
    var stack__8274 = null;
    var t__8275 = this__8273.tree;
    while(true) {
      if(t__8275 != null) {
        var c__8276 = this__8273.comp.call(null, k, t__8275.key);
        if(c__8276 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__8274, t__8275), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__8276 < 0) {
              var G__8291 = cljs.core.conj.call(null, stack__8274, t__8275);
              var G__8292 = t__8275.left;
              stack__8274 = G__8291;
              t__8275 = G__8292;
              continue
            }else {
              var G__8293 = stack__8274;
              var G__8294 = t__8275.right;
              stack__8274 = G__8293;
              t__8275 = G__8294;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__8276 > 0) {
                var G__8295 = cljs.core.conj.call(null, stack__8274, t__8275);
                var G__8296 = t__8275.right;
                stack__8274 = G__8295;
                t__8275 = G__8296;
                continue
              }else {
                var G__8297 = stack__8274;
                var G__8298 = t__8275.left;
                stack__8274 = G__8297;
                t__8275 = G__8298;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__8274 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__8274, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8277 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8278 = this;
  return this__8278.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8279 = this;
  if(this__8279.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__8279.tree, true, this__8279.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8280 = this;
  return this__8280.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8281 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8282 = this;
  return new cljs.core.PersistentTreeMap(this__8282.comp, this__8282.tree, this__8282.cnt, meta, this__8282.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8286 = this;
  return this__8286.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8287 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__8287.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8283 = this;
  var found__8284 = [null];
  var t__8285 = cljs.core.tree_map_remove.call(null, this__8283.comp, this__8283.tree, k, found__8284);
  if(t__8285 == null) {
    if(cljs.core.nth.call(null, found__8284, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__8283.comp, null, 0, this__8283.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__8283.comp, t__8285.blacken(), this__8283.cnt - 1, this__8283.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__8299 = cljs.core.seq.call(null, keyvals);
    var out__8300 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__8299)) {
        var G__8301 = cljs.core.nnext.call(null, in$__8299);
        var G__8302 = cljs.core.assoc_BANG_.call(null, out__8300, cljs.core.first.call(null, in$__8299), cljs.core.second.call(null, in$__8299));
        in$__8299 = G__8301;
        out__8300 = G__8302;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8300)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__8303) {
    var keyvals = cljs.core.seq(arglist__8303);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__8304) {
    var keyvals = cljs.core.seq(arglist__8304);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__8305 = cljs.core.seq.call(null, keyvals);
    var out__8306 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__8305)) {
        var G__8307 = cljs.core.nnext.call(null, in$__8305);
        var G__8308 = cljs.core.assoc.call(null, out__8306, cljs.core.first.call(null, in$__8305), cljs.core.second.call(null, in$__8305));
        in$__8305 = G__8307;
        out__8306 = G__8308;
        continue
      }else {
        return out__8306
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__8309) {
    var keyvals = cljs.core.seq(arglist__8309);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__8310 = cljs.core.seq.call(null, keyvals);
    var out__8311 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__8310)) {
        var G__8312 = cljs.core.nnext.call(null, in$__8310);
        var G__8313 = cljs.core.assoc.call(null, out__8311, cljs.core.first.call(null, in$__8310), cljs.core.second.call(null, in$__8310));
        in$__8310 = G__8312;
        out__8311 = G__8313;
        continue
      }else {
        return out__8311
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__8314) {
    var comparator = cljs.core.first(arglist__8314);
    var keyvals = cljs.core.rest(arglist__8314);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__8315_SHARP_, p2__8316_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3548__auto____8317 = p1__8315_SHARP_;
          if(cljs.core.truth_(or__3548__auto____8317)) {
            return or__3548__auto____8317
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__8316_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__8318) {
    var maps = cljs.core.seq(arglist__8318);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__8321 = function(m, e) {
        var k__8319 = cljs.core.first.call(null, e);
        var v__8320 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__8319)) {
          return cljs.core.assoc.call(null, m, k__8319, f.call(null, cljs.core.get.call(null, m, k__8319), v__8320))
        }else {
          return cljs.core.assoc.call(null, m, k__8319, v__8320)
        }
      };
      var merge2__8323 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__8321, function() {
          var or__3548__auto____8322 = m1;
          if(cljs.core.truth_(or__3548__auto____8322)) {
            return or__3548__auto____8322
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__8323, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__8324) {
    var f = cljs.core.first(arglist__8324);
    var maps = cljs.core.rest(arglist__8324);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__8325 = cljs.core.ObjMap.fromObject([], {});
  var keys__8326 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__8326)) {
      var key__8327 = cljs.core.first.call(null, keys__8326);
      var entry__8328 = cljs.core.get.call(null, map, key__8327, "\ufdd0'user/not-found");
      var G__8329 = cljs.core.not_EQ_.call(null, entry__8328, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__8325, key__8327, entry__8328) : ret__8325;
      var G__8330 = cljs.core.next.call(null, keys__8326);
      ret__8325 = G__8329;
      keys__8326 = G__8330;
      continue
    }else {
      return ret__8325
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8336 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__8336.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8337 = this;
  var h__364__auto____8338 = this__8337.__hash;
  if(h__364__auto____8338 != null) {
    return h__364__auto____8338
  }else {
    var h__364__auto____8339 = cljs.core.hash_iset.call(null, coll);
    this__8337.__hash = h__364__auto____8339;
    return h__364__auto____8339
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8340 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8341 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8341.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__8360 = null;
  var G__8360__2 = function(tsym8334, k) {
    var this__8342 = this;
    var tsym8334__8343 = this;
    var coll__8344 = tsym8334__8343;
    return cljs.core._lookup.call(null, coll__8344, k)
  };
  var G__8360__3 = function(tsym8335, k, not_found) {
    var this__8345 = this;
    var tsym8335__8346 = this;
    var coll__8347 = tsym8335__8346;
    return cljs.core._lookup.call(null, coll__8347, k, not_found)
  };
  G__8360 = function(tsym8335, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8360__2.call(this, tsym8335, k);
      case 3:
        return G__8360__3.call(this, tsym8335, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8360
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym8332, args8333) {
  return tsym8332.call.apply(tsym8332, [tsym8332].concat(cljs.core.aclone.call(null, args8333)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8348 = this;
  return new cljs.core.PersistentHashSet(this__8348.meta, cljs.core.assoc.call(null, this__8348.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__8349 = this;
  var this$__8350 = this;
  return cljs.core.pr_str.call(null, this$__8350)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8351 = this;
  return cljs.core.keys.call(null, this__8351.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8352 = this;
  return new cljs.core.PersistentHashSet(this__8352.meta, cljs.core.dissoc.call(null, this__8352.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8353 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8354 = this;
  var and__3546__auto____8355 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____8355) {
    var and__3546__auto____8356 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____8356) {
      return cljs.core.every_QMARK_.call(null, function(p1__8331_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8331_SHARP_)
      }, other)
    }else {
      return and__3546__auto____8356
    }
  }else {
    return and__3546__auto____8355
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8357 = this;
  return new cljs.core.PersistentHashSet(meta, this__8357.hash_map, this__8357.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8358 = this;
  return this__8358.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8359 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__8359.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__8378 = null;
  var G__8378__2 = function(tsym8364, k) {
    var this__8366 = this;
    var tsym8364__8367 = this;
    var tcoll__8368 = tsym8364__8367;
    if(cljs.core._lookup.call(null, this__8366.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__8378__3 = function(tsym8365, k, not_found) {
    var this__8369 = this;
    var tsym8365__8370 = this;
    var tcoll__8371 = tsym8365__8370;
    if(cljs.core._lookup.call(null, this__8369.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__8378 = function(tsym8365, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8378__2.call(this, tsym8365, k);
      case 3:
        return G__8378__3.call(this, tsym8365, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8378
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym8362, args8363) {
  return tsym8362.call.apply(tsym8362, [tsym8362].concat(cljs.core.aclone.call(null, args8363)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__8372 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__8373 = this;
  if(cljs.core._lookup.call(null, this__8373.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8374 = this;
  return cljs.core.count.call(null, this__8374.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__8375 = this;
  this__8375.transient_map = cljs.core.dissoc_BANG_.call(null, this__8375.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8376 = this;
  this__8376.transient_map = cljs.core.assoc_BANG_.call(null, this__8376.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8377 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__8377.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8383 = this;
  var h__364__auto____8384 = this__8383.__hash;
  if(h__364__auto____8384 != null) {
    return h__364__auto____8384
  }else {
    var h__364__auto____8385 = cljs.core.hash_iset.call(null, coll);
    this__8383.__hash = h__364__auto____8385;
    return h__364__auto____8385
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__8386 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__8387 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__8387.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__8411 = null;
  var G__8411__2 = function(tsym8381, k) {
    var this__8388 = this;
    var tsym8381__8389 = this;
    var coll__8390 = tsym8381__8389;
    return cljs.core._lookup.call(null, coll__8390, k)
  };
  var G__8411__3 = function(tsym8382, k, not_found) {
    var this__8391 = this;
    var tsym8382__8392 = this;
    var coll__8393 = tsym8382__8392;
    return cljs.core._lookup.call(null, coll__8393, k, not_found)
  };
  G__8411 = function(tsym8382, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8411__2.call(this, tsym8382, k);
      case 3:
        return G__8411__3.call(this, tsym8382, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8411
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym8379, args8380) {
  return tsym8379.call.apply(tsym8379, [tsym8379].concat(cljs.core.aclone.call(null, args8380)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8394 = this;
  return new cljs.core.PersistentTreeSet(this__8394.meta, cljs.core.assoc.call(null, this__8394.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8395 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__8395.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__8396 = this;
  var this$__8397 = this;
  return cljs.core.pr_str.call(null, this$__8397)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__8398 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__8398.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__8399 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__8399.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__8400 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__8401 = this;
  return cljs.core._comparator.call(null, this__8401.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8402 = this;
  return cljs.core.keys.call(null, this__8402.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__8403 = this;
  return new cljs.core.PersistentTreeSet(this__8403.meta, cljs.core.dissoc.call(null, this__8403.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8404 = this;
  return cljs.core.count.call(null, this__8404.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8405 = this;
  var and__3546__auto____8406 = cljs.core.set_QMARK_.call(null, other);
  if(and__3546__auto____8406) {
    var and__3546__auto____8407 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3546__auto____8407) {
      return cljs.core.every_QMARK_.call(null, function(p1__8361_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__8361_SHARP_)
      }, other)
    }else {
      return and__3546__auto____8407
    }
  }else {
    return and__3546__auto____8406
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8408 = this;
  return new cljs.core.PersistentTreeSet(meta, this__8408.tree_map, this__8408.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8409 = this;
  return this__8409.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8410 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__8410.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__8412 = cljs.core.seq.call(null, coll);
  var out__8413 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__8412))) {
      var G__8414 = cljs.core.next.call(null, in$__8412);
      var G__8415 = cljs.core.conj_BANG_.call(null, out__8413, cljs.core.first.call(null, in$__8412));
      in$__8412 = G__8414;
      out__8413 = G__8415;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8413)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__8416) {
    var keys = cljs.core.seq(arglist__8416);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__8418) {
    var comparator = cljs.core.first(arglist__8418);
    var keys = cljs.core.rest(arglist__8418);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__8419 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3695__auto____8420 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3695__auto____8420)) {
        var e__8421 = temp__3695__auto____8420;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__8421))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__8419, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__8417_SHARP_) {
      var temp__3695__auto____8422 = cljs.core.find.call(null, smap, p1__8417_SHARP_);
      if(cljs.core.truth_(temp__3695__auto____8422)) {
        var e__8423 = temp__3695__auto____8422;
        return cljs.core.second.call(null, e__8423)
      }else {
        return p1__8417_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__8431 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__8424, seen) {
        while(true) {
          var vec__8425__8426 = p__8424;
          var f__8427 = cljs.core.nth.call(null, vec__8425__8426, 0, null);
          var xs__8428 = vec__8425__8426;
          var temp__3698__auto____8429 = cljs.core.seq.call(null, xs__8428);
          if(cljs.core.truth_(temp__3698__auto____8429)) {
            var s__8430 = temp__3698__auto____8429;
            if(cljs.core.contains_QMARK_.call(null, seen, f__8427)) {
              var G__8432 = cljs.core.rest.call(null, s__8430);
              var G__8433 = seen;
              p__8424 = G__8432;
              seen = G__8433;
              continue
            }else {
              return cljs.core.cons.call(null, f__8427, step.call(null, cljs.core.rest.call(null, s__8430), cljs.core.conj.call(null, seen, f__8427)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__8431.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__8434 = cljs.core.PersistentVector.fromArray([]);
  var s__8435 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__8435))) {
      var G__8436 = cljs.core.conj.call(null, ret__8434, cljs.core.first.call(null, s__8435));
      var G__8437 = cljs.core.next.call(null, s__8435);
      ret__8434 = G__8436;
      s__8435 = G__8437;
      continue
    }else {
      return cljs.core.seq.call(null, ret__8434)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3548__auto____8438 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3548__auto____8438) {
        return or__3548__auto____8438
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__8439 = x.lastIndexOf("/");
      if(i__8439 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__8439 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3548__auto____8440 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3548__auto____8440) {
      return or__3548__auto____8440
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__8441 = x.lastIndexOf("/");
    if(i__8441 > -1) {
      return cljs.core.subs.call(null, x, 2, i__8441)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__8444 = cljs.core.ObjMap.fromObject([], {});
  var ks__8445 = cljs.core.seq.call(null, keys);
  var vs__8446 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3546__auto____8447 = ks__8445;
      if(cljs.core.truth_(and__3546__auto____8447)) {
        return vs__8446
      }else {
        return and__3546__auto____8447
      }
    }())) {
      var G__8448 = cljs.core.assoc.call(null, map__8444, cljs.core.first.call(null, ks__8445), cljs.core.first.call(null, vs__8446));
      var G__8449 = cljs.core.next.call(null, ks__8445);
      var G__8450 = cljs.core.next.call(null, vs__8446);
      map__8444 = G__8448;
      ks__8445 = G__8449;
      vs__8446 = G__8450;
      continue
    }else {
      return map__8444
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__8453__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8442_SHARP_, p2__8443_SHARP_) {
        return max_key.call(null, k, p1__8442_SHARP_, p2__8443_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__8453 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8453__delegate.call(this, k, x, y, more)
    };
    G__8453.cljs$lang$maxFixedArity = 3;
    G__8453.cljs$lang$applyTo = function(arglist__8454) {
      var k = cljs.core.first(arglist__8454);
      var x = cljs.core.first(cljs.core.next(arglist__8454));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8454)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8454)));
      return G__8453__delegate(k, x, y, more)
    };
    G__8453.cljs$lang$arity$variadic = G__8453__delegate;
    return G__8453
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__8455__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__8451_SHARP_, p2__8452_SHARP_) {
        return min_key.call(null, k, p1__8451_SHARP_, p2__8452_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__8455 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8455__delegate.call(this, k, x, y, more)
    };
    G__8455.cljs$lang$maxFixedArity = 3;
    G__8455.cljs$lang$applyTo = function(arglist__8456) {
      var k = cljs.core.first(arglist__8456);
      var x = cljs.core.first(cljs.core.next(arglist__8456));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8456)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8456)));
      return G__8455__delegate(k, x, y, more)
    };
    G__8455.cljs$lang$arity$variadic = G__8455__delegate;
    return G__8455
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8457 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8457)) {
        var s__8458 = temp__3698__auto____8457;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__8458), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__8458)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8459 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8459)) {
      var s__8460 = temp__3698__auto____8459;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__8460)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8460), take_while.call(null, pred, cljs.core.rest.call(null, s__8460)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__8461 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__8461.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__8462 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3698__auto____8463 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3698__auto____8463)) {
        var vec__8464__8465 = temp__3698__auto____8463;
        var e__8466 = cljs.core.nth.call(null, vec__8464__8465, 0, null);
        var s__8467 = vec__8464__8465;
        if(cljs.core.truth_(include__8462.call(null, e__8466))) {
          return s__8467
        }else {
          return cljs.core.next.call(null, s__8467)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__8462, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____8468 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3698__auto____8468)) {
      var vec__8469__8470 = temp__3698__auto____8468;
      var e__8471 = cljs.core.nth.call(null, vec__8469__8470, 0, null);
      var s__8472 = vec__8469__8470;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__8471)) ? s__8472 : cljs.core.next.call(null, s__8472))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__8473 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3698__auto____8474 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3698__auto____8474)) {
        var vec__8475__8476 = temp__3698__auto____8474;
        var e__8477 = cljs.core.nth.call(null, vec__8475__8476, 0, null);
        var s__8478 = vec__8475__8476;
        if(cljs.core.truth_(include__8473.call(null, e__8477))) {
          return s__8478
        }else {
          return cljs.core.next.call(null, s__8478)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__8473, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3698__auto____8479 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3698__auto____8479)) {
      var vec__8480__8481 = temp__3698__auto____8479;
      var e__8482 = cljs.core.nth.call(null, vec__8480__8481, 0, null);
      var s__8483 = vec__8480__8481;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__8482)) ? s__8483 : cljs.core.next.call(null, s__8483))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__8484 = this;
  var h__364__auto____8485 = this__8484.__hash;
  if(h__364__auto____8485 != null) {
    return h__364__auto____8485
  }else {
    var h__364__auto____8486 = cljs.core.hash_coll.call(null, rng);
    this__8484.__hash = h__364__auto____8486;
    return h__364__auto____8486
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__8487 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__8488 = this;
  var this$__8489 = this;
  return cljs.core.pr_str.call(null, this$__8489)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__8490 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__8491 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__8492 = this;
  var comp__8493 = this__8492.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__8493.call(null, this__8492.start, this__8492.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__8494 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__8494.end - this__8494.start) / this__8494.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__8495 = this;
  return this__8495.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__8496 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__8496.meta, this__8496.start + this__8496.step, this__8496.end, this__8496.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__8497 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__8498 = this;
  return new cljs.core.Range(meta, this__8498.start, this__8498.end, this__8498.step, this__8498.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__8499 = this;
  return this__8499.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__8500 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__8500.start + n * this__8500.step
  }else {
    if(function() {
      var and__3546__auto____8501 = this__8500.start > this__8500.end;
      if(and__3546__auto____8501) {
        return this__8500.step === 0
      }else {
        return and__3546__auto____8501
      }
    }()) {
      return this__8500.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__8502 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__8502.start + n * this__8502.step
  }else {
    if(function() {
      var and__3546__auto____8503 = this__8502.start > this__8502.end;
      if(and__3546__auto____8503) {
        return this__8502.step === 0
      }else {
        return and__3546__auto____8503
      }
    }()) {
      return this__8502.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__8504 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8504.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8505 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8505)) {
      var s__8506 = temp__3698__auto____8505;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__8506), take_nth.call(null, n, cljs.core.drop.call(null, n, s__8506)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3698__auto____8508 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3698__auto____8508)) {
      var s__8509 = temp__3698__auto____8508;
      var fst__8510 = cljs.core.first.call(null, s__8509);
      var fv__8511 = f.call(null, fst__8510);
      var run__8512 = cljs.core.cons.call(null, fst__8510, cljs.core.take_while.call(null, function(p1__8507_SHARP_) {
        return cljs.core._EQ_.call(null, fv__8511, f.call(null, p1__8507_SHARP_))
      }, cljs.core.next.call(null, s__8509)));
      return cljs.core.cons.call(null, run__8512, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__8512), s__8509))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3695__auto____8523 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3695__auto____8523)) {
        var s__8524 = temp__3695__auto____8523;
        return reductions.call(null, f, cljs.core.first.call(null, s__8524), cljs.core.rest.call(null, s__8524))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3698__auto____8525 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3698__auto____8525)) {
        var s__8526 = temp__3698__auto____8525;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__8526)), cljs.core.rest.call(null, s__8526))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__8528 = null;
      var G__8528__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__8528__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__8528__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__8528__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__8528__4 = function() {
        var G__8529__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__8529 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8529__delegate.call(this, x, y, z, args)
        };
        G__8529.cljs$lang$maxFixedArity = 3;
        G__8529.cljs$lang$applyTo = function(arglist__8530) {
          var x = cljs.core.first(arglist__8530);
          var y = cljs.core.first(cljs.core.next(arglist__8530));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8530)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8530)));
          return G__8529__delegate(x, y, z, args)
        };
        G__8529.cljs$lang$arity$variadic = G__8529__delegate;
        return G__8529
      }();
      G__8528 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8528__0.call(this);
          case 1:
            return G__8528__1.call(this, x);
          case 2:
            return G__8528__2.call(this, x, y);
          case 3:
            return G__8528__3.call(this, x, y, z);
          default:
            return G__8528__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8528.cljs$lang$maxFixedArity = 3;
      G__8528.cljs$lang$applyTo = G__8528__4.cljs$lang$applyTo;
      return G__8528
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__8531 = null;
      var G__8531__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__8531__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__8531__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__8531__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__8531__4 = function() {
        var G__8532__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__8532 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8532__delegate.call(this, x, y, z, args)
        };
        G__8532.cljs$lang$maxFixedArity = 3;
        G__8532.cljs$lang$applyTo = function(arglist__8533) {
          var x = cljs.core.first(arglist__8533);
          var y = cljs.core.first(cljs.core.next(arglist__8533));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8533)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8533)));
          return G__8532__delegate(x, y, z, args)
        };
        G__8532.cljs$lang$arity$variadic = G__8532__delegate;
        return G__8532
      }();
      G__8531 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8531__0.call(this);
          case 1:
            return G__8531__1.call(this, x);
          case 2:
            return G__8531__2.call(this, x, y);
          case 3:
            return G__8531__3.call(this, x, y, z);
          default:
            return G__8531__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8531.cljs$lang$maxFixedArity = 3;
      G__8531.cljs$lang$applyTo = G__8531__4.cljs$lang$applyTo;
      return G__8531
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__8534 = null;
      var G__8534__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__8534__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__8534__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__8534__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__8534__4 = function() {
        var G__8535__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__8535 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__8535__delegate.call(this, x, y, z, args)
        };
        G__8535.cljs$lang$maxFixedArity = 3;
        G__8535.cljs$lang$applyTo = function(arglist__8536) {
          var x = cljs.core.first(arglist__8536);
          var y = cljs.core.first(cljs.core.next(arglist__8536));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8536)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8536)));
          return G__8535__delegate(x, y, z, args)
        };
        G__8535.cljs$lang$arity$variadic = G__8535__delegate;
        return G__8535
      }();
      G__8534 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__8534__0.call(this);
          case 1:
            return G__8534__1.call(this, x);
          case 2:
            return G__8534__2.call(this, x, y);
          case 3:
            return G__8534__3.call(this, x, y, z);
          default:
            return G__8534__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__8534.cljs$lang$maxFixedArity = 3;
      G__8534.cljs$lang$applyTo = G__8534__4.cljs$lang$applyTo;
      return G__8534
    }()
  };
  var juxt__4 = function() {
    var G__8537__delegate = function(f, g, h, fs) {
      var fs__8527 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__8538 = null;
        var G__8538__0 = function() {
          return cljs.core.reduce.call(null, function(p1__8513_SHARP_, p2__8514_SHARP_) {
            return cljs.core.conj.call(null, p1__8513_SHARP_, p2__8514_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__8527)
        };
        var G__8538__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__8515_SHARP_, p2__8516_SHARP_) {
            return cljs.core.conj.call(null, p1__8515_SHARP_, p2__8516_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__8527)
        };
        var G__8538__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__8517_SHARP_, p2__8518_SHARP_) {
            return cljs.core.conj.call(null, p1__8517_SHARP_, p2__8518_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__8527)
        };
        var G__8538__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__8519_SHARP_, p2__8520_SHARP_) {
            return cljs.core.conj.call(null, p1__8519_SHARP_, p2__8520_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__8527)
        };
        var G__8538__4 = function() {
          var G__8539__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__8521_SHARP_, p2__8522_SHARP_) {
              return cljs.core.conj.call(null, p1__8521_SHARP_, cljs.core.apply.call(null, p2__8522_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__8527)
          };
          var G__8539 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__8539__delegate.call(this, x, y, z, args)
          };
          G__8539.cljs$lang$maxFixedArity = 3;
          G__8539.cljs$lang$applyTo = function(arglist__8540) {
            var x = cljs.core.first(arglist__8540);
            var y = cljs.core.first(cljs.core.next(arglist__8540));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8540)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8540)));
            return G__8539__delegate(x, y, z, args)
          };
          G__8539.cljs$lang$arity$variadic = G__8539__delegate;
          return G__8539
        }();
        G__8538 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__8538__0.call(this);
            case 1:
              return G__8538__1.call(this, x);
            case 2:
              return G__8538__2.call(this, x, y);
            case 3:
              return G__8538__3.call(this, x, y, z);
            default:
              return G__8538__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__8538.cljs$lang$maxFixedArity = 3;
        G__8538.cljs$lang$applyTo = G__8538__4.cljs$lang$applyTo;
        return G__8538
      }()
    };
    var G__8537 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__8537__delegate.call(this, f, g, h, fs)
    };
    G__8537.cljs$lang$maxFixedArity = 3;
    G__8537.cljs$lang$applyTo = function(arglist__8541) {
      var f = cljs.core.first(arglist__8541);
      var g = cljs.core.first(cljs.core.next(arglist__8541));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8541)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8541)));
      return G__8537__delegate(f, g, h, fs)
    };
    G__8537.cljs$lang$arity$variadic = G__8537__delegate;
    return G__8537
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__8543 = cljs.core.next.call(null, coll);
        coll = G__8543;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3546__auto____8542 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3546__auto____8542)) {
          return n > 0
        }else {
          return and__3546__auto____8542
        }
      }())) {
        var G__8544 = n - 1;
        var G__8545 = cljs.core.next.call(null, coll);
        n = G__8544;
        coll = G__8545;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__8546 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__8546), s)) {
    if(cljs.core.count.call(null, matches__8546) === 1) {
      return cljs.core.first.call(null, matches__8546)
    }else {
      return cljs.core.vec.call(null, matches__8546)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__8547 = re.exec(s);
  if(matches__8547 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__8547) === 1) {
      return cljs.core.first.call(null, matches__8547)
    }else {
      return cljs.core.vec.call(null, matches__8547)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__8548 = cljs.core.re_find.call(null, re, s);
  var match_idx__8549 = s.search(re);
  var match_str__8550 = cljs.core.coll_QMARK_.call(null, match_data__8548) ? cljs.core.first.call(null, match_data__8548) : match_data__8548;
  var post_match__8551 = cljs.core.subs.call(null, s, match_idx__8549 + cljs.core.count.call(null, match_str__8550));
  if(cljs.core.truth_(match_data__8548)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__8548, re_seq.call(null, re, post_match__8551))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__8553__8554 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___8555 = cljs.core.nth.call(null, vec__8553__8554, 0, null);
  var flags__8556 = cljs.core.nth.call(null, vec__8553__8554, 1, null);
  var pattern__8557 = cljs.core.nth.call(null, vec__8553__8554, 2, null);
  return new RegExp(pattern__8557, flags__8556)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__8552_SHARP_) {
    return print_one.call(null, p1__8552_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3546__auto____8558 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3546__auto____8558)) {
            var and__3546__auto____8562 = function() {
              var G__8559__8560 = obj;
              if(G__8559__8560 != null) {
                if(function() {
                  var or__3548__auto____8561 = G__8559__8560.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3548__auto____8561) {
                    return or__3548__auto____8561
                  }else {
                    return G__8559__8560.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__8559__8560.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8559__8560)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__8559__8560)
              }
            }();
            if(cljs.core.truth_(and__3546__auto____8562)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3546__auto____8562
            }
          }else {
            return and__3546__auto____8558
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3546__auto____8563 = obj != null;
          if(and__3546__auto____8563) {
            return obj.cljs$lang$type
          }else {
            return and__3546__auto____8563
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__8564__8565 = obj;
          if(G__8564__8565 != null) {
            if(function() {
              var or__3548__auto____8566 = G__8564__8565.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3548__auto____8566) {
                return or__3548__auto____8566
              }else {
                return G__8564__8565.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__8564__8565.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__8564__8565)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__8564__8565)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__8567 = cljs.core.first.call(null, objs);
  var sb__8568 = new goog.string.StringBuffer;
  var G__8569__8570 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__8569__8570)) {
    var obj__8571 = cljs.core.first.call(null, G__8569__8570);
    var G__8569__8572 = G__8569__8570;
    while(true) {
      if(obj__8571 === first_obj__8567) {
      }else {
        sb__8568.append(" ")
      }
      var G__8573__8574 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8571, opts));
      if(cljs.core.truth_(G__8573__8574)) {
        var string__8575 = cljs.core.first.call(null, G__8573__8574);
        var G__8573__8576 = G__8573__8574;
        while(true) {
          sb__8568.append(string__8575);
          var temp__3698__auto____8577 = cljs.core.next.call(null, G__8573__8576);
          if(cljs.core.truth_(temp__3698__auto____8577)) {
            var G__8573__8578 = temp__3698__auto____8577;
            var G__8581 = cljs.core.first.call(null, G__8573__8578);
            var G__8582 = G__8573__8578;
            string__8575 = G__8581;
            G__8573__8576 = G__8582;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____8579 = cljs.core.next.call(null, G__8569__8572);
      if(cljs.core.truth_(temp__3698__auto____8579)) {
        var G__8569__8580 = temp__3698__auto____8579;
        var G__8583 = cljs.core.first.call(null, G__8569__8580);
        var G__8584 = G__8569__8580;
        obj__8571 = G__8583;
        G__8569__8572 = G__8584;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__8568
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__8585 = cljs.core.pr_sb.call(null, objs, opts);
  sb__8585.append("\n");
  return[cljs.core.str(sb__8585)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__8586 = cljs.core.first.call(null, objs);
  var G__8587__8588 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__8587__8588)) {
    var obj__8589 = cljs.core.first.call(null, G__8587__8588);
    var G__8587__8590 = G__8587__8588;
    while(true) {
      if(obj__8589 === first_obj__8586) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__8591__8592 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__8589, opts));
      if(cljs.core.truth_(G__8591__8592)) {
        var string__8593 = cljs.core.first.call(null, G__8591__8592);
        var G__8591__8594 = G__8591__8592;
        while(true) {
          cljs.core.string_print.call(null, string__8593);
          var temp__3698__auto____8595 = cljs.core.next.call(null, G__8591__8594);
          if(cljs.core.truth_(temp__3698__auto____8595)) {
            var G__8591__8596 = temp__3698__auto____8595;
            var G__8599 = cljs.core.first.call(null, G__8591__8596);
            var G__8600 = G__8591__8596;
            string__8593 = G__8599;
            G__8591__8594 = G__8600;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3698__auto____8597 = cljs.core.next.call(null, G__8587__8590);
      if(cljs.core.truth_(temp__3698__auto____8597)) {
        var G__8587__8598 = temp__3698__auto____8597;
        var G__8601 = cljs.core.first.call(null, G__8587__8598);
        var G__8602 = G__8587__8598;
        obj__8589 = G__8601;
        G__8587__8590 = G__8602;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__8603) {
    var objs = cljs.core.seq(arglist__8603);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__8604) {
    var objs = cljs.core.seq(arglist__8604);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__8605) {
    var objs = cljs.core.seq(arglist__8605);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__8606) {
    var objs = cljs.core.seq(arglist__8606);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__8607) {
    var objs = cljs.core.seq(arglist__8607);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__8608) {
    var objs = cljs.core.seq(arglist__8608);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__8609) {
    var objs = cljs.core.seq(arglist__8609);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__8610) {
    var objs = cljs.core.seq(arglist__8610);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8611 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8611, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8612 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8612, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8613 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8613, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3698__auto____8614 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3698__auto____8614)) {
        var nspc__8615 = temp__3698__auto____8614;
        return[cljs.core.str(nspc__8615), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3698__auto____8616 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3698__auto____8616)) {
          var nspc__8617 = temp__3698__auto____8616;
          return[cljs.core.str(nspc__8617), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8618 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8618, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__8619 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__8619, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__8620 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__8621 = this;
  var G__8622__8623 = cljs.core.seq.call(null, this__8621.watches);
  if(cljs.core.truth_(G__8622__8623)) {
    var G__8625__8627 = cljs.core.first.call(null, G__8622__8623);
    var vec__8626__8628 = G__8625__8627;
    var key__8629 = cljs.core.nth.call(null, vec__8626__8628, 0, null);
    var f__8630 = cljs.core.nth.call(null, vec__8626__8628, 1, null);
    var G__8622__8631 = G__8622__8623;
    var G__8625__8632 = G__8625__8627;
    var G__8622__8633 = G__8622__8631;
    while(true) {
      var vec__8634__8635 = G__8625__8632;
      var key__8636 = cljs.core.nth.call(null, vec__8634__8635, 0, null);
      var f__8637 = cljs.core.nth.call(null, vec__8634__8635, 1, null);
      var G__8622__8638 = G__8622__8633;
      f__8637.call(null, key__8636, this$, oldval, newval);
      var temp__3698__auto____8639 = cljs.core.next.call(null, G__8622__8638);
      if(cljs.core.truth_(temp__3698__auto____8639)) {
        var G__8622__8640 = temp__3698__auto____8639;
        var G__8647 = cljs.core.first.call(null, G__8622__8640);
        var G__8648 = G__8622__8640;
        G__8625__8632 = G__8647;
        G__8622__8633 = G__8648;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__8641 = this;
  return this$.watches = cljs.core.assoc.call(null, this__8641.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__8642 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__8642.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__8643 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__8643.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__8644 = this;
  return this__8644.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__8645 = this;
  return this__8645.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8646 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__8655__delegate = function(x, p__8649) {
      var map__8650__8651 = p__8649;
      var map__8650__8652 = cljs.core.seq_QMARK_.call(null, map__8650__8651) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8650__8651) : map__8650__8651;
      var validator__8653 = cljs.core.get.call(null, map__8650__8652, "\ufdd0'validator");
      var meta__8654 = cljs.core.get.call(null, map__8650__8652, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__8654, validator__8653, null)
    };
    var G__8655 = function(x, var_args) {
      var p__8649 = null;
      if(goog.isDef(var_args)) {
        p__8649 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8655__delegate.call(this, x, p__8649)
    };
    G__8655.cljs$lang$maxFixedArity = 1;
    G__8655.cljs$lang$applyTo = function(arglist__8656) {
      var x = cljs.core.first(arglist__8656);
      var p__8649 = cljs.core.rest(arglist__8656);
      return G__8655__delegate(x, p__8649)
    };
    G__8655.cljs$lang$arity$variadic = G__8655__delegate;
    return G__8655
  }();
  atom = function(x, var_args) {
    var p__8649 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3698__auto____8657 = a.validator;
  if(cljs.core.truth_(temp__3698__auto____8657)) {
    var validate__8658 = temp__3698__auto____8657;
    if(cljs.core.truth_(validate__8658.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__8659 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__8659, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__8660__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__8660 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__8660__delegate.call(this, a, f, x, y, z, more)
    };
    G__8660.cljs$lang$maxFixedArity = 5;
    G__8660.cljs$lang$applyTo = function(arglist__8661) {
      var a = cljs.core.first(arglist__8661);
      var f = cljs.core.first(cljs.core.next(arglist__8661));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8661)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8661))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8661)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8661)))));
      return G__8660__delegate(a, f, x, y, z, more)
    };
    G__8660.cljs$lang$arity$variadic = G__8660__delegate;
    return G__8660
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__8662) {
    var iref = cljs.core.first(arglist__8662);
    var f = cljs.core.first(cljs.core.next(arglist__8662));
    var args = cljs.core.rest(cljs.core.next(arglist__8662));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__8663 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__8663.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__8664 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__8664.state, function(p__8665) {
    var curr_state__8666 = p__8665;
    var curr_state__8667 = cljs.core.seq_QMARK_.call(null, curr_state__8666) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__8666) : curr_state__8666;
    var done__8668 = cljs.core.get.call(null, curr_state__8667, "\ufdd0'done");
    if(cljs.core.truth_(done__8668)) {
      return curr_state__8667
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__8664.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__8669__8670 = options;
    var map__8669__8671 = cljs.core.seq_QMARK_.call(null, map__8669__8670) ? cljs.core.apply.call(null, cljs.core.hash_map, map__8669__8670) : map__8669__8670;
    var keywordize_keys__8672 = cljs.core.get.call(null, map__8669__8671, "\ufdd0'keywordize-keys");
    var keyfn__8673 = cljs.core.truth_(keywordize_keys__8672) ? cljs.core.keyword : cljs.core.str;
    var f__8679 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____8678 = function iter__8674(s__8675) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__8675__8676 = s__8675;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__8675__8676))) {
                        var k__8677 = cljs.core.first.call(null, s__8675__8676);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__8673.call(null, k__8677), thisfn.call(null, x[k__8677])]), iter__8674.call(null, cljs.core.rest.call(null, s__8675__8676)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____8678.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__8679.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__8680) {
    var x = cljs.core.first(arglist__8680);
    var options = cljs.core.rest(arglist__8680);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__8681 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__8685__delegate = function(args) {
      var temp__3695__auto____8682 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__8681), args);
      if(cljs.core.truth_(temp__3695__auto____8682)) {
        var v__8683 = temp__3695__auto____8682;
        return v__8683
      }else {
        var ret__8684 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__8681, cljs.core.assoc, args, ret__8684);
        return ret__8684
      }
    };
    var G__8685 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__8685__delegate.call(this, args)
    };
    G__8685.cljs$lang$maxFixedArity = 0;
    G__8685.cljs$lang$applyTo = function(arglist__8686) {
      var args = cljs.core.seq(arglist__8686);
      return G__8685__delegate(args)
    };
    G__8685.cljs$lang$arity$variadic = G__8685__delegate;
    return G__8685
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__8687 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__8687)) {
        var G__8688 = ret__8687;
        f = G__8688;
        continue
      }else {
        return ret__8687
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__8689__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__8689 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__8689__delegate.call(this, f, args)
    };
    G__8689.cljs$lang$maxFixedArity = 1;
    G__8689.cljs$lang$applyTo = function(arglist__8690) {
      var f = cljs.core.first(arglist__8690);
      var args = cljs.core.rest(arglist__8690);
      return G__8689__delegate(f, args)
    };
    G__8689.cljs$lang$arity$variadic = G__8689__delegate;
    return G__8689
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__8691 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__8691, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__8691, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3548__auto____8692 = cljs.core._EQ_.call(null, child, parent);
    if(or__3548__auto____8692) {
      return or__3548__auto____8692
    }else {
      var or__3548__auto____8693 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3548__auto____8693) {
        return or__3548__auto____8693
      }else {
        var and__3546__auto____8694 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3546__auto____8694) {
          var and__3546__auto____8695 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3546__auto____8695) {
            var and__3546__auto____8696 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3546__auto____8696) {
              var ret__8697 = true;
              var i__8698 = 0;
              while(true) {
                if(function() {
                  var or__3548__auto____8699 = cljs.core.not.call(null, ret__8697);
                  if(or__3548__auto____8699) {
                    return or__3548__auto____8699
                  }else {
                    return i__8698 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__8697
                }else {
                  var G__8700 = isa_QMARK_.call(null, h, child.call(null, i__8698), parent.call(null, i__8698));
                  var G__8701 = i__8698 + 1;
                  ret__8697 = G__8700;
                  i__8698 = G__8701;
                  continue
                }
                break
              }
            }else {
              return and__3546__auto____8696
            }
          }else {
            return and__3546__auto____8695
          }
        }else {
          return and__3546__auto____8694
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__8705 = "\ufdd0'parents".call(null, h);
    var td__8706 = "\ufdd0'descendants".call(null, h);
    var ta__8707 = "\ufdd0'ancestors".call(null, h);
    var tf__8708 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3548__auto____8709 = cljs.core.contains_QMARK_.call(null, tp__8705.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__8707.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__8707.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__8705, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__8708.call(null, "\ufdd0'ancestors".call(null, h), tag, td__8706, parent, ta__8707), "\ufdd0'descendants":tf__8708.call(null, "\ufdd0'descendants".call(null, h), parent, ta__8707, tag, td__8706)})
    }();
    if(cljs.core.truth_(or__3548__auto____8709)) {
      return or__3548__auto____8709
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__8710 = "\ufdd0'parents".call(null, h);
    var childsParents__8711 = cljs.core.truth_(parentMap__8710.call(null, tag)) ? cljs.core.disj.call(null, parentMap__8710.call(null, tag), parent) : cljs.core.set([]);
    var newParents__8712 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__8711)) ? cljs.core.assoc.call(null, parentMap__8710, tag, childsParents__8711) : cljs.core.dissoc.call(null, parentMap__8710, tag);
    var deriv_seq__8713 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__8702_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__8702_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__8702_SHARP_), cljs.core.second.call(null, p1__8702_SHARP_)))
    }, cljs.core.seq.call(null, newParents__8712)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__8710.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__8703_SHARP_, p2__8704_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__8703_SHARP_, p2__8704_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__8713))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__8714 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3548__auto____8716 = cljs.core.truth_(function() {
    var and__3546__auto____8715 = xprefs__8714;
    if(cljs.core.truth_(and__3546__auto____8715)) {
      return xprefs__8714.call(null, y)
    }else {
      return and__3546__auto____8715
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3548__auto____8716)) {
    return or__3548__auto____8716
  }else {
    var or__3548__auto____8718 = function() {
      var ps__8717 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__8717) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__8717), prefer_table))) {
          }else {
          }
          var G__8721 = cljs.core.rest.call(null, ps__8717);
          ps__8717 = G__8721;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3548__auto____8718)) {
      return or__3548__auto____8718
    }else {
      var or__3548__auto____8720 = function() {
        var ps__8719 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__8719) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__8719), y, prefer_table))) {
            }else {
            }
            var G__8722 = cljs.core.rest.call(null, ps__8719);
            ps__8719 = G__8722;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3548__auto____8720)) {
        return or__3548__auto____8720
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3548__auto____8723 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3548__auto____8723)) {
    return or__3548__auto____8723
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__8732 = cljs.core.reduce.call(null, function(be, p__8724) {
    var vec__8725__8726 = p__8724;
    var k__8727 = cljs.core.nth.call(null, vec__8725__8726, 0, null);
    var ___8728 = cljs.core.nth.call(null, vec__8725__8726, 1, null);
    var e__8729 = vec__8725__8726;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__8727)) {
      var be2__8731 = cljs.core.truth_(function() {
        var or__3548__auto____8730 = be == null;
        if(or__3548__auto____8730) {
          return or__3548__auto____8730
        }else {
          return cljs.core.dominates.call(null, k__8727, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__8729 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__8731), k__8727, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__8727), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__8731)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__8731
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__8732)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__8732));
      return cljs.core.second.call(null, best_entry__8732)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3546__auto____8733 = mf;
    if(and__3546__auto____8733) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3546__auto____8733
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____8734 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8734) {
        return or__3548__auto____8734
      }else {
        var or__3548__auto____8735 = cljs.core._reset["_"];
        if(or__3548__auto____8735) {
          return or__3548__auto____8735
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3546__auto____8736 = mf;
    if(and__3546__auto____8736) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3546__auto____8736
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3548__auto____8737 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8737) {
        return or__3548__auto____8737
      }else {
        var or__3548__auto____8738 = cljs.core._add_method["_"];
        if(or__3548__auto____8738) {
          return or__3548__auto____8738
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____8739 = mf;
    if(and__3546__auto____8739) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3546__auto____8739
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____8740 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8740) {
        return or__3548__auto____8740
      }else {
        var or__3548__auto____8741 = cljs.core._remove_method["_"];
        if(or__3548__auto____8741) {
          return or__3548__auto____8741
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3546__auto____8742 = mf;
    if(and__3546__auto____8742) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3546__auto____8742
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3548__auto____8743 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8743) {
        return or__3548__auto____8743
      }else {
        var or__3548__auto____8744 = cljs.core._prefer_method["_"];
        if(or__3548__auto____8744) {
          return or__3548__auto____8744
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3546__auto____8745 = mf;
    if(and__3546__auto____8745) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3546__auto____8745
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3548__auto____8746 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8746) {
        return or__3548__auto____8746
      }else {
        var or__3548__auto____8747 = cljs.core._get_method["_"];
        if(or__3548__auto____8747) {
          return or__3548__auto____8747
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3546__auto____8748 = mf;
    if(and__3546__auto____8748) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3546__auto____8748
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____8749 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8749) {
        return or__3548__auto____8749
      }else {
        var or__3548__auto____8750 = cljs.core._methods["_"];
        if(or__3548__auto____8750) {
          return or__3548__auto____8750
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3546__auto____8751 = mf;
    if(and__3546__auto____8751) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3546__auto____8751
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3548__auto____8752 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8752) {
        return or__3548__auto____8752
      }else {
        var or__3548__auto____8753 = cljs.core._prefers["_"];
        if(or__3548__auto____8753) {
          return or__3548__auto____8753
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3546__auto____8754 = mf;
    if(and__3546__auto____8754) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3546__auto____8754
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3548__auto____8755 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3548__auto____8755) {
        return or__3548__auto____8755
      }else {
        var or__3548__auto____8756 = cljs.core._dispatch["_"];
        if(or__3548__auto____8756) {
          return or__3548__auto____8756
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__8757 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__8758 = cljs.core._get_method.call(null, mf, dispatch_val__8757);
  if(cljs.core.truth_(target_fn__8758)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__8757)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__8758, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__8759 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__8760 = this;
  cljs.core.swap_BANG_.call(null, this__8760.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8760.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8760.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__8760.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__8761 = this;
  cljs.core.swap_BANG_.call(null, this__8761.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__8761.method_cache, this__8761.method_table, this__8761.cached_hierarchy, this__8761.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__8762 = this;
  cljs.core.swap_BANG_.call(null, this__8762.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__8762.method_cache, this__8762.method_table, this__8762.cached_hierarchy, this__8762.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__8763 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__8763.cached_hierarchy), cljs.core.deref.call(null, this__8763.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__8763.method_cache, this__8763.method_table, this__8763.cached_hierarchy, this__8763.hierarchy)
  }
  var temp__3695__auto____8764 = cljs.core.deref.call(null, this__8763.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3695__auto____8764)) {
    var target_fn__8765 = temp__3695__auto____8764;
    return target_fn__8765
  }else {
    var temp__3695__auto____8766 = cljs.core.find_and_cache_best_method.call(null, this__8763.name, dispatch_val, this__8763.hierarchy, this__8763.method_table, this__8763.prefer_table, this__8763.method_cache, this__8763.cached_hierarchy);
    if(cljs.core.truth_(temp__3695__auto____8766)) {
      var target_fn__8767 = temp__3695__auto____8766;
      return target_fn__8767
    }else {
      return cljs.core.deref.call(null, this__8763.method_table).call(null, this__8763.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__8768 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__8768.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__8768.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__8768.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__8768.method_cache, this__8768.method_table, this__8768.cached_hierarchy, this__8768.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__8769 = this;
  return cljs.core.deref.call(null, this__8769.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__8770 = this;
  return cljs.core.deref.call(null, this__8770.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__8771 = this;
  return cljs.core.do_dispatch.call(null, mf, this__8771.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__8772__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__8772 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__8772__delegate.call(this, _, args)
  };
  G__8772.cljs$lang$maxFixedArity = 1;
  G__8772.cljs$lang$applyTo = function(arglist__8773) {
    var _ = cljs.core.first(arglist__8773);
    var args = cljs.core.rest(arglist__8773);
    return G__8772__delegate(_, args)
  };
  G__8772.cljs$lang$arity$variadic = G__8772__delegate;
  return G__8772
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("tampere.core");
goog.require("cljs.core");
tampere.core.clj__GT_js = function clj__GT_js(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(cljs.core.keyword_QMARK_.call(null, x)) {
      return cljs.core.name.call(null, x)
    }else {
      if(cljs.core.map_QMARK_.call(null, x)) {
        return cljs.core.reduce.call(null, function(m, p__591794) {
          var vec__591795__591796 = p__591794;
          var k__591797 = cljs.core.nth.call(null, vec__591795__591796, 0, null);
          var v__591798 = cljs.core.nth.call(null, vec__591795__591796, 1, null);
          return cljs.core.assoc.call(null, m, clj__GT_js.call(null, k__591797), clj__GT_js.call(null, v__591798))
        }, cljs.core.ObjMap.fromObject([], {}), x).strobj
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.apply.call(null, cljs.core.array, cljs.core.map.call(null, clj__GT_js, x))
        }else {
          if("\ufdd0'else") {
            return x
          }else {
            return null
          }
        }
      }
    }
  }
};
tampere.core.data = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'asteroids", "\ufdd0'y", "\ufdd0'score", "\ufdd0'x", "\ufdd0'dir", "\ufdd0'bullets", "\ufdd0'dead?", "\ufdd0'nasteroids", "\ufdd0'advance", "\ufdd0'tx", "\ufdd0'level", "\ufdd0'ty"], {"\ufdd0'asteroids":cljs.core.PersistentVector.fromArray([]), "\ufdd0'y":0, "\ufdd0'score":0, "\ufdd0'x":0, "\ufdd0'dir":cljs.core.ObjMap.fromObject(["\ufdd0'dx", "\ufdd0'dy"], {"\ufdd0'dx":1, "\ufdd0'dy":0}), "\ufdd0'bullets":cljs.core.PersistentVector.fromArray([]), 
"\ufdd0'dead?":false, "\ufdd0'nasteroids":0, "\ufdd0'advance":0, "\ufdd0'tx":0, "\ufdd0'level":0, "\ufdd0'ty":0}));
tampere.core.gee = cljs.core.atom.call(null, null);
tampere.core.ctx = cljs.core.atom.call(null, null);
tampere.core.circle = function circle(x, y, rad) {
  cljs.core.deref.call(null, tampere.core.ctx).beginPath();
  cljs.core.deref.call(null, tampere.core.ctx).arc(x, y, rad, rad, 0, 2 * Math.PI, true);
  cljs.core.deref.call(null, tampere.core.ctx).closePath();
  return cljs.core.deref.call(null, tampere.core.ctx).fill()
};
tampere.core.line = function line(x1, y1, x2, y2) {
  cljs.core.deref.call(null, tampere.core.ctx).beginPath();
  cljs.core.deref.call(null, tampere.core.ctx).moveTo(x1, y1);
  cljs.core.deref.call(null, tampere.core.ctx).lineTo(x2, y2);
  cljs.core.deref.call(null, tampere.core.ctx).closePath();
  return cljs.core.deref.call(null, tampere.core.ctx).stroke()
};
tampere.core.on_screen_QMARK_ = function on_screen_QMARK_(p__591799) {
  var map__591800__591801 = p__591799;
  var map__591800__591802 = cljs.core.seq_QMARK_.call(null, map__591800__591801) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591800__591801) : map__591800__591801;
  var x__591803 = cljs.core.get.call(null, map__591800__591802, "\ufdd0'x");
  var y__591804 = cljs.core.get.call(null, map__591800__591802, "\ufdd0'y");
  var width__591805 = cljs.core.deref.call(null, tampere.core.gee).width;
  var height__591806 = cljs.core.deref.call(null, tampere.core.gee).height;
  var and__3546__auto____591807 = 0 < x__591803 + 1;
  if(and__3546__auto____591807) {
    var and__3546__auto____591808 = x__591803 < width__591805 + 1;
    if(and__3546__auto____591808) {
      var and__3546__auto____591809 = 0 < y__591804 + 1;
      if(and__3546__auto____591809) {
        return y__591804 < height__591806 + 1
      }else {
        return and__3546__auto____591809
      }
    }else {
      return and__3546__auto____591808
    }
  }else {
    return and__3546__auto____591807
  }
};
tampere.core.generate_asteroid = function generate_asteroid() {
  var width__591811 = cljs.core.deref.call(null, tampere.core.gee).width;
  var height__591812 = cljs.core.deref.call(null, tampere.core.gee).height;
  var r__591813 = cljs.core.rand_int.call(null, 4);
  var r2__591814 = cljs.core.rand.call(null, 180);
  var speed__591815 = 5 + cljs.core.rand.call(null, 5) + cljs.core.rand.call(null, 10) + cljs.core.rand.call(null, 20);
  var vec__591810__591816 = 3 === r__591813 ? cljs.core.PersistentVector.fromArray([5, cljs.core.rand.call(null, height__591812), 260 + r2__591814]) : 2 === r__591813 ? cljs.core.PersistentVector.fromArray([cljs.core.rand.call(null, width__591811), height__591812 - 5, -r2__591814]) : 1 === r__591813 ? cljs.core.PersistentVector.fromArray([width__591811 - 5, cljs.core.rand.call(null, height__591812), 90 + r2__591814]) : 0 === r__591813 ? cljs.core.PersistentVector.fromArray([cljs.core.rand.call(null, 
  width__591811), 5, r2__591814]) : "\ufdd0'else" ? function() {
    throw new Error([cljs.core.str("No matching clause: "), cljs.core.str(r__591813)].join(""));
  }() : null;
  var x__591817 = cljs.core.nth.call(null, vec__591810__591816, 0, null);
  var y__591818 = cljs.core.nth.call(null, vec__591810__591816, 1, null);
  var d__591819 = cljs.core.nth.call(null, vec__591810__591816, 2, null);
  var new_asteroid__591820 = cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y", "\ufdd0'dir", "\ufdd0'size", "\ufdd0'life"], {"\ufdd0'x":x__591817, "\ufdd0'y":y__591818, "\ufdd0'dir":cljs.core.ObjMap.fromObject(["\ufdd0'dx", "\ufdd0'dy"], {"\ufdd0'dx":speed__591815 * Math.cos.call(null, Math.PI * (d__591819 / 180)), "\ufdd0'dy":speed__591815 * Math.sin.call(null, Math.PI * (d__591819 / 180))}), "\ufdd0'size":5 + cljs.core.rand_int.call(null, 25) + cljs.core.rand_int.call(null, 10), "\ufdd0'life":1});
  var asteroids__591821 = cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids");
  return cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'asteroids", cljs.core.conj.call(null, asteroids__591821, new_asteroid__591820))
  })
};
tampere.core.start_level = function start_level() {
  var level__591822 = cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'level") + 1;
  return cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'nasteroids", Math.round.call(null, level__591822 * Math.sqrt.call(null, level__591822)), "\ufdd0'advance", 0, "\ufdd0'level", level__591822)
  })
};
tampere.core.move_object = function move_object(object) {
  var map__591823__591825 = object;
  var map__591823__591826 = cljs.core.seq_QMARK_.call(null, map__591823__591825) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591823__591825) : map__591823__591825;
  var x__591827 = cljs.core.get.call(null, map__591823__591826, "\ufdd0'x");
  var y__591828 = cljs.core.get.call(null, map__591823__591826, "\ufdd0'y");
  var map__591824__591829 = cljs.core.get.call(null, map__591823__591826, "\ufdd0'dir");
  var map__591824__591830 = cljs.core.seq_QMARK_.call(null, map__591824__591829) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591824__591829) : map__591824__591829;
  var dx__591831 = cljs.core.get.call(null, map__591824__591830, "\ufdd0'dx");
  var dy__591832 = cljs.core.get.call(null, map__591824__591830, "\ufdd0'dy");
  var life__591833 = cljs.core.get.call(null, map__591823__591826, "\ufdd0'life");
  return cljs.core.assoc.call(null, object, "\ufdd0'x", x__591827 + dx__591831, "\ufdd0'y", y__591828 + dy__591832)
};
tampere.core.alive_QMARK_ = function alive_QMARK_(object) {
  return object.call(null, "\ufdd0'life") > 0
};
tampere.core.decrease_life = function decrease_life(object) {
  return cljs.core.assoc.call(null, object, "\ufdd0'life", object.call(null, "\ufdd0'life") - 1)
};
tampere.core.collide_QMARK_ = function collide_QMARK_(object1, object2) {
  var map__591834__591836 = object1;
  var map__591834__591837 = cljs.core.seq_QMARK_.call(null, map__591834__591836) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591834__591836) : map__591834__591836;
  var x1__591838 = cljs.core.get.call(null, map__591834__591837, "\ufdd0'x");
  var y1__591839 = cljs.core.get.call(null, map__591834__591837, "\ufdd0'y");
  var size1__591840 = cljs.core.get.call(null, map__591834__591837, "\ufdd0'size");
  var map__591835__591841 = object2;
  var map__591835__591842 = cljs.core.seq_QMARK_.call(null, map__591835__591841) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591835__591841) : map__591835__591841;
  var x2__591843 = cljs.core.get.call(null, map__591835__591842, "\ufdd0'x");
  var y2__591844 = cljs.core.get.call(null, map__591835__591842, "\ufdd0'y");
  var size2__591845 = cljs.core.get.call(null, map__591835__591842, "\ufdd0'size");
  var dx__591846 = x1__591838 - x2__591843;
  var dy__591847 = y1__591839 - y2__591844;
  return dx__591846 * dx__591846 + dy__591847 * dy__591847 < size1__591840 * size1__591840 + size2__591845 * size2__591845
};
tampere.core.simulate = function simulate() {
  var map__591848__591849 = cljs.core.deref.call(null, tampere.core.data);
  var map__591848__591850 = cljs.core.seq_QMARK_.call(null, map__591848__591849) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591848__591849) : map__591848__591849;
  var x__591851 = cljs.core.get.call(null, map__591848__591850, "\ufdd0'x");
  var y__591852 = cljs.core.get.call(null, map__591848__591850, "\ufdd0'y");
  var tx__591853 = cljs.core.get.call(null, map__591848__591850, "\ufdd0'tx");
  var ty__591854 = cljs.core.get.call(null, map__591848__591850, "\ufdd0'ty");
  var dx__591855 = tx__591853 - x__591851;
  var dy__591856 = ty__591854 - y__591852;
  var len__591857 = Math.sqrt.call(null, dx__591855 * dx__591855 + dy__591856 * dy__591856);
  var speed__591858 = 0.1;
  if(len__591857 > 0) {
    cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
      return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'x", x__591851 + dx__591855 * speed__591858, "\ufdd0'y", y__591852 + dy__591856 * speed__591858, "\ufdd0'dir", cljs.core.ObjMap.fromObject(["\ufdd0'dx", "\ufdd0'dy"], {"\ufdd0'dx":dx__591855 / len__591857, "\ufdd0'dy":dy__591856 / len__591857}))
    })
  }else {
  }
  if(cljs.core.truth_(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'shooting?"))) {
    cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
      return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'bullets", cljs.core.concat.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'bullets"), function() {
        var nbullets__591859 = 2 * Math.round.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'level") / 3) + 1;
        var iter__625__auto____591874 = function iter__591860(s__591861) {
          return new cljs.core.LazySeq(null, false, function() {
            var s__591861__591862 = s__591861;
            while(true) {
              if(cljs.core.truth_(cljs.core.seq.call(null, s__591861__591862))) {
                var b__591863 = cljs.core.first.call(null, s__591861__591862);
                return cljs.core.cons.call(null, function() {
                  var x__591865 = cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'x");
                  var y__591866 = cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'y");
                  var bspeed__591867 = 80;
                  var map__591864__591868 = cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'dir");
                  var map__591864__591869 = cljs.core.seq_QMARK_.call(null, map__591864__591868) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591864__591868) : map__591864__591868;
                  var dx__591870 = cljs.core.get.call(null, map__591864__591869, "\ufdd0'dx");
                  var dy__591871 = cljs.core.get.call(null, map__591864__591869, "\ufdd0'dy");
                  var a__591872 = Math.PI / 2 + -Math.atan2.call(null, dx__591870, dy__591871) + (cljs.core._EQ_.call(null, b__591863, 0) ? 0 : Math.floor.call(null, (b__591863 - 1) / 2) * (2 * (b__591863 % 2) - 1) * 0.12);
                  var dir__591873 = cljs.core.ObjMap.fromObject(["\ufdd0'dx", "\ufdd0'dy"], {"\ufdd0'dx":bspeed__591867 * Math.cos.call(null, a__591872), "\ufdd0'dy":bspeed__591867 * Math.sin.call(null, a__591872)});
                  return cljs.core.ObjMap.fromObject(["\ufdd0'x", "\ufdd0'y", "\ufdd0'dir", "\ufdd0'life", "\ufdd0'size"], {"\ufdd0'x":x__591865, "\ufdd0'y":y__591866, "\ufdd0'dir":dir__591873, "\ufdd0'life":20, "\ufdd0'size":1})
                }(), iter__591860.call(null, cljs.core.rest.call(null, s__591861__591862)))
              }else {
                return null
              }
              break
            }
          })
        };
        return iter__625__auto____591874.call(null, cljs.core.range.call(null, nbullets__591859))
      }()))
    })
  }else {
  }
  cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'asteroids", cljs.core.filter.call(null, tampere.core.on_screen_QMARK_, function() {
      var iter__625__auto____591879 = function iter__591875(s__591876) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__591876__591877 = s__591876;
          while(true) {
            if(cljs.core.truth_(cljs.core.seq.call(null, s__591876__591877))) {
              var asteroid__591878 = cljs.core.first.call(null, s__591876__591877);
              return cljs.core.cons.call(null, tampere.core.move_object.call(null, asteroid__591878), iter__591875.call(null, cljs.core.rest.call(null, s__591876__591877)))
            }else {
              return null
            }
            break
          }
        })
      };
      return iter__625__auto____591879.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids"))
    }()))
  });
  cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'bullets", cljs.core.filter.call(null, tampere.core.alive_QMARK_, function() {
      var iter__625__auto____591884 = function iter__591880(s__591881) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__591881__591882 = s__591881;
          while(true) {
            if(cljs.core.truth_(cljs.core.seq.call(null, s__591881__591882))) {
              var bullet__591883 = cljs.core.first.call(null, s__591881__591882);
              return cljs.core.cons.call(null, tampere.core.decrease_life.call(null, tampere.core.move_object.call(null, bullet__591883)), iter__591880.call(null, cljs.core.rest.call(null, s__591881__591882)))
            }else {
              return null
            }
            break
          }
        })
      };
      return iter__625__auto____591884.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'bullets"))
    }()))
  });
  var n1__591885 = cljs.core.count.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids"));
  cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'asteroids", cljs.core.filter.call(null, tampere.core.alive_QMARK_, function() {
      var iter__625__auto____591890 = function iter__591886(s__591887) {
        return new cljs.core.LazySeq(null, false, function() {
          var s__591887__591888 = s__591887;
          while(true) {
            if(cljs.core.truth_(cljs.core.seq.call(null, s__591887__591888))) {
              var asteroid__591889 = cljs.core.first.call(null, s__591887__591888);
              return cljs.core.cons.call(null, cljs.core.empty_QMARK_.call(null, cljs.core.filter.call(null, cljs.core.partial.call(null, tampere.core.collide_QMARK_, asteroid__591889), cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'bullets"))) ? asteroid__591889 : cljs.core.assoc.call(null, asteroid__591889, "\ufdd0'life", asteroid__591889.call(null, "\ufdd0'life") - 1), iter__591886.call(null, cljs.core.rest.call(null, s__591887__591888)))
            }else {
              return null
            }
            break
          }
        })
      };
      return iter__625__auto____591890.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids"))
    }()))
  });
  var killed__591891 = n1__591885 - cljs.core.count.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids"));
  cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'advance", cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'advance") + killed__591891, "\ufdd0'score", cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'score") + cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'level") * killed__591891)
  });
  if(cljs.core.empty_QMARK_.call(null, cljs.core.filter.call(null, cljs.core.partial.call(null, tampere.core.collide_QMARK_, cljs.core.deref.call(null, tampere.core.data)), cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids")))) {
  }else {
    cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
      return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'dead?", true)
    })
  }
  if(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'advance") >= cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'nasteroids")) {
    tampere.core.start_level.call(null)
  }else {
  }
  if(cljs.core.count.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids")) < cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'nasteroids")) {
    return tampere.core.generate_asteroid.call(null)
  }else {
    return null
  }
};
tampere.core.draw = function draw() {
  if(cljs.core.truth_(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'dead?"))) {
  }else {
    tampere.core.simulate.call(null)
  }
  var width__591892 = cljs.core.deref.call(null, tampere.core.gee).width;
  var height__591893 = cljs.core.deref.call(null, tampere.core.gee).height;
  cljs.core.deref.call(null, tampere.core.ctx).fillStyle = "rgb(0, 0, 0)";
  cljs.core.deref.call(null, tampere.core.ctx).fillRect(0, 0, width__591892, height__591893);
  cljs.core.deref.call(null, tampere.core.ctx).fillStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, tampere.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.2)";
  if(cljs.core.truth_(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'dead?"))) {
  }else {
    tampere.core.line.call(null, "\ufdd0'x".call(null, cljs.core.deref.call(null, tampere.core.data)), "\ufdd0'y".call(null, cljs.core.deref.call(null, tampere.core.data)), "\ufdd0'tx".call(null, cljs.core.deref.call(null, tampere.core.data)), "\ufdd0'ty".call(null, cljs.core.deref.call(null, tampere.core.data)))
  }
  tampere.core.circle.call(null, "\ufdd0'x".call(null, cljs.core.deref.call(null, tampere.core.data)), "\ufdd0'y".call(null, cljs.core.deref.call(null, tampere.core.data)), 20);
  cljs.core.deref.call(null, tampere.core.ctx).fillStyle = "rgb(255, 255, 255)";
  cljs.core.deref.call(null, tampere.core.ctx).font = "bold 30px sans-serif";
  cljs.core.deref.call(null, tampere.core.ctx).textAlign = "left";
  cljs.core.deref.call(null, tampere.core.ctx).textBaseline = "middle";
  cljs.core.deref.call(null, tampere.core.ctx).font = "20pt Courier New";
  cljs.core.deref.call(null, tampere.core.ctx).fillText([cljs.core.str("fps "), cljs.core.str(Math.round.call(null, cljs.core.deref.call(null, tampere.core.gee).frameRate))].join(""), 50, 40);
  cljs.core.deref.call(null, tampere.core.ctx).fillText([cljs.core.str("level "), cljs.core.str(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'level")), cljs.core.str("("), cljs.core.str(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'nasteroids") - cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'advance")), cljs.core.str(")")].join(""), 50, 80);
  cljs.core.deref.call(null, tampere.core.ctx).fillText([cljs.core.str("score "), cljs.core.str(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'score"))].join(""), 50, 120);
  if(cljs.core.truth_(cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'dead?"))) {
    cljs.core.deref.call(null, tampere.core.ctx).textAlign = "center";
    cljs.core.deref.call(null, tampere.core.ctx).font = "60pt Courier New";
    cljs.core.deref.call(null, tampere.core.ctx).fillText([cljs.core.str("G A M E  O V E R")].join(""), width__591892 / 2, height__591893 / 2)
  }else {
  }
  cljs.core.dorun.call(null, function() {
    var iter__625__auto____591908 = function iter__591894(s__591895) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__591895__591896 = s__591895;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__591895__591896))) {
            var bullet__591897 = cljs.core.first.call(null, s__591895__591896);
            return cljs.core.cons.call(null, function() {
              var map__591898__591900 = bullet__591897;
              var map__591898__591901 = cljs.core.seq_QMARK_.call(null, map__591898__591900) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591898__591900) : map__591898__591900;
              var x__591902 = cljs.core.get.call(null, map__591898__591901, "\ufdd0'x");
              var y__591903 = cljs.core.get.call(null, map__591898__591901, "\ufdd0'y");
              var map__591899__591904 = cljs.core.get.call(null, map__591898__591901, "\ufdd0'dir");
              var map__591899__591905 = cljs.core.seq_QMARK_.call(null, map__591899__591904) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591899__591904) : map__591899__591904;
              var dx__591906 = cljs.core.get.call(null, map__591899__591905, "\ufdd0'dx");
              var dy__591907 = cljs.core.get.call(null, map__591899__591905, "\ufdd0'dy");
              cljs.core.deref.call(null, tampere.core.ctx).strokeStyle = "rgba(255, 255, 255, 0.5)";
              return tampere.core.line.call(null, x__591902, y__591903, x__591902 - dx__591906, y__591903 - dy__591907)
            }(), iter__591894.call(null, cljs.core.rest.call(null, s__591895__591896)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____591908.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'bullets"))
  }());
  return cljs.core.dorun.call(null, function() {
    var iter__625__auto____591924 = function iter__591909(s__591910) {
      return new cljs.core.LazySeq(null, false, function() {
        var s__591910__591911 = s__591910;
        while(true) {
          if(cljs.core.truth_(cljs.core.seq.call(null, s__591910__591911))) {
            var asteroid__591912 = cljs.core.first.call(null, s__591910__591911);
            return cljs.core.cons.call(null, function() {
              var map__591913__591915 = asteroid__591912;
              var map__591913__591916 = cljs.core.seq_QMARK_.call(null, map__591913__591915) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591913__591915) : map__591913__591915;
              var x__591917 = cljs.core.get.call(null, map__591913__591916, "\ufdd0'x");
              var y__591918 = cljs.core.get.call(null, map__591913__591916, "\ufdd0'y");
              var map__591914__591919 = cljs.core.get.call(null, map__591913__591916, "\ufdd0'dir");
              var map__591914__591920 = cljs.core.seq_QMARK_.call(null, map__591914__591919) ? cljs.core.apply.call(null, cljs.core.hash_map, map__591914__591919) : map__591914__591919;
              var dx__591921 = cljs.core.get.call(null, map__591914__591920, "\ufdd0'dx");
              var dy__591922 = cljs.core.get.call(null, map__591914__591920, "\ufdd0'dy");
              var size__591923 = cljs.core.get.call(null, map__591913__591916, "\ufdd0'size");
              cljs.core.deref.call(null, tampere.core.ctx).strokeStyle = "rgba(0, 200, 0, 0.5)";
              cljs.core.deref.call(null, tampere.core.ctx).fillStyle = "rgb(0, 200, 0)";
              return tampere.core.circle.call(null, x__591917, y__591918, size__591923)
            }(), iter__591909.call(null, cljs.core.rest.call(null, s__591910__591911)))
          }else {
            return null
          }
          break
        }
      })
    };
    return iter__625__auto____591924.call(null, cljs.core.deref.call(null, tampere.core.data).call(null, "\ufdd0'asteroids"))
  }())
};
tampere.core.move = function move() {
  return cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'tx", cljs.core.deref.call(null, tampere.core.gee).mouseX, "\ufdd0'ty", cljs.core.deref.call(null, tampere.core.gee).mouseY)
  })
};
tampere.core.noshoot = function noshoot() {
  return cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'shooting?", false)
  })
};
tampere.core.shoot = function shoot() {
  return cljs.core.swap_BANG_.call(null, tampere.core.data, function() {
    return cljs.core.assoc.call(null, cljs.core.deref.call(null, tampere.core.data), "\ufdd0'shooting?", true)
  })
};
tampere.core.start = function start() {
  cljs.core.swap_BANG_.call(null, tampere.core.gee, function() {
    return new window.GEE(tampere.core.clj__GT_js.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'fullscreen", "\ufdd0'context"], {"\ufdd0'fullscreen":true, "\ufdd0'context":"2d"})))
  });
  cljs.core.swap_BANG_.call(null, tampere.core.ctx, function() {
    return cljs.core.deref.call(null, tampere.core.gee).ctx
  });
  cljs.core.deref.call(null, tampere.core.gee).draw = tampere.core.draw;
  cljs.core.deref.call(null, tampere.core.gee).mousemove = tampere.core.move;
  cljs.core.deref.call(null, tampere.core.gee).mousedown = tampere.core.shoot;
  cljs.core.deref.call(null, tampere.core.gee).mouseup = tampere.core.noshoot;
  cljs.core.deref.call(null, tampere.core.gee).mousedrag = tampere.core.move;
  return document.body.appendChild(tampere.core.gee.domElement)
};
