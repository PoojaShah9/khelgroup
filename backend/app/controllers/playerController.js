const mongoose = require('mongoose');
const shortid = require('shortid');
const time = require('./../libs/timeLib');
const response = require('./../libs/responseLib')
const logger = require('./../libs/loggerLib');
const validateInput = require('../libs/paramsValidationLib')
const check = require('../libs/checkLib')
const tokenLib = require('../libs/tokenLib')

var faker = require('faker');

/* Models */
const Player = mongoose.model('Player')
const tokenCol = mongoose.model('tokenCollection')

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
        body['playerId'] = shortid.generate();
        body['createdOn'] = new Date();
        console.log('body', body);
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
}// end of create Player function

// player sign in
let playerSignIn = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.socialPicture && req.body.socialId && req.body.socialName && req.body.socialAccount) {
                if ((req.body.socialAccount).toLowerCase() === 'google') {
                    if (req.body.emailId) {
                        resolve(req);
                    } else {
                        let apiResponse = response.generate(true, "Email missing", 400, null);
                        reject(apiResponse);
                    }
                } else {
                    resolve(req);
                }
            } else {
                let apiResponse = response.generate(true, "socialPicture or socialId or socialName or socialAccount missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let findPlayer = () => {
        console.log("findUser");
        return new Promise((resolve, reject) => {
            Player.findOne({'socialId': req.body.socialAccount, "socialAccount": req.body.socialAccount})
                .exec((err, playerDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve user data", "userController => findUser()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve user data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Player found", "PlayerController => findPlayer()", 10);
                        resolve(playerDetails);
                    }
                });
        });

    }; // end of findUser

    let createPlayer = () => {
        console.log("createUser");
        return new Promise((resolve, reject) => {
            let body = req.body;
            body['playerId'] = shortid.generate();
            body['createdOn'] = new Date();
            Player.create(body, function (err, playerDetails) {
                if (err) {
                    console.log('err', err);
                    logger.error("Failed to create player", "playercontroller => createUser()", 5);
                    let apiResponse = response.generate(true, "Failed to create player", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Player Created", "playerController => createUser()", 10);
                    resolve(playerDetails);
                }
            });
        });
    };

    let validatingPassword = (retrieveUserDetails) => {
        console.log("validatingPassword");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrieveUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error("Login failed", "userController => validatingPassword()", 5);
                    let apiResponse = response.generate(true, "Login failed", 500, null);
                    reject(apiResponse);
                } else if (isMatch) {
                    let retrieveUserDetailsObj = retrieveUserDetails.toObject();
                    delete retrieveUserDetailsObj.password;
                    delete retrieveUserDetailsObj._id;
                    delete retrieveUserDetailsObj.__v;
                    delete retrieveUserDetailsObj.createdOn;
                    delete retrieveUserDetailsObj.modifiedOn;
                    resolve(retrieveUserDetailsObj);
                } else {
                    logger.error("Invalid password", "userController => validatingPassword()", 10);
                    let apiResponse = response.generate(true, "Invalid password", 400, null);
                    reject(apiResponse);
                }
            });
        });

    }; // end of validatingPassword

    let generateToken = (playerDetails) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(playerDetails, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "playerController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    tokenDetails.playerId = playerDetails.playerId;
                    tokenDetails.playerDetails = playerDetails;
                    resolve(tokenDetails);
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({playerId: tokenDetails.playerId}).exec((err, retrieveTokenDetails) => {
                if (err) {
                    let apiResponse = response.generate(true, "Failed to save token", 500, null);
                    reject(apiResponse);
                }
                // user is logging for the first time
                else if (check.isEmpty(retrieveTokenDetails)) {
                    let newAuthToken = new tokenCol({
                        playerId: tokenDetails.playerId,
                        authToken: tokenDetails.token,
                        // we are storing this is due to we might change this from 15 days
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    });

                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
                // user has already logged in need to update the token
                else {
                    retrieveTokenDetails.authToken = tokenDetails.token;
                    retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                    retrieveTokenDetails.tokenGenerationTime = time.now();
                    retrieveTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
            });
        });

    }; // end of saveToken

    validatingInputs(req, res)
        .then(createPlayer)
        /*.then((player) => {
            if (check.isEmpty(player)) {
                createPlayer()
            }
        })*/
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Login successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
}// end of player sign in function

// player sign in
let guestPlayerSignIn = (req, res) => {

    let createUser = () => {
        console.log("createUser");
        return new Promise((resolve, reject) => {
            let body = {};
            body['playerId'] = shortid.generate();
            body['createdOn'] = new Date();
            Player.create(body, function (err, playerDetails) {
                if (err) {
                    console.log('err', err);
                    logger.error("Failed to create player", "playercontroller => createUser()", 5);
                    let apiResponse = response.generate(true, "Failed to create player", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Guest Player Created", "playerController => createUser()", 10);
                    resolve(playerDetails);
                }
            });
        });
    };

    let generateToken = (playerDetails) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(playerDetails, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "playerController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    tokenDetails.playerId = playerDetails.playerId;
                    tokenDetails.playerDetails = playerDetails;
                    resolve(tokenDetails);
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({playerId: tokenDetails.playerId}).exec((err, retrieveTokenDetails) => {
                if (err) {
                    let apiResponse = response.generate(true, "Failed to save token", 500, null);
                    reject(apiResponse);
                }
                // user is logging for the first time
                else if (check.isEmpty(retrieveTokenDetails)) {
                    let newAuthToken = new tokenCol({
                        playerId: tokenDetails.playerId,
                        authToken: tokenDetails.token,
                        // we are storing this is due to we might change this from 15 days
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    });

                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
                // user has already logged in need to update the token
                else {
                    retrieveTokenDetails.authToken = tokenDetails.token;
                    retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                    retrieveTokenDetails.tokenGenerationTime = time.now();
                    retrieveTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
            });
        });

    }; // end of saveToken

    createUser(req, res)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Login successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
}// end of player sign in function

// update Player
let updatePlayer = (req, res) => {
    // console.log('token',req.headers.authorization)
    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId && req.headers.authorization) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or Authorization Token missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let verifyToken = () => {
        console.log("verifyToken");
        return new Promise((resolve, reject) => {
            tokenLib.verifyClaims(req.headers.authorization, (err, playerDetails) => {
                if (err) {
                    logger.error("Failed to verify token", "playerController => verifyToken()", 10);
                    let apiResponse = response.generate(true, "Failed to verify token", 500, null);
                    reject(apiResponse);
                } else {
                    resolve(playerDetails.data);
                }
            });
        });
    }; // end of generateToken

    let matchPlayer = (playerDetails) => {
        console.log("validatingInputs", playerDetails);
        return new Promise((resolve, reject) => {
            if (req.body.playerId === playerDetails.playerId) {
                resolve(playerDetails);
            } else {
                let apiResponse = response.generate(true, "Enter playerId is invalid", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let updatePlayer = (playerDetails) => {
        console.log("updatePlayer");
        return new Promise((resolve, reject) => {
            Player.findByIdAndUpdate(playerDetails._id, req.body, {new: true}, function (err, player) {
                if (err) {
                    let apiResponse = response.generate(true, "Error in update player", 400, null);
                    reject(apiResponse);
                } else {
                    resolve(player);

                }
            })

        });
    }

    let generateToken = (player) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(player, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "playerController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    tokenDetails.playerId = player.playerId;
                    tokenDetails.playerDetails = player;
                    resolve(tokenDetails);
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({playerId: tokenDetails.playerId}).exec((err, retrieveTokenDetails) => {
                if (err) {
                    let apiResponse = response.generate(true, "Failed to save token", 500, null);
                    reject(apiResponse);
                }
                // user is logging for the first time
                else if (check.isEmpty(retrieveTokenDetails)) {
                    let newAuthToken = new tokenCol({
                        playerId: tokenDetails.playerId,
                        authToken: tokenDetails.token,
                        // we are storing this is due to we might change this from 15 days
                        tokenSecret: tokenDetails.tokenSecret,
                        tokenGenerationTime: time.now()
                    });

                    newAuthToken.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
                // user has already logged in need to update the token
                else {
                    retrieveTokenDetails.authToken = tokenDetails.token;
                    retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                    retrieveTokenDetails.tokenGenerationTime = time.now();
                    retrieveTokenDetails.save((err, newTokenDetails) => {
                        if (err) {
                            let apiResponse = response.generate(true, "Failed to save token", 500, null);
                            reject(apiResponse);
                        } else {
                            let responseBody = {
                                authToken: newTokenDetails.authToken,
                                playerDetails: tokenDetails.playerDetails
                            };
                            resolve(responseBody);
                        }
                    });
                }
            });
        });

    }; // end of saveToken

    validatingInputs()
        .then(verifyToken)
        .then(matchPlayer)
        .then(updatePlayer)
        .then(generateToken)
        .then(saveToken)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Update successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
}// end of update Player in function

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
            } else if (check.isEmpty(data)) {
                // no Players found
                const apiResponse = response.generate(true, "No Players found", 404, null);
                res.send(apiResponse);
            } else {
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
}// end of get Player List function

// filter player list function
let filterPlayerList = (req, res) => {
    try {
        let skip = 0, limit = (req.query.pgSize) ? Number(req.query.pgSize) : 5;
        if (req.query.pg > 0) {
            skip = (limit) * (req.query.pg)
        }
        let query = {};
        // query[req.body.field] = { $regex: '.*' + req.body.value + '.*' };
        const regex = {$regex: new RegExp("^" + req.body.value.toLowerCase(), "i")};
        query[req.body.field] = {$regex: new RegExp("^" + req.body.value.toLowerCase(), "i")};
        Player.find(query, {}, {skip: skip, limit: limit, sort: {createdOn: 1}}, function (err, data) {
            if (err) {
                const apiResponse = response.generate(true, err.message, 500, null);
                res.send(apiResponse);
            } else if (check.isEmpty(data)) {
                // no Players found
                const apiResponse = response.generate(true, "No Players found", 404, null);
                res.send(apiResponse);
            } else {
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
}// end of filter Player List function


module.exports = {

    getPlayerList: getPlayerList,
    createPlayer: createPlayer,
    filterPlayerList: filterPlayerList,
    playerSignIn: playerSignIn,
    guestPlayerSignIn: guestPlayerSignIn,
    updatePlayer: updatePlayer,

}// end exports
