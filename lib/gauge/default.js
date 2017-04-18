'use strict';

const assert = require('assert-plus');

/**
 * Factory of the default gauge.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the gauge.
 * @param {Number} initialValue initial value of the gauge.
 * @param {Object} tags optional tags associated with the gauge.
 * @returns {Object} Gauge object
 */
module.exports = function makeGauge(recorder, name, initialValue, tags) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');
    assert.optionalNumber(initialValue, 'initialValue');
    assert.optionalObject(tags, 'tags');

    let gaugeEvent = {
        name: name
    };

    if (tags) {
        gaugeEvent.tags = tags;
    }

    const gauge = {
        update: function(n) {
            gaugeEvent.value = n || 0;
            recorder.emit('gauge', gaugeEvent);
        }
    };

    return gauge;
};
