import SplitChunksPlugin from 'webpack/lib/optimize/SplitChunksPlugin';
import { Template } from 'webpack';
import { isDynamicDep, getModuleId, normalizePublicPath } from './helper';
const path = require('path');
const PLUGIN_NAME = 'miniRemoteChunkPlugin';
export default class MiniRemoteChunkPlugin extends SplitChunksPlugin {
    dynamicModules = new Set();
    moduleBuildInfoMap = new Map();
    dynamicModuleReasonMap = new Map();
    splitChunkNames = [];
    options = null;
    publicPath = '';
    remoteChunkOutputPath = '';
    entryChunkUseCache = false;
    constructor(o) {
        super(o);
        this.publicPath = normalizePublicPath(o.publicPath);
        this.remoteChunkOutputPath = normalizePublicPath(o.remoteChunkOutputPath);
        this.entryChunkUseCache = o.entryChunkUseCache;
    }
    apply(compiler) {
        super.apply(compiler);
        compiler.hooks.compilation.tap(PLUGIN_NAME, (compilation) => {
            compilation.hooks.finishModules.tap(PLUGIN_NAME, this.collectDynamicModules);
            compilation.hooks.optimizeChunks.tap(PLUGIN_NAME, (chunks) => {
                let _options = compiler.options.optimization.splitChunks;
                _options.cacheGroups = this.getDynamicChunkCacheGroups(_options.cacheGroups);
                this.options = SplitChunksPlugin.normalizeOptions(_options);
            });
            compilation.hooks.beforeChunkIds.tap(PLUGIN_NAME, this.stableChunkId);
            const { mainTemplate } = compilation;
            this.injectVar(mainTemplate);
            this.rewriteJsonpScriptSrcFunc(mainTemplate);
            this.rewriteJsonpScriptFunc(mainTemplate);
            this.rewriteRequireEnsureFunc(mainTemplate);
        });
    }
    collectDynamicModules = (modules) => {
        modules.forEach((module) => {
            const { reasons = [] } = module;
            const moduleId = getModuleId(module);
            const isDynamic = reasons.every((reason) => isDynamicDep(reason.dependency));
            if (isDynamic) {
                this.dynamicModules.add(moduleId);
                const filename = path.basename(moduleId).split('.')[0];
                this.moduleBuildInfoMap.set(moduleId, {
                    hash: module._buildHash,
                    filename,
                });
                this.dynamicModuleReasonMap.set(moduleId, reasons);
            }
        });
    };
    isEntryDynamicModule = (moduleId) => {
        const reasons = this.dynamicModuleReasonMap.get(moduleId);
        return reasons.every((reason) => {
            const reasonModuleId = getModuleId(reason.module);
            return !this.dynamicModules.has(reasonModuleId);
        });
    };
    getDynamicChunkCacheGroups = (initialCacheGroups = {}) => {
        return Array.from(this.dynamicModules).reduce((cacheGroups, moduleId) => {
            const { filename } = this.moduleBuildInfoMap.get(moduleId);
            const chunkName = this.getChunkName(moduleId);
            this.splitChunkNames.push(chunkName);
            cacheGroups[filename] = {
                name: chunkName,
                test: (module) => {
                    return getModuleId(module) === moduleId;
                },
                minChunks: 1,
                priority: 10000,
            };
            return cacheGroups;
        }, initialCacheGroups);
    };
    getChunkName = (moduleId) => {
        const isEntryModule = this.isEntryDynamicModule(moduleId);
        const { filename, hash } = this.moduleBuildInfoMap.get(moduleId);
        return `${this.remoteChunkOutputPath}/${filename}${isEntryModule ? '' : '_' + hash}`;
    };
    stableChunkId = (chunks) => {
        chunks.forEach((chunk) => {
            if (this.splitChunkNames.find((m) => chunk.name === m)) {
                chunk.id = chunk.name;
            }
        });
    };
    injectVar = (mainTemplate) => {
        mainTemplate.hooks.requireExtensions.tap(PLUGIN_NAME, (source) => {
            const __dynamicEntryChunkInfo__ = Array.from(this.dynamicModules).reduce((info, moduleId) => {
                if (this.isEntryDynamicModule(moduleId)) {
                    const chunkName = this.getChunkName(moduleId);
                    info[chunkName] = true;
                }
                return info;
            }, {});
            return Template.asString([
                `var __dynamicChunkPublicPath__ = "${this.publicPath}";`,
                this.entryChunkUseCache === false
                    ? ''
                    : `var __dynamicEntryChunkInfo__ = ${JSON.stringify(__dynamicEntryChunkInfo__)}`,
                source,
            ]);
        });
    };
    rewriteJsonpScriptSrcFunc = (mainTemplate) => {
        mainTemplate.hooks.localVars.tap(PLUGIN_NAME, (source) => {
            const replaceRegex = /function jsonpScriptSrc\(chunkId\) \{\n(.*)\n\}/;
            let newSource = Template.indent(['return __dynamicChunkPublicPath__ + "" + chunkId + ".js";']);
            if (typeof this.entryChunkUseCache === 'function') {
                newSource = Template.indent([
                    'var url = __dynamicChunkPublicPath__ + "" + chunkId + ".js"',
                    `var queryHandleFunc = ${this.entryChunkUseCache};`,
                    'if(__dynamicEntryChunkInfo__[chunkId]) {',
                    Template.indent(['url = queryHandleFunc(url);']),
                    '}',
                    'return url;',
                ]);
            }
            else if (this.entryChunkUseCache === true) {
                newSource = Template.indent([
                    'var query = __dynamicEntryChunkInfo__[chunkId] ? "?v=" + Date.now() : ""',
                    'return __dynamicChunkPublicPath__ + "" + chunkId + ".js" + query;',
                ]);
            }
            source = source.replace(replaceRegex, Template.asString(['var jsonpScriptSrc = function (chunkId) {', newSource, '}']));
            return source;
        });
    };
    rewriteJsonpScriptFunc = (mainTemplate) => {
        mainTemplate.hooks.jsonpScript &&
            mainTemplate.hooks.jsonpScript.tap('JsonpMainTemplatePlugin', () => {
                const { chunkLoadTimeout } = mainTemplate.outputOptions;
                return Template.asString([
                    'var onScriptComplete;',
                    '// create error before stack unwound to get useful stacktrace later',
                    'var error = new Error();',
                    'onScriptComplete = function (event) {',
                    Template.indent([
                        'clearTimeout(timeout);',
                        'var chunk = installedChunks[chunkId];',
                        'if(chunk !== 0) {',
                        Template.indent([
                            'if(chunk) {',
                            Template.indent([
                                "var errorType = event && (event.type === 'load' ? 'missing' : event.type);",
                                'var realSrc = event && event.target && event.target.src || chunkId;',
                                "error.message = 'Loading chunk ' + chunkId + ' failed.\\n(' + errorType + ': ' + realSrc + ')';",
                                "error.name = 'ChunkLoadError';",
                                'error.type = errorType;',
                                'error.request = realSrc;',
                                'chunk[1](error);',
                            ]),
                            '}',
                            'installedChunks[chunkId] = undefined;',
                        ]),
                        '}',
                    ]),
                    '};',
                    'var timeout = setTimeout(function(){',
                    Template.indent(["onScriptComplete({ type: 'timeout' });"]),
                    `}, ${chunkLoadTimeout});`,
                    'var __chunkFailCallback = function () {',
                    Template.indent(["onScriptComplete({ type: 'request:fail' });"]),
                    '};',
                    'var __chunkSuccessCallback = function (res) {',
                    Template.indent([
                        'if (res.statusCode !== 200) {',
                        Template.indent(['__chunkFailCallback();', 'return;']),
                        '}',
                        'try {',
                        Template.indent([
                            'var rootContext = globalThis;',
                            "var interpreter = new wx['eval5'].Interpreter(rootContext, { rootContext: rootContext });",
                            'interpreter.evaluate(res.data)',
                        ]),
                        '} catch(error) {',
                        'console.trace(error)',
                        '}',
                    ]),
                    '};',
                    'console.log(jsonpScriptSrc(chunkId));',
                    'wx.request({',
                    Template.indent([
                        'url: jsonpScriptSrc(chunkId),',
                        `timeout: ${chunkLoadTimeout},`,
                        'success: __chunkSuccessCallback,',
                        'fail: __chunkFailCallback',
                    ]),
                    '})',
                ]);
            });
    };
    rewriteRequireEnsureFunc = (mainTemplate) => {
        mainTemplate.hooks.requireEnsure.tap('JsonpMainTemplatePlugin load', (source, chunk, hash) => {
            return Template.asString([
                '// JSONP chunk loading for javascript',
                '',
                'var installedChunkData = installedChunks[chunkId];',
                'if(installedChunkData !== 0) { // 0 means "already installed".',
                Template.indent([
                    '',
                    '// a Promise means "currently loading".',
                    'if(installedChunkData) {',
                    Template.indent(['promises.push(installedChunkData[2]);']),
                    '} else {',
                    Template.indent([
                        '// setup Promise in chunk cache',
                        'var promise = new Promise(function(resolve, reject) {',
                        Template.indent(['installedChunkData = installedChunks[chunkId] = [resolve, reject];']),
                        '});',
                        'promises.push(installedChunkData[2] = promise);',
                        '',
                        '// start chunk loading',
                        mainTemplate.hooks.jsonpScript.call('', chunk, hash),
                    ]),
                    '}',
                ]),
                '}',
            ]);
        });
    };
}
