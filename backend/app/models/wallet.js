'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let WalletCollectionSchema = new Schema({
    walletId: {
        type: String,
        default: '',
        index: true,
        unique: true
    },
    currencyType: {
        type: String,
        default: ''
    },
    currencyAmount: {
        type: Number,
        default: 0
    },
    playerId: {
        type: String,
        default: ''
    },
})


mongoose.model('Wallet', WalletCollectionSchema);
