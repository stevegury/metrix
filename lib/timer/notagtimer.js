'use strict';

const assert = require('assert-plus');

/**
 * Factory of timers that drop tags.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the timer.
 * @param {Object} tags optional tags are dropped by this timer.
 * @returns {Object} Timer object
 */
module.exports = function makeTimer(recorder, name, tags) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');

    const timerEvent = {
        name: name
    };

    return {
        start: function(_tags) {
            return Date.now();
        },
        stop: function(id, _tags) {
            timerEvent.startTs = id;
            timerEvent.stopTs = Date.now();
            recorder.emit('timer', timerEvent);
        }
    };
};
