/**
 * Copyright 2015 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

function RateLimiterPolicy(samplesPerSecond) {
  if (samplesPerSecond > 1000) {
    samplesPerSecond = 1000;
  }
  this.traceWindow = 1000 / samplesPerSecond;
  this.nextTraceStart = Date.now();
}

RateLimiterPolicy.prototype.shouldTrace = function(dateMillis) {
  if (dateMillis < this.nextTraceStart) {
    return false;
  }
  this.nextTraceStart = dateMillis + this.traceWindow;
  return true;
};

function FilterPolicy(basePolicy, filters) {
  this.basePolicy = basePolicy;
  this.filters = filters;
}

FilterPolicy.prototype.matches = function(request) {
  var self = this, match = false;
  Object.keys(request).forEach(function (key) {
    if (!(self.filters[key] instanceof Array)) return ;

    return self.filters[key].some(function(candidate) {
      match = match ? true : ((typeof candidate === 'string' && request[key].indexOf(candidate) > -1) ||
       (candidate instanceof RegExp && request[key].match(candidate)));
    });
  });
  return match;
};

FilterPolicy.prototype.shouldTrace = function(dataMillis, request) {
  return !this.matches(request) && this.basePolicy.shouldTrace(dataMillis, request);
};

function TraceAllPolicy() {}

TraceAllPolicy.prototype.shouldTrace = function() { return true; };

module.exports = {
  createTracePolicy: function(config) {
    var basePolicy  = config.samplingRate < 1 ? new TraceAllPolicy() : new RateLimiterPolicy(config.samplingRate);
    if (!config.ignoreFilter) return basePolicy;

    // search for a filter to apply
    Object.keys(config.ignoreFilter).forEach(function (filter) {
      if (config.ignoreFilter[filter].length > 0)
        basePolicy = new FilterPolicy(basePolicy, config.ignoreFilter);
    })
    // if no filter has been set fallback to base policy
    return basePolicy;
  }
};
