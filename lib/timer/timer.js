'use strict';

const _ = require('lodash');
const assert = require('assert-plus');

/**
 * Factory of the default timer.
 *
 * @param {Object} recorder Recorder the aggregator listen to.
 * @param {String} name Name of the timer.
 * @param {Object} tags optional tags associated with the timer.
 * @returns {Object} Timer object
 */
module.exports = function makeTimer(recorder, name, tags) {
    assert.object(recorder, 'recorder');
    assert.string(name, 'name');
    assert.optionalObject(tags);

    const timerEvent = {
        name: name
    };

    if (tags) {
        _.assignIn(timerEvent, tags);
    }
    return {
        start: function() {
            return Date.now();
        },
        stop: function(id, _tags) {
            if (!id) {
                throw new Error('timer.stop: no id provided');
            }

            if (_tags) {
                const event = _.cloneDeep(timerEvent);
                event.startTs = id;
                event.stopTs = Date.now();
                _.assignIn(event, _tags);
                recorder.emit('timer', event);
            } else {
                timerEvent.startTs = id;
                timerEvent.stopTs = Date.now();
                recorder.emit('timer', timerEvent);
            }
        }
    };
};
