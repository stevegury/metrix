'use strict';

var assert = require('assert-plus');

/**
 * Factory of a precise counter.
 * This precise counter, also capture the timestamp of the increment.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the counter.
 * @param {Number} initialValue initial value of the counter.
 * @param {Object} tags optional tags associated with the counter.
 * @returns {Object} Counter object
 */
module.exports = function makeCounter(recorder, name, initialValue) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');
    assert.optionalNumber(initialValue, 'initialValue');

    var counterEvent = {
        name: name,
        timestamp: Date.now(),
        value: initialValue
    };
    return {
        incr: function (n) {
            var increment = n || 1;

            if (n === 0) {
                increment = 0;
            }
            counterEvent.value += increment;
            counterEvent.timestamp = Date.now();
            recorder.emit('counter', counterEvent);
        },
        decr: function (n) {
            this.incr(-(n || 1));
        }
    };
};
