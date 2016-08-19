'use strict';

var assert = require('assert-plus');

/**
 * Factory of the default counter.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the counter.
 * @param {Number} initialValue initial value of the counter.
 * @param {Object} tags optional tags associated with the counter.
 * @returns {Object} Counter object
 */
module.exports = function makeCounter(recorder, name, initialValue, tags) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');
    assert.optionalNumber(initialValue, 'initialValue');
    assert.optionalObject(tags, 'tags');

    var counterEvent = {
        name: name,
        value: initialValue || 0
    };

    if (tags) {
        counterEvent.tags = tags;
    }
    return {
        incr: function (n) {
            var increment = n || 1;

            if (n === 0) {
                increment = 0;
            }
            counterEvent.value += increment;
            recorder.emit('counter', counterEvent);
        },
        decr: function (n) {
            this.incr(-(n || 1));
        }
    };
};
