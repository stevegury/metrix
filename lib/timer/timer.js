'use strict';

var _ = require('lodash');
var assert = require('assert-plus');

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

    var buffer = {};
    var i = 0;
    var timerEvent = {
        name: name
    };

    if (tags) {
        _.assignIn(timerEvent, tags);
    }
    return {
        start: function (_tags) {
            if (tags) {
                var event = _.cloneDeep(timerEvent);
                event.startTs = Date.now();
                _.assignIn(event, _tags);
                i -= 1;
                buffer[i] = event;
                return i;
            } else {
                return Date.now();
            }
        },
        stop: function (id, _tags) {
            if (id < 0) {
                var taggedEvent = buffer[id];
                taggedEvent.stopTs = Date.now();
                _.assignIn(taggedEvent, _tags);
                recorder.emit('timer', taggedEvent);
                delete buffer[id];
            } else if (_tags) {
                var event = _.cloneDeep(timerEvent);
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
