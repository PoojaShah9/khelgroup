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
    // currencyType: {
    //     type: String,
    //     default: ''
    // },
    chips: {
        type: Number,
        default: 0
    },
    diamond: {
        type: Number,
        default: 0
    },
    playerId: {
        type: String,
        default: '',
        index: true
    },
    createdOn: {
        type: Date,
        default: ''
    }
}, { versionKey: false  })


mongoose.model('Wallet', WalletCollectionSchema);
