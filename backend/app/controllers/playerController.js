const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')

var faker = require('faker');

/* Models */
const Player = mongoose.model('Player')


// get Player List function
let getPlayerList = (req, res) => {
    try {
        let skip = 0, limit = (req.query.pgSize) ? Number(req.query.pgSize) : 5;
        if (req.query.pg > 0) {
            skip = (limit) * (req.query.pg)
        }
        Player.find({}, {}, {skip: skip, limit: limit, sort: {createdOn: 1}}, function (err, data) {
            if (err) {
                const apiResponse = response.generate(true, err.message, 500, null);
                res.send(apiResponse);
            }
            else if(check.isEmpty(data)){
                // no Players found
                const apiResponse = response.generate(true,"No Players found",404,null);
                res.send(apiResponse);
            }
            else {
                Player.find().count(function (err, cnt) {
                    if (err) {
                        const apiResponse = response.generate(true, err.message, 500, null);
                        res.send(apiResponse);
                    }
                    let final = {};
                    final['totalRecords'] = cnt;
                    final['currentRecords'] = data.length;
                    final['results'] = data;
                    const finalres = response.generate(false, "Success", 200, final);
                    res.send(finalres);
                })
            }
        })
    } catch (e) {
        const apiResponse = response.generate(true, e.message, 500, null);
        res.send(apiResponse);
    }
}// end get Player List function

// filter player list function
let filterPlayerList = (req, res) => {
    try {
        let skip = 0, limit = (req.query.pgSize) ? Number(req.query.pgSize) : 5;
        if (req.query.pg > 0) {
            skip = (limit) * (req.query.pg)
        }
        let query = {};
        // query[req.body.field] = { $regex: '.*' + req.body.value + '.*' };
        const regex = { $regex: new RegExp("^" + req.body.value.toLowerCase(), "i") };
        query[req.body.field] =  { $regex: new RegExp("^" + req.body.value.toLowerCase(), "i") } ;
        Player.find(query, {}, {skip: skip, limit: limit, sort: {createdOn: 1}}, function (err, data) {
            if (err) {
                const apiResponse = response.generate(true, err.message, 500, null);
                res.send(apiResponse);
            }
            else if(check.isEmpty(data)){
                // no Players found
                const apiResponse = response.generate(true,"No Players found",404,null);
                res.send(apiResponse);
            }
            else {
                Player.find(query).count(function (err, cnt) {
                    if (err) {
                        const apiResponse = response.generate(true, err.message, 500, null);
                        res.send(apiResponse);
                    }
                    let final = {};
                    final['totalRecords'] = cnt;
                    final['currentRecords'] = data.length;
                    final['results'] = data;
                    const finalres = response.generate(false, "Success", 200, final);
                    res.send(finalres);
                })
            }
        })
    } catch (e) {
        const apiResponse = response.generate(true, e.message, 500, null);
        res.send(apiResponse);
    }
}// end filter Player List function

// create Player function
let createPlayer = (req, res) => {
    try {
        var myArray = ['Gold', 'Bronze', 'Silver', 'Platinum', 'Copper'];
        var rand = myArray[Math.floor(Math.random() * myArray.length)];
        let body = {
            mobileNumber: faker.phone.phoneNumberFormat(),
            profileName: faker.name.firstName(),
            deviceId: faker.random.number(),
            status: rand,
            otp: faker.random.number(),
            coverPhoto: faker.image.avatar(),
            profilePhoto: faker.image.avatar(),
            bio: faker.lorem.sentence(),
        };
        console.log('body', body);
        body['playerId'] = Math.floor(100000 + Math.random() * 900000);
        body['createdOn'] = new Date();
        Player.create(body, function (err, response) {
            if (err) {
                res.status(500).send(err);
            } else {
                res.status(200).send(response);
            }
        })
    } catch (e) {
        res.status(500).send(e);
    }
}// end create Player function

module.exports = {

    getPlayerList: getPlayerList,
    createPlayer: createPlayer,
    filterPlayerList: filterPlayerList,

}// end exports
