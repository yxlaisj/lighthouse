#!/usr/bin/env node
/**
 * @license
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
'use strict';

const closureCompiler = require('google-closure-compiler').gulp();
const gulp = require('gulp');
const gutil = require('gulp-util');
const replace = require('gulp-replace');

const js = [
  // 'audits/**/*.js',
  'lib/event-helpers.js',
  'lib/icons.js',
  'lib/styles-helpers.js',
  'lib/url-shim.js',
  'aggregator/**/*.js',
  'report/formatter.js',
  'lib/traces/tracing-processor.js',
  'lib/emulation.js',
];

const externs = [
  'closure/typedefs/*.js',
  'closure/third_party/*.js'
];

// Files to explicitly ignore
const ignoreFiles = [
  '!audits/byte-efficiency/unused-css-rules.js',
];

/* eslint-disable camelcase */
gulp.task('js-compile', function() {
  const files = js.concat(externs, ignoreFiles);

  return gulp.src(files)
    // Hack to remove `require`s that Closure currently can't resolve.
    .pipe(replace('require(\'../lib/web-inspector\').Color.parse;',
        'WebInspector.Color.parse;'))
    .pipe(replace('require(\'gl-matrix\')', '/** @type{!Object<string, *>} */({})'))
    .pipe(replace('require(\'whatwg-url\').URL', 'self.URL'))
    .pipe(replace(/require\('(\.\.\/)*third_party\/traceviewer-js\/'\);/g, '{};'))
    .pipe(replace('require(\'metaviewport-parser\')', 'MetaviewportParser'))
    // .pipe(replace('require(\'../lib/traces/tracing-processor\');', '/** @type {?} */ (null);'))
    // .pipe(replace('require(\'../lib/traces/devtools-timeline-model\');',
    //     'DevtoolsTimelineModel'))
    // .pipe(replace('require(\'speedline\');', 'function(arg) {};'))
    // .pipe(replace(/require\('(\.\.\/)*report\/formatter'\);/g, '{};'))

    // Replace any non-local import (e.g. not starting with .) with a dummy type. These are likely
    // the built-in Node modules. But not always, so TODO(samthor): Fix this.
    .pipe(replace(/require\(\'[^\.].*?\'\)/g, '/** @type {*} */ ({})'))

    .pipe(closureCompiler({
      compilation_level: 'SIMPLE',
      module_resolution: 'NODE',
      process_common_js_modules: true,
      new_type_inf: true,
      checks_only: true,
      language_in: 'ECMASCRIPT6_STRICT',
      language_out: 'ECMASCRIPT5_STRICT',
      warning_level: process.env.CI ? 'QUIET' : 'VERBOSE',
      jscomp_error: [
        'checkTypes',
        'conformanceViolations'
      ],
      jscomp_warning: [
        // https://github.com/google/closure-compiler/wiki/Warnings
        'accessControls',
        'checkRegExp',
        'const',
        // 'reportUnknownTypes',
        'missingProperties',
        'missingReturn',
        'newCheckTypes',
        'strictModuleDepCheck',
        'typeInvalidation',
        'undefinedNames',
        'visibility',

        'missingProvide',
        'checkDebuggerStatement',
        'externsValidation',
        'uselessCode',
        'ambiguousFunctionDecl',
        'checkTypes',
        'es3',
        'es5Strict',
        'globalThis',
        'nonStandardJsDocs',
        'strictMissingRequire',
        'suspiciousCode',
        'unknownDefines'
      ],
      jscomp_off: [
        'newCheckTypesExtraChecks'
      ],
      hide_warnings_for: 'synthetic',
      conformance_configs: 'closure/conformance_config.textproto'
    }))
    .on('error', error => {
      gutil.log('Closure compilation failed. Check `closure-error.log` for details.');
      require('fs').writeFileSync('closure-error.log', error);
    })
    .on('end', () => {
      gutil.log('Closure compilation successful.');
    });
});
/* eslint-enable */

gulp.start('js-compile');
