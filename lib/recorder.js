'use strict';

var util = require('util');
var EventEmitter = require('events');

var assert = require('assert-plus');

var DefaultConfig = require('./config/default.js');

/**
 * Recorder
 *
 * The recorder is used for creating the two entry points of the metrics system,
 * i.e. the counters and timers.
 *
 * This abstraction reflect the "separation of concern" strategy used in this
 * library, the recorder is not aware of the aggregator, and doesn't know if a
 * counter/timer has to be created, but the consumer of the data (the
 * aggregator) can control if they're interested in the data or not. This leads
 * to a very flexible library.
 *
 * @param {Object} _config Config object
 * @param {Func} [_config.counter] the function used to create counter
 * @param {Func} [_config.timer] the function used to create timer
 * @returns {Recorder}
 */
function Recorder(_config) {
    EventEmitter.call(this);
    var config = _config || DefaultConfig.recorder;
    assert.object(config, 'config');
    assert.optionalFunc(config.counter, 'config.counter');
    assert.optionalFunc(config.timerFactory, 'config.timer');

    var counterFactory = config.counter || DefaultConfig.recorder.counter;
    this._counterFactory = function (recorder, name, value, tags) {
        return counterFactory(recorder, name, value, tags);
    };
    var timerFactory = config.timer || DefaultConfig.recorder.timer;
    this._timerFactory = function (recorder, name, tags) {
        return timerFactory(recorder, name, tags);
    };
    this._separator = config.separator || '/';
}

util.inherits(Recorder, EventEmitter);

module.exports = Recorder;

/// API

/**
 * Scope the recorder, i.e. every new timer/counter created will have its name
 * prefixed by the `newScope`.
 *
 * @param {String} [newScope] The name of the scope.
 * @returns {Object} the scoped recorder object.
 */
Recorder.prototype.scope = function scope(newScope) {
    var self = this;
    var prefix = newScope + self._separator;
    return {
        scope: function (newScope2) {
            return self.scope(prefix + newScope2);
        },
        timer: function (name) {
            return self.timer(prefix + name);
        },
        counter: function (name, initialValue) {
            return self.counter(prefix + name, initialValue);
        }
    };
};

/**
 * Create an timer.
 *
 * @param {String} [name] The name of the timer.
 * @param {Object} [tags] optional tags associated with the timer.
 * @returns {Object} the timer object.
 */
Recorder.prototype.timer = function timer(name, tags) {
    var self = this;

    return self._timerFactory(self, name, tags);
};

/**
 * Create a counter.
 *
 * @param {String} [name] The name of the counter.
 * @param {number} [initialValue] The initialValue of the counter.
 * @param {Object} [tags] optional tags associated with the counter.
 * @returns {Object} the counter.
 */
Recorder.prototype.counter = function counter(name, initialValue, tags) {
    var self = this;

    var value = initialValue || 0;
    var myCounter = self._counterFactory(self, name, value, tags);
    myCounter.incr(0); // force to emit an event at creation time
    return myCounter;
};
