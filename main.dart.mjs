// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: x0 => x0.tabIndex,
      AE: x0 => x0.matches,
      AF: x0 => x0.pressure,
      AG: (x0,x1) => x0.requestAnimationFrame(x1),
      AH: x0 => x0.unlock(),
      AI: (x0,x1) => x0.createTextNode(x1),
      AJ: x0 => x0.done,
      AK: x0 => x0.extraAssets,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1) => x0.contains(x1),
      BE: (x0,x1) => x0.matchMedia(x1),
      BF: x0 => x0.tiltY,
      BG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      BH: (x0,x1) => x0.lock(x1),
      BI: (x0,x1) => { x0.textContent = x1 },
      BJ: x0 => x0.body,
      BK: x0 => x0.fontManifest,
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: x0 => x0.activeElement,
      CE: x0 => x0.matches,
      CF: x0 => x0.tiltX,
      CG: x0 => x0.now(),
      CH: x0 => x0.orientation,
      CI: x0 => x0.body,
      CJ: x0 => x0.headers,
      CK: x0 => x0.assetManifest,
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: x0 => x0.parentNode,
      DE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      DF: x0 => x0.pointerType,
      DG: x0 => x0.performance,
      DH: (x0,x1) => x0.querySelector(x1),
      DI: (x0,x1) => { x0.id = x1 },
      DJ: x0 => x0.signal,
      DK: x0 => x0.buildConfig,
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.tagName,
      EE: f => f.dartFunction,
      EF: x0 => x0.pointerId,
      EG: (d, digits) => d.toFixed(digits),
      EH: (x0,x1) => { x0.title = x1 },
      EI: (x0,x1) => x0.removeAttribute(x1),
      EJ: (handle) => clearInterval(handle),
      EK: x0 => x0.length,
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.target,
      FE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FF: x0 => x0.getCoalescedEvents(),
      FG: x0 => x0.maxHeight,
      FH: (x0,x1) => x0.vibrate(x1),
      FI: () => globalThis.document,
      FJ: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      FK: x0 => x0.getReader(),
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.clientY,
      GE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      GF: s => s.trimLeft(),
      GG: x0 => x0.maxWidth,
      GH: x0 => x0.arrayBuffer(),
      GI: x0 => x0.pop(),
      GJ: () => Date.now(),
      GK: x0 => x0.value,
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: x0 => x0.clientX,
      HE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      HF: s => s.toUpperCase(),
      HG: x0 => x0.minHeight,
      HH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      HI: (x0,x1) => { x0.title = x1 },
      HJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      HK: x0 => x0.done,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: (x0,x1,x2) => x0.addEventListener(x1,x2),
      IE: (o, i) => o[i],
      IF: (x0,x1) => x0.test(x1),
      IG: x0 => x0.minWidth,
      IH: x0 => x0.status,
      II: (x0,x1,x2) => x0.set(x1,x2),
      IJ: (x0,x1) => x0.querySelectorAll(x1),
      IK: x0 => x0.read(),
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      JE: o => o.length,
      JF: (x0,x1) => x0[x1],
      JG: (x0,x1) => x0.removeProperty(x1),
      JH: (x0,x1) => x0.fetch(x1),
      JI: x0 => x0.close(),
      JJ: (x0,x1) => x0.item(x1),
      JK: x0 => x0.body,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: (x0,x1) => x0.closest(x1),
      KE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      KF: x0 => x0.index,
      KG: (x0,x1) => x0.add(x1),
      KH: x0 => x0.content,
      KI: x0 => x0.height,
      KJ: (x0,x1) => x0.removeChild(x1),
      KK: (x0,x1) => new OffscreenCanvas(x0,x1),
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      LE: x0 => x0.language,
      LF: x0 => x0.flags,
      LG: x0 => x0.data,
      LH: x0 => x0.document,
      LI: x0 => x0.width,
      LJ: x0 => x0.parentNode,
      LK: x0 => x0.assetBase,
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: (handle) => clearTimeout(handle),
      ME: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      MF: (a, s) => a.join(s),
      MG: (x0,x1) => x0.removeAttribute(x1),
      MH: () => typeof dartUseDateNowForTicks !== "undefined",
      MI: (x0,x1,x2,x3,x4,x5) => x0.createImageBitmap(x1,x2,x3,x4,x5),
      MJ: x0 => x0.length,
      MK: x0 => x0.loader,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: x0 => x0.maxTouchPoints,
      NE: () => globalThis.window.FinalizationRegistry,
      NF: (x0,x1) => x0.error(x1),
      NG: (x0,x1) => { x0.value = x1 },
      NH: () => Date.now(),
      NI: (x0,x1) => x0.createImageBitmap(x1),
      NJ: x0 => x0.head,
      NK: () => globalThis._flutter,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: x0 => x0.platform,
      OE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      OF: () => globalThis.console,
      OG: (x0,x1) => { x0.value = x1 },
      OH: () => 1000 * performance.now(),
      OI: x0 => new Blob(x0),
      OJ: (x0,x1,x2) => x0.insertBefore(x1,x2),
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      PE: x0 => new window.FinalizationRegistry(x0),
      PF: s => s.trimRight(),
      PG: x0 => x0.value,
      PH: x0 => new Uint8Array(x0),
      PI: x0 => x0.close(),
      PJ: x0 => x0.id,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: Date.now,
      QE: (x0,x1) => x0.unregister(x1),
      QF: x0 => x0.blur(),
      QG: x0 => x0.selectionDirection,
      QH: (x0,x1,x2) => x0.slice(x1,x2),
      QI: x0 => x0.naturalHeight,
      QJ: x0 => x0.offsetHeight,
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: (x0,x1) => x0.contains(x1),
      RE: x0 => x0.preventDefault(),
      RF: x0 => x0.button,
      RG: x0 => x0.selectionStart,
      RH: (x0,x1) => x0.decode(x1),
      RI: x0 => x0.naturalWidth,
      RJ: x0 => x0.offsetWidth,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: (decoder, codeUnits) => decoder.decode(codeUnits),
      SE: x0 => x0.parent,
      SF: (x0,x1) => x0.prepend(x1),
      SG: x0 => x0.selectionEnd,
      SH: (x0,x1) => x0.adoptText(x1),
      SI: (x0,x1) => { x0.src = x1 },
      SJ: x0 => x0.stopPropagation(),
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (x0,x1) => x0.exec(x1),
      TD: () => new TextDecoder("utf-8", {fatal: true}),
      TE: x0 => x0.timeStamp,
      TF: x0 => x0.parentElement,
      TG: x0 => x0.value,
      TH: x0 => x0.first(),
      TI: x0 => x0.displayHeight,
      TJ: x0 => x0.disabled,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: x0 => x0.length,
      UD: () => new TextDecoder("utf-8", {fatal: false}),
      UE: (x0,x1) => x0.hasAttribute(x1),
      UF: x0 => x0.innerHeight,
      UG: x0 => x0.selectionDirection,
      UH: x0 => x0.next(),
      UI: x0 => x0.displayWidth,
      UJ: (x0,x1) => { x0.min = x1 },
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (x0,x1) => { x0.lastIndex = x1 },
      VD: (a, i, v) => a[i] = v,
      VE: x0 => x0.type,
      VF: x0 => x0.innerWidth,
      VG: x0 => x0.selectionStart,
      VH: x0 => x0.current(),
      VI: x0 => x0.duration,
      VJ: (x0,x1) => { x0.max = x1 },
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      WD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      WE: (x0,x1) => x0.getModifierState(x1),
      WF: x0 => x0.height,
      WG: x0 => x0.selectionEnd,
      WH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      WI: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      WJ: (x0,x1) => { x0.disabled = x1 },
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: o => o instanceof RegExp,
      XD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      XE: x0 => x0.buttons,
      XF: x0 => x0.width,
      XG: (x0,x1) => { x0.name = x1 },
      XH: x0 => x0.v8BreakIterator,
      XI: (x0,x1) => x0.decode(x1),
      XJ: (x0,x1) => { x0.scrollLeft = x1 },
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: (string, times) => string.repeat(times),
      YD: (s) => +s,
      YE: x0 => x0.ctrlKey,
      YF: x0 => x0.clientHeight,
      YG: (x0,x1) => { x0.placeholder = x1 },
      YH: () => globalThis.Intl,
      YI: x0 => x0.image,
      YJ: (x0,x1) => { x0.spellcheck = x1 },
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.dotAll,
      ZD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      ZE: x0 => x0.getBoundingClientRect(),
      ZF: x0 => x0.clientWidth,
      ZG: (x0,x1) => { x0.autocomplete = x1 },
      ZH: (x0,x1) => x0.segment(x1),
      ZI: x0 => x0.close(),
      ZJ: (x0,x1) => { x0.disabled = x1 },
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: x0 => x0.unicode,
      aD: s => s.trim(),
      aE: x0 => x0.y,
      aF: x0 => x0.isConnected,
      aG: (x0,x1) => { x0.type = x1 },
      aH: x0 => x0.index,
      aI: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      aJ: x0 => x0.baseURI,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.ignoreCase,
      bD: x0 => x0.classList,
      bE: x0 => x0.x,
      bF: x0 => x0.head,
      bG: (x0,x1) => { x0.name = x1 },
      bH: x0 => x0.next(),
      bI: x0 => new window.ImageDecoder(x0),
      bJ: x0 => x0.debugSkipFontRetryDelay,
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.multiline,
      cD: x0 => x0.relatedTarget,
      cE: x0 => x0.top,
      cF: (x0,x1) => { x0.content = x1 },
      cG: (x0,x1) => { x0.placeholder = x1 },
      cH: x0 => x0.value,
      cI: x0 => x0.name,
      cJ: x0 => x0.fontFallbackBaseUrl,
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (string, token) => string.split(token),
      dD: x0 => x0.hasFocus(),
      dE: x0 => x0.left,
      dF: (x0,x1) => { x0.name = x1 },
      dG: (x0,x1) => { x0.scrollTop = x1 },
      dH: x0 => x0.done,
      dI: x0 => x0.repetitionCount,
      dJ: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: o => o instanceof Array,
      eD: x0 => x0.shiftKey,
      eE: x0 => x0.scrollTop,
      eF: (x0,x1) => x0.removeChild(x1),
      eG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      eH: (o, m, a) => o[m].apply(o, a),
      eI: x0 => x0.frameCount,
      eJ: (x0,x1) => x0.getContext(x1),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (a, i) => a[i],
      fD: x0 => x0.body,
      fE: x0 => x0.offsetTop,
      fF: x0 => x0.firstChild,
      fG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      fH: x0 => x0.iterator,
      fI: x0 => x0.selectedTrack,
      fJ: (x0,x1) => { x0.height = x1 },
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: a => a.length,
      gD: x0 => x0.visibilityState,
      gE: x0 => x0.scrollLeft,
      gF: x0 => x0.viewConstraints,
      gG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      gH: () => globalThis.Symbol,
      gI: x0 => x0.completed,
      gJ: (x0,x1) => { x0.width = x1 },
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: x0 => x0.userAgent,
      hD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      hE: x0 => x0.offsetLeft,
      hF: x0 => x0.hostElement,
      hG: x0 => x0.keyCode,
      hH: (x0,x1) => new Intl.Segmenter(x0,x1),
      hI: x0 => x0.ready,
      hJ: (x0,x1) => x0.transferFromImageBitmap(x1),
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: x0 => x0.navigator,
      iD: x0 => x0.disconnect(),
      iE: x0 => x0.offsetParent,
      iF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      iG: (x0,x1) => x0.scrollIntoView(x1),
      iH: x0 => x0.Segmenter,
      iI: x0 => x0.tracks,
      iJ: x0 => x0.rasterEndMilliseconds,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: Function.prototype.call.bind(String.prototype.toLowerCase),
      jD: x0 => new Intl.Locale(x0),
      jE: x0 => x0.offsetY,
      jF: x0 => ({runApp: x0}),
      jG: x0 => x0.multiViewEnabled,
      jH: x0 => x0.buffer,
      jI: () => globalThis.window.ImageDecoder,
      jJ: x0 => x0.rasterStartMilliseconds,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: Object.is,
      kD: x0 => x0.region,
      kE: x0 => x0.offsetX,
      kF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      kG: (x0,x1) => x0.replaceWith(x1),
      kH: x0 => x0.wasmMemory,
      kI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      kJ: x0 => x0.imageBitmaps,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: x0 => x0.vendor,
      lD: x0 => x0.script,
      lE: (o, p, r) => o.replace(p, () => r),
      lF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      lG: (x0,x1) => { x0.className = x1 },
      lH: () => globalThis.window._flutter_skwasmInstance,
      lI: (a, s, e) => a.slice(s, e),
      lJ: x0 => x0.canvasKitMaximumSurfaces,
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: (x0,x1) => x0.createTextNode(x1),
      mD: x0 => x0.language,
      mE: (o, p, r) => o.replaceAll(p, () => r),
      mF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      mG: (x0,x1) => { x0.tabIndex = x1 },
      mH: () => new TextDecoder(),
      mI: () => new AbortController(),
      mJ: x0 => x0.hostElement,
      n: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: (x0,x1) => { x0.id = x1 },
      nD: x0 => x0.languages,
      nE: x0 => x0.deltaMode,
      nF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      nG: (x0,x1) => { x0.action = x1 },
      nH: (map, o, v) => map.set(o, v),
      nI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      nJ: x0 => x0.location,
      o: b => !!b,
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: (x0,x1) => { x0.nonce = x1 },
      oD: (x0,x1) => x0.observe(x1),
      oE: x0 => x0.deltaY,
      oF: x0 => x0.history,
      oG: (x0,x1) => { x0.method = x1 },
      oH: (map, o) => map.get(o),
      oI: (x0,x1) => globalThis.fetch(x0,x1),
      oJ: (x0,x1) => x0.getModifierState(x1),
      p: () => globalThis.document,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: x0 => x0.nonce,
      pD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      pE: x0 => x0.deltaX,
      pF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      pG: (x0,x1) => { x0.noValidate = x1 },
      pH: () => new WeakMap(),
      pI: (x0,x1) => x0.get(x1),
      pJ: x0 => x0.metaKey,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: () => globalThis.window.flutterConfiguration,
      qD: x0 => new ResizeObserver(x0),
      qE: x0 => x0.wheelDeltaY,
      qF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      qG: x0 => x0.click(),
      qH: x0 => new WeakRef(x0),
      qI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      qJ: x0 => x0.altKey,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: (x0,x1) => x0.attachShadow(x1),
      rD: (x0,x1) => x0.getPropertyValue(x1),
      rE: x0 => x0.wheelDeltaX,
      rF: o => Object.keys(o),
      rG: (x0,x1) => x0.getElementsByClassName(x1),
      rH: x0 => x0.deref(),
      rI: (x0,x1) => x0.forEach(x1),
      rJ: x0 => x0.ctrlKey,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.createElement(x1),
      sD: x0 => globalThis.parseFloat(x0),
      sE: x0 => x0.bottom,
      sF: x0 => x0.state,
      sG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      sH: () => globalThis.WeakRef,
      sI: x0 => x0.name,
      sJ: x0 => x0.isComposing,
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: x0 => x0.scale,
      tD: (x0,x1) => x0.getComputedStyle(x1),
      tE: x0 => x0.right,
      tF: x0 => x0.state,
      tG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      tH: (a, i) => a.splice(i, 1),
      tI: x0 => x0.statusText,
      tJ: x0 => x0.code,
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.visualViewport,
      uD: x0 => x0.documentElement,
      uE: x0 => x0.clientY,
      uF: (x0,x1) => x0.go(x1),
      uG: (x0,x1) => x0.dispatchEvent(x1),
      uH: a => a.pop(),
      uI: x0 => x0.url,
      uJ: x0 => x0.repeat,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.devicePixelRatio,
      vD: x0 => x0.computedStyleMap(),
      vE: x0 => x0.clientX,
      vF: x0 => x0.hash,
      vG: (x0,x1) => x0.createEvent(x1),
      vH: (x0,x1) => x0.getElementById(x1),
      vI: x0 => x0.status,
      vJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.height,
      wD: (x0,x1) => x0.get(x1),
      wE: x0 => x0.changedTouches,
      wF: x0 => x0.location,
      wG: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      wH: (x0,x1) => x0.hasAttribute(x1),
      wI: x0 => x0.cancel(),
      wJ: x0 => x0.userAgent,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.width,
      xD: (o, p) => p in o,
      xE: x0 => x0.key,
      xF: x0 => x0.search,
      xG: x0 => x0.readText(),
      xH: (x0,x1) => x0.createElement(x1),
      xI: x0 => x0.getReader(),
      xJ: x0 => x0.navigator,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.screen,
      yD: (x0,x1) => { x0.textContent = x1 },
      yE: x0 => x0.identifier,
      yF: x0 => x0.pathname,
      yG: x0 => x0.clipboard,
      yH: (x0,x1,x2) => x0.setAttribute(x1,x2),
      yI: x0 => x0.read(),
      yJ: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      zD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      zE: x0 => x0.touches,
      zF: (x0,x1) => x0.querySelectorAll(x1),
      zG: (x0,x1) => x0.writeText(x1),
      zH: (x0,x1) => x0.appendChild(x1),
      zI: x0 => x0.value,
      zJ: () => globalThis.window,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
