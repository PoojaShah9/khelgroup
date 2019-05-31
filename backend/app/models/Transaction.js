'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let transactionCollectionSchema = new Schema({
    playerId: {
        type: String,
        default: '',
        // enables us to search the record faster
        index: true
    },
    transactionId: {
        type: String,
        default: '',
        unique: true
    },
    transactionAmount: {
        type: Number,
        default: ''
    },
    itemName: {
        type: String,
        default: ''
    },
    createdOn: {
        type: Date,
        default: ''
    }
}, { versionKey: false  })


mongoose.model('transaction', transactionCollectionSchema);
