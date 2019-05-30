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
    chipsWon: {
        type: Number,
        default: 0
    },
    playerId: {
        type: String,
        default: '',
        index: true,
    },
}, { versionKey: false  })


mongoose.model('PlayerHistory', PlayerHistoryCollectionSchema);
