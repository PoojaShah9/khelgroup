'use strict'
/**
 * Module Dependencies
 */
const mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    Schema = mongoose.Schema,
    SALT_WORK_FACTOR = 10;

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
    },
}, { versionKey: false  })

playerSchema.pre('save', function (next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    // generate a salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
        if (err) return next(err);

        // hash the password using our new salt
        bcrypt.hash(user.password, salt, function (err, hash) {
            if (err) return next(err);

            // override the cleartext password with the hashed one
            user.password = hash;
            next();
        });
    });
});

playerSchema.methods.comparePassword = function (candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
        if (err) cb(err, null);
        cb(null, isMatch);
    });
};


mongoose.model('Player', playerSchema);
