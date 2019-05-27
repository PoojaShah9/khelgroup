'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

let playerSchema = new Schema({
    playerId: {
        type: String,
        default: '',
        // enables us to search the record faster
        index: true,
        unique: true
    },
    mobileNumber: {
        type: String,
        default: ''
    },
    otp: {
        type: Number,
        default: 0
    },
    coverPhoto: {
        type: String,
        default: ''
    },
    profileName: {
        type: String,
        default: ''
    },
    profilePhoto: {
        type: String,
        default: ''
    },
    bio: {
        type: String,
        default: ''
    },
    deviceId: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        default: ''
    },
    socialAccount: {
        type: String,
        default: ''
    },
    socialPicture: {
        type: String,
        default: ''
    },
    socialId: {
        type: String,
        default: ''
    },
    socialName: {
        type: String,
        default: ''
    },
    emailId: {
        type: String,
        default: ''
    },
    createdOn: {
        type: Date,
        default: ''
    }
})


mongoose.model('Player', playerSchema);
