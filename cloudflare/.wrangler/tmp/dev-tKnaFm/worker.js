var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// H:/node.js/node_global/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
if (!("__unenv__" in performance)) {
  const proto = Performance.prototype;
  for (const key of Object.getOwnPropertyNames(proto)) {
    if (key !== "constructor" && !(key in performance)) {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc) {
        Object.defineProperty(performance, key, desc);
      }
    }
  }
}
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// H:/node.js/node_global/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// H:/node.js/node_global/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// H:/node.js/node_global/node_modules/wrangler/node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// H:/node.js/node_global/node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// H:/node.js/node_global/node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// worker.js
var WEAPI_IV = "0102030405060708";
var WEAPI_KEY = "0CoJUm6Qyw8W8jud";
var EAPI_KEY = "e82ckenh8dichen8";
var BASE62 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var EAPI_UA = "NeteaseMusic 9.0.90/5038 (iPhone; iOS 16.2; zh_CN)";
var UA_WEB = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
function str2buf(str) {
  return new TextEncoder().encode(str).buffer;
}
__name(str2buf, "str2buf");
function ab2hex(buf) {
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(ab2hex, "ab2hex");
function hex2ab(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  return bytes.buffer;
}
__name(hex2ab, "hex2ab");
function ab2b64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
__name(ab2b64, "ab2b64");
function b642ab(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
__name(b642ab, "b642ab");
async function aesCrypt(text, keyHex, ivHex, mode, op) {
  const keyBuf = hex2ab(keyHex);
  let ivBuf = mode === "cbc" ? hex2ab(ivHex) : null;
  const algo = { name: `AES-${mode.toUpperCase()}`, ...ivBuf ? { iv: ivBuf } : {} };
  const cryptoKey = await crypto.subtle.importKey("raw", keyBuf, algo, false, [op]);
  const dataBuf = op === "encrypt" ? str2buf(text) : b642ab(text);
  const result = await crypto.subtle.encrypt(algo, cryptoKey, dataBuf);
  return ab2b64(result);
}
__name(aesCrypt, "aesCrypt");
async function md5(message) {
  const hashBuf = await crypto.subtle.digest("MD5", str2buf(message));
  return ab2hex(hashBuf);
}
__name(md5, "md5");
var RSA_MODULUS = BigInt(
  "0x00e0b509687ced76546702928393559386373f97f4bd87010e86e9dc5e9420045ad356246d589f2b55255718489024626d0b2818510a7183371fd1fa5e5c2060680fb1d6a5174550377bac929486b66f7a7227885f85b8e167659a1743a663c1a7fb332f5806759d15b88184a5121634ce09b46fd570bad5bf9d9bc304698a4db447f08e2249884cbba5a84a663b2727764bf15c67832fa85795262b2ff6f7a2c5300c2b74cc3300a5e587265bfa30fe2c4d7772ef64e174c486bb9631a5880a7fa5ae9f9e8a40b532b2963d4ffe1e1"
);
var RSA_EXP = BigInt(65537);
function rsaEncrypt(text) {
  const reversed = text.split("").reverse().join("");
  let x = BigInt(0);
  for (const ch of reversed) x = (x << BigInt(8)) + BigInt(ch.charCodeAt(0));
  let y = BigInt(1), b = x % RSA_MODULUS, e = RSA_EXP, mod = RSA_MODULUS;
  while (e > 0n) {
    if (e % 2n === 1n) y = y * b % mod;
    b = b * b % mod;
    e /= 2n;
  }
  return y.toString(16).padStart(256, "0");
}
__name(rsaEncrypt, "rsaEncrypt");
async function weapiEncrypt(object) {
  const text = JSON.stringify(object || {});
  let secretKey = "";
  for (let i = 0; i < 16; i++) secretKey += BASE62[Math.floor(Math.random() * BASE62.length)];
  const enc1 = await aesCrypt(text, WEAPI_KEY, WEAPI_IV, "cbc", "encrypt");
  const enc2 = await aesCrypt(enc1, secretKey, WEAPI_IV, "cbc", "encrypt");
  return { params: enc2, encSecKey: rsaEncrypt(secretKey) };
}
__name(weapiEncrypt, "weapiEncrypt");
async function eapiEncrypt(url, object) {
  const text = typeof object === "object" ? JSON.stringify(object) : String(object || "");
  const md5hash = await md5(`nobody${url}use${text}md5forencrypt`);
  const payload = `${url}-36cd479b6b5-${text}-36cd479b6b5-${md5hash}`;
  const encrypted = await aesCrypt(payload, EAPI_KEY, "", "ecb", "encrypt");
  return { params: encrypted.toUpperCase() };
}
__name(eapiEncrypt, "eapiEncrypt");
function parseCookie(str) {
  const out = {};
  for (const part of String(str || "").split(";")) {
    const idx = part.indexOf("=");
    if (idx <= 0) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}
__name(parseCookie, "parseCookie");
function hasLogin(cookie) {
  const obj = parseCookie(cookie);
  return !!(obj.MUSIC_U || obj.MUSIC_A || obj.__csrf);
}
__name(hasLogin, "hasLogin");
async function buildEapiCookie(cookie) {
  const obj = parseCookie(cookie);
  const header = {
    osver: obj.osver || "16.2",
    os: obj.os || "ios",
    appver: obj.appver || "9.0.90",
    versioncode: obj.versioncode || "140",
    channel: obj.channel || "distribution"
  };
  for (const key of ["MUSIC_U", "MUSIC_A", "__csrf", "NMTID", "WNMCID", "WEVNSM", "_ntes_nuid", "_ntes_nnid", "MUSIC_R_U", "deviceId", "sDeviceId", "WM_TID", "WM_NI", "WM_NIKE"]) {
    if (obj[key]) header[key] = obj[key];
  }
  return Object.entries(header).filter(([, v]) => v != null && String(v) !== "").map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("; ");
}
__name(buildEapiCookie, "buildEapiCookie");
var SESSIONS = /* @__PURE__ */ new Map();
var SESSION_TTL = 24 * 60 * 60 * 1e3;
function getSessionId(request) {
  const url = new URL(request.url);
  return url.searchParams.get("clientId") || url.searchParams.get("uid") || request.headers.get("x-client-id") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
}
__name(getSessionId, "getSessionId");
function getSession(id) {
  const entry = SESSIONS.get(id);
  if (!entry || Date.now() - entry.createdAt > SESSION_TTL) {
    SESSIONS.delete(id);
    return null;
  }
  return entry;
}
__name(getSession, "getSession");
function setSession(id, cookie, userId) {
  if (SESSIONS.size >= 1e4) {
    let oldestId = null, oldestTime = Infinity;
    for (const [k, v] of SESSIONS) {
      if (v.createdAt < oldestTime) {
        oldestTime = v.createdAt;
        oldestId = k;
      }
    }
    if (oldestId) SESSIONS.delete(oldestId);
  }
  SESSIONS.set(id, { cookie, userId, createdAt: Date.now() });
}
__name(setSession, "setSession");
async function weapiRequest(path, data, cookie) {
  const apiPath = path.replace(/^weapi\//, "").replace(/^api\//, "");
  const encrypted = await weapiEncrypt(data);
  const resp = await fetch(`https://music.163.com/weapi/${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": UA_WEB,
      "Referer": "https://music.163.com/",
      "Cookie": cookie || ""
    },
    body: new URLSearchParams(encrypted).toString()
  });
  return resp.json().catch(() => ({}));
}
__name(weapiRequest, "weapiRequest");
async function eapiRequest(path, data, cookie) {
  const uri = path.startsWith("/api/") ? path : `/api/${path.replace(/^\//, "")}`;
  const apiPath = uri.slice(5);
  const encrypted = await eapiEncrypt(uri, data);
  const resp = await fetch(`https://interface.music.163.com/eapi/${apiPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": EAPI_UA,
      "Cookie": await buildEapiCookie(cookie)
    },
    body: new URLSearchParams(encrypted).toString(),
    credentials: "include"
  });
  let body = {};
  try {
    body = await resp.json();
  } catch (_) {
  }
  let setCookies = [];
  try {
    if (resp.headers && typeof resp.headers.getSetCookie === "function") setCookies = resp.headers.getSetCookie();
  } catch (_) {
  }
  return { status: resp.status, body, setCookies };
}
__name(eapiRequest, "eapiRequest");
async function proxyToNetease(cookie, method, path, bodyData) {
  const p = path.replace(/^\/+/, "");
  if (p.startsWith("login/") || p.startsWith("eapi/") || p === "user/account") {
    return eapiRequest(p, bodyData || {}, cookie);
  }
  if (method === "POST") return weapiRequest(p, bodyData || {}, cookie);
  try {
    return await weapiRequest(p, bodyData || {}, cookie);
  } catch (_) {
    return await eapiRequest(p, bodyData || {}, cookie);
  }
}
__name(proxyToNetease, "proxyToNetease");
async function handleLoginQrKey() {
  const raw = await eapiRequest("/api/login/qrcode/unikey", { type: 3 }, "");
  const body = raw.body || {};
  const key = body.unikey || body.uniKey || body.data && (body.data.unikey || body.data.uniKey) || "";
  if (!key) throw new Error(`\u83B7\u53D6\u4E8C\u7EF4\u7801 key \u5931\u8D25: ${body.message || body.msg || JSON.stringify(body)}`);
  return { key, unikey: key, code: Number(body.code) || 200 };
}
__name(handleLoginQrKey, "handleLoginQrKey");
async function handleLoginQrCreate(key) {
  const url = `https://music.163.com/login?codekey=${encodeURIComponent(key)}`;
  const img = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=0&data=${encodeURIComponent(url)}`;
  return { img, qrimg: img, url };
}
__name(handleLoginQrCreate, "handleLoginQrCreate");
async function handleLoginQrCheck(key) {
  key = String(key || "").trim();
  if (!key) return { code: 800, message: "\u7F3A\u5C11\u4E8C\u7EF4\u7801 key", loggedIn: false };
  let body = {}, setCookies = [];
  try {
    const raw = await eapiRequest("/api/login/qrcode/client/login", { key, type: 3 }, "");
    body = raw.body || {};
    setCookies = raw.setCookies || [];
  } catch (err) {
    return { code: 801, error: err?.message, message: "\u626B\u7801\u72B6\u6001\u67E5\u8BE2\u5931\u8D25", loggedIn: false };
  }
  const code = Number(body.code || 0);
  const profile3 = body.profile || body.data && body.data.profile || {};
  let cookieText = "";
  if (Array.isArray(body.cookie)) cookieText = body.cookie.filter(Boolean).join("; ");
  else cookieText = String(body.cookie || body.data && body.data.cookie || "").trim();
  if (!cookieText && setCookies.length) {
    const map = /* @__PURE__ */ new Map();
    setCookies.forEach((raw) => {
      const part = String(raw || "").split(";")[0];
      const eq = part.indexOf("=");
      if (eq > 0) map.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
    });
    cookieText = Array.from(map.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }
  if (code === 803) {
    return {
      code: 803,
      message: body.message || "\u767B\u5F55\u6210\u529F",
      nickname: profile3.nickname || "\u7F51\u6613\u4E91\u7528\u6237",
      avatar: profile3.avatarUrl || "",
      loggedIn: true,
      hasCookie: !!cookieText,
      cookie: cookieText,
      userId: profile3.userId || ""
    };
  }
  return {
    code,
    message: { 800: "\u4E8C\u7EF4\u7801\u5DF2\u8FC7\u671F", 801: "\u7B49\u5F85\u626B\u7801", 802: "\u5DF2\u626B\u7801\uFF0C\u5F85\u786E\u8BA4" }[code] || body.message || "",
    nickname: profile3.nickname || "",
    avatar: profile3.avatarUrl || "",
    loggedIn: false,
    hasCookie: false
  };
}
__name(handleLoginQrCheck, "handleLoginQrCheck");
async function handleLoginStatus(cookie) {
  if (!cookie || !/MUSIC_U/.test(cookie)) return { loggedIn: false, vipType: 0, isVip: false, vipLabel: "\u65E0VIP" };
  try {
    const body = await weapiRequest("/api/w/nuser/account/get", {}, cookie);
    const account = body.account || body.data?.account || {};
    const profile3 = body.profile || body.data?.profile || {};
    const userId = profile3.userId || profile3.user_id || account.userId || account.id || "";
    if (!userId) {
      const alt = await weapiRequest("/api/nuser/account/get", {}, cookie);
      const a2 = alt.account || alt.data?.account || {};
      const p2 = alt.profile || alt.data?.profile || {};
      return {
        loggedIn: !!(p2.userId || a2.userId),
        userId: p2.userId || a2.userId || "",
        nickname: p2.nickname || a2.userName || "",
        avatar: p2.avatarUrl || a2.avatarUrl || "",
        vipType: 0,
        isVip: false,
        vipLabel: "\u65E0VIP"
      };
    }
    return {
      loggedIn: true,
      userId,
      nickname: profile3.nickname || profile3.userName || account.userName || "",
      avatar: profile3.avatarUrl || account.avatarUrl || "",
      vipType: 0,
      isVip: false,
      vipLabel: "\u65E0VIP"
    };
  } catch (_) {
    return { loggedIn: false, vipType: 0, isVip: false, vipLabel: "\u65E0VIP" };
  }
}
__name(handleLoginStatus, "handleLoginStatus");
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-ID",
  "Access-Control-Max-Age": "86400"
};
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS }
  });
}
__name(json, "json");
function readCookie(request, url) {
  const q = url.searchParams.get("cookie");
  if (q) return decodeURIComponent(q);
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return request.headers.get("cookie") || "";
}
__name(readCookie, "readCookie");
var worker_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
    const url = new URL(request.url);
    const path = url.pathname;
    const sessionId = getSessionId(request);
    if (path === "/api/health") return json({ ok: true, service: "splayer-web-backend", env: "cloudflare", sessions: SESSIONS.size });
    if (path === "/api/login/qr/key") {
      try {
        return json(await handleLoginQrKey());
      } catch (e) {
        return json({ code: 500, error: e.message }, 500);
      }
    }
    if (path === "/api/login/qr/create") {
      const key = url.searchParams.get("key") || "";
      try {
        return json(await handleLoginQrCreate(key));
      } catch (e) {
        return json({ code: 500, error: e.message }, 500);
      }
    }
    if (path === "/api/login/qr/check") {
      const key = url.searchParams.get("key") || "";
      return json(await handleLoginQrCheck(key));
    }
    if (path === "/api/login/status") {
      const cookie = readCookie(request, url);
      const session = getSession(sessionId);
      return json(await handleLoginStatus(cookie || session?.cookie || ""));
    }
    if (path === "/api/login/refresh") {
      const cookie = readCookie(request, url);
      const session = getSession(sessionId);
      return json(await handleLoginStatus(cookie || session?.cookie || ""));
    }
    if (path === "/api/logout") {
      SESSIONS.delete(sessionId);
      return json({ code: 200, message: "\u9000\u51FA\u6210\u529F" });
    }
    if (path.startsWith("/api/")) {
      const cookie = readCookie(request, url);
      const session = getSession(sessionId);
      const userCookie = cookie || session?.cookie || "";
      let bodyData = {};
      if (request.method === "POST") {
        const ct = request.headers.get("content-type") || "";
        try {
          bodyData = ct.includes("json") ? await request.json() : Object.fromEntries(await request.formData());
        } catch (_) {
        }
      } else {
        const skip = /* @__PURE__ */ new Set(["cookie", "noCookie", "realIP", "proxy", "clientId", "uid"]);
        for (const [k, v] of url.searchParams) {
          if (!skip.has(k)) bodyData[k] = v;
        }
      }
      try {
        const result = await proxyToNetease(userCookie, request.method, path, bodyData);
        if (hasLogin(userCookie) && !session) setSession(sessionId, userCookie, result?.profile?.userId || result?.userId || "");
        return json(result);
      } catch (err) {
        return json({ code: 502, error: err?.message || "\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528", path }, 502);
      }
    }
    return json({ code: 404, message: `Not found: ${request.method} ${path}` }, 404);
  }
};

// H:/node.js/node_global/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// H:/node.js/node_global/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    const body = JSON.stringify(error3);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-yv92p7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// H:/node.js/node_global/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-yv92p7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
