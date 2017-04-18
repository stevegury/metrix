'use strict';

const util = require('util');
const EventEmitter = require('events');

const assert = require('assert-plus');

const DefaultConfig = require('./config/default.js');

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
    const config = _config || DefaultConfig.recorder;
    assert.object(config, 'config');
    assert.optionalFunc(config.counter, 'config.counter');
    assert.optionalFunc(config.timerFactory, 'config.timer');

    const counterFactory = config.counter || DefaultConfig.recorder.counter;
    this._counterFactory = function(recorder, name, value, tags) {
        return counterFactory(recorder, name, value, tags);
    };
    const timerFactory = config.timer || DefaultConfig.recorder.timer;
    this._timerFactory = function(recorder, name, tags) {
        return timerFactory(recorder, name, tags);
    };
    const histogramFactory = config.histogram ||
        DefaultConfig.recorder.histogram;
    this._histogramFactory = function(recorder, name, tags) {
        return histogramFactory(recorder, name, tags);
    };
    const gaugeFactory = config.gauge ||
        DefaultConfig.recorder.gauge;
    this._gaugeFactory = function(recorder, name, value, tags) {
        return gaugeFactory(recorder, name, value, tags);
    };
    this.separator = config.separator || '/';
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
    const self = this;
    const prefix = newScope + self.separator;
    return {
        scope: function(newScope2) {
            return self.scope(prefix + newScope2);
        },
        timer: function(name, tags) {
            return self.timer(prefix + name, tags);
        },
        counter: function(name, initialValue, tags) {
            return self.counter(prefix + name, initialValue, tags);
        },
        gauge: function(name, initialValue, tags) {
            return self.gauge(prefix + name, initialValue, tags);
        },
        histogram: function(name, tags) {
            return self.histogram(prefix + name, tags);
        },
        on: function(name, func) {
            return self.on(name, func);
        },
        separator: self.separator
    };
};

/**
 * Create a timer.
 *
 * @param {String} [name] The name of the timer.
 * @param {Object} [tags] optional tags associated with the timer.
 * @returns {Object} the timer object.
 */
Recorder.prototype.timer = function timer(name, tags) {
    const self = this;

    return self._timerFactory(self, name, tags);
};

/**
 * Create an histogram.
 *
 * @param {String} [name] The name of the histogram.
 * @param {Object} [tags] optional tags associated with the histogram.
 * @returns {Object} the histogram object.
 */
Recorder.prototype.histogram = function histogram(name, tags) {
    const self = this;

    return self._histogramFactory(self, name, tags);
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
    const self = this;

    const value = initialValue || 0;
    const myCounter = self._counterFactory(self, name, value, tags);

    if (initialValue) {
        myCounter.incr(initialValue); // force to emit an event
    }
    return myCounter;
};

/**
 * Create a Gauge, which translate to two counters.
 *
 * @param {String} [name] The name of the gauge.
 * @param {number} [initialValue] The initialValue of the gauge.
 * @param {Object} [tags] optional tags associated with the counter.
 * @returns {Object} the gauge.
 */
Recorder.prototype.gauge = function gauge(name, initialValue, tags) {
    const self = this;

    const value = initialValue || 0;
    const myGauge = self._gaugeFactory(self, name, value, tags);

    if (initialValue) {
        myGauge.update(initialValue);
    }
    return myGauge;
};
