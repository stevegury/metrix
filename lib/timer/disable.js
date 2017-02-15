'use strict';

/**
 * NullTimer, doesn't do anything.
 */
const NullTimer = {
    start: function nullStart() {
        return 0;
    },
    stop: function nullStop() {
        return;
    }
};

module.exports = NullTimer;
