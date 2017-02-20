'use strict';

const assert = require('assert-plus');

/**
 * Factory of the default histogram.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the Histogram.
 * @param {Object} tags optional tags associated with the counter.
 * @returns {Object} Histogram object
 */
module.exports = function makeHistogram(recorder, name, tags) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');
    assert.optionalObject(tags, 'tags');

    let histogramEvent = {
        name: name
    };

    if (tags) {
        histogramEvent.tags = tags;
    }
    return {
        add: function (n) {
            histogramEvent.value = n || 0;
            recorder.emit('histogram', histogramEvent);
        }
    };
};
