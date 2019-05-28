'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let PlayerHistoryCollectionSchema = new Schema({
    gamesPlayed: {
        type: Number,
        default: 0
    },
    currencyWon: {
        type: Number,
        default: 0
    },
    playerId: {
        type: String,
        default: ''
    },
}, { versionKey: false  })


mongoose.model('PlayerHistory', PlayerHistoryCollectionSchema);
