'use strict';

/**
 * NullTimer, doesn't do anything.
 */
var NullTimer = {
    start: function nullStart() {
        return 0;
    },
    stop: function nullStop() {
        return;
    }
};

module.exports = NullTimer;
