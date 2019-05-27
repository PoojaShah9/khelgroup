'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let tokenCollectionSchema = new Schema({
    playerId: {
        type: String,
        default: '',
        // enables us to search the record faster
        index: true,
        unique: true
    },
    authToken: {
        type: String,
        default: ''
    },
    tokenSecret: {
        type: String,
        default: ''
    },
    tokenGenerationTime: {
        type: String,
        default: ''
    }
})


mongoose.model('tokenCollection', tokenCollectionSchema);
