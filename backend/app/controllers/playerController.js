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
const Player = mongoose.model('Player');
const tokenCol = mongoose.model('tokenCollection');
const Wallet = mongoose.model('Wallet');
const PH = mongoose.model('PlayerHistory');
const Transaction = mongoose.model('transaction');

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
} // end of create Player function

// get Player List function
let getPlayerList = (req, res) => {

    let getSizeLimit = () => {
        console.log("getSizeLimit");
        return new Promise((resolve, reject) => {
            let skip = 0, limit = (req.query.pgSize) ? Number(req.query.pgSize) : 5;
            if (req.query.pg > 0) {
                skip = (limit) * (req.query.pg)
            }
            let data = {}
            data['skip'] = skip;
            data['limit'] = limit;
            resolve(data)
        });
    } // end of getSizeLimit function

    let findPlayers = (data) => {
        console.log("findPlayers");
        return new Promise((resolve, reject) => {
            Player.find({}, {}, {
                skip: data.skip,
                limit: data.limit,
                sort: {createdOn: 1}
            })
                .select('-__v -_id')
                .exec((err, playersDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve players", "playerController => findPlayers()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve players", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playersDetails)) {
                        logger.error("No players found", "playerController => findPlayers()", 5);
                        let apiResponse = response.generate(true, "No players found", 500, null);
                        reject(apiResponse);
                    } else {
                        /*let final = [];
                        playersDetails.forEach((item) => {
                            let finalObject = item.toObject();
                            delete finalObject._id;
                            delete finalObject.__v;
                            final.push(finalObject)
                        })*/
                        resolve(playersDetails);
                    }
                });
        });
    } // end of findPlayers Functions

    let findWallet = (playersDetails) => {
        console.log("findWallet");
        return new Promise((resolve, reject) => {
            let query = {};
            let id = [];
            playersDetails.filter((x) => {
                id.push(x.playerId);
            })
            query = {playerId: {$in: id}}
            Wallet.find(query, {}, {})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve Wallet", "playerController => getWalletWithId()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve Wallet", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("No wallet found", "playerController => getWalletWithId()", 5);
                        let apiResponse = response.generate(true, "No wallet found", 500, null);
                        reject(apiResponse);
                    } else {

                        let final = [];
                        playersDetails.forEach((x) => {
                            x = x.toObject();
                            x['chips'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].chips;
                            x['diamond'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].diamond;
                            final.push(x);
                        })
                        let res = {
                            results: final
                        }
                        resolve(res);
                    }
                });
        });
    } // end of find wallet function

    let totalPlayers = (final) => {
        console.log("totalPlayers");
        return new Promise((resolve, reject) => {
            Player.find().count(function (err, cnt) {
                if (err) {
                    logger.error("Failed to retrieve payers", "playerController => totalPlayers()", 5);
                    let apiResponse = response.generate(true, "Failed to retrieve payers", 500, null);
                    reject(apiResponse);
                } else {
                    final['totalRecords'] = cnt;
                    resolve(final);
                }
            });
        });
    } // end of total Players function

    getSizeLimit()
        .then(findPlayers)
        .then(findWallet)
        .then(totalPlayers)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Get Player List Successfully!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of get Player List function

// filter player list function
let filterPlayerList = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.field && req.body.value) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "field or value missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let getSizeLimit = () => {
        console.log("getSizeLimit");
        return new Promise((resolve, reject) => {
            let skip = 0, limit = (req.query.pgSize) ? Number(req.query.pgSize) : 5;
            if (req.query.pg > 0) {
                skip = (limit) * (req.query.pg)
            }
            let data = {}
            data['skip'] = skip;
            data['limit'] = limit;
            resolve(data)
        });
    } // end of getSizeLimit function

    let getTotalWalletCount = (final) => {
        console.log("getTotalWalletCount");
        return new Promise((resolve, reject) => {
            let query = {};
            query[req.body.field] = req.body.value;
            Wallet.find(query, {}, {}).count(function (err, cnt) {
                if (err) {
                    logger.error("Failed to retrieve wallet", "playerController => getTotalWalletCount()", 5);
                    let apiResponse = response.generate(true, "Failed to retrieve wallet", 500, null);
                    reject(apiResponse);
                } else {
                    final['totalRecords'] = cnt
                    resolve(final)
                }
            })
        });
    } // end of getTotalWalletCount function

    let getTotalPlayerCount = (final) => {
        console.log("getTotalPlayerCount");
        return new Promise((resolve, reject) => {
            let query = {};
            query[req.body.field] = {$regex: new RegExp("^" + req.body.value.toLowerCase(), "i")};
            Player.find(query, {}, {}).count(function (err, cnt) {
                if (err) {
                    logger.error("Failed to retrieve Player", "playerController => getTotalPlayerCount()", 5);
                    let apiResponse = response.generate(true, "Failed to retrieve Player", 500, null);
                    reject(apiResponse);
                } else {
                    final['totalRecords'] = cnt
                    resolve(final)
                }
            })
        });
    } // end of getTotalPlayerCount function

    let getPlayers = (data) => {
        console.log("getPlayers");
        return new Promise((resolve, reject) => {
            let query = {};
            query[req.body.field] = {$regex: new RegExp("^" + req.body.value.toLowerCase(), "i")};
            Player.find(query, {}, {
                skip: data.skip,
                limit: data.limit,
                sort: {createdOn: 1}
            })
                .select('-__v -_id')
                .exec((err, playersDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve players", "playerController => getPlayers()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve players", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playersDetails)) {
                        logger.error("No players found", "playerController => getPlayers()", 5);
                        let apiResponse = response.generate(true, "No players found", 500, null);
                        reject(apiResponse);
                    } else {
                        /*let final = [];
                        playersDetails.forEach((item) => {
                            let finalObject = item.toObject();
                            delete finalObject._id;
                            delete finalObject.__v;
                            final.push(finalObject)
                        })*/
                        resolve(playersDetails);
                    }
                });
        });
    } // end of getPlayers function

    let getWalletWithId = (playersDetails) => {
        console.log("getWalletWithId");
        return new Promise((resolve, reject) => {
            let query = {};
            let id = [];
            playersDetails.filter((x) => {
                id.push(x.playerId);
            })
            query = {playerId: {$in: id}}
            Wallet.find(query, {}, {})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve Wallet", "playerController => getWalletWithId()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve Wallet", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("No wallet found", "playerController => getWalletWithId()", 5);
                        let apiResponse = response.generate(true, "No wallet found", 500, null);
                        reject(apiResponse);
                    } else {
                        let final = [];
                        playersDetails.forEach((x) => {
                            x = x.toObject();
                            x['chips'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].chips;
                            x['diamond'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].diamond;
                            final.push(x);
                        })
                        let res = {
                            results: final
                        }
                        resolve(res);
                    }
                });
        })
    } // end of getWalletWithId function

    let getWallet = (data) => {
        console.log("getWallet");
        return new Promise((resolve, reject) => {
            let query = {}
            query[req.body.field] = req.body.value
            Wallet.find(query, {}, {
                skip: data.skip,
                limit: data.limit,
                sort: {createdOn: 1}
            })
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve Wallet", "playerController => getWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve Wallet", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("No Wallet found", "playerController => getWallet()", 5);
                        let apiResponse = response.generate(true, "No Wallet found", 500, null);
                        reject(apiResponse);
                    } else {
                        /*  let final = [];
                          walletDetails.forEach((item) => {
                              let finalObject = item.toObject();
                              delete finalObject._id;
                              delete finalObject.__v;
                              final.push(finalObject)
                          })*/
                        resolve(walletDetails);
                    }
                });
        });
    } // end of getWallet function

    let getPlayerWithId = (walletDetails) => {
        console.log("getPlayerWithId");
        return new Promise((resolve, reject) => {
            let query = {};
            let id = [];
            walletDetails.filter((x) => {
                id.push(x.playerId);
            })
            query = {playerId: {$in: id}}
            Player.find(query, {}, {})
                .select('-__v -_id')
                .exec((err, playersDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player", "playerController => getPlayerWithId()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playersDetails)) {
                        logger.error("No player found", "playerController => getPlayerWithId()", 5);
                        let apiResponse = response.generate(true, "No player found", 500, null);
                        reject(apiResponse);
                    } else {
                        let final = [];
                        playersDetails.forEach((x) => {
                            x = x.toObject();
                            x['chips'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].chips;
                            x['diamond'] = walletDetails.filter((y) => y.playerId === x.playerId)[0].diamond;
                            final.push(x);
                        })
                        let res = {
                            results: final
                        }
                        resolve(res);
                    }
                });
        });
    } // end of getPlayerWithId function

    let filter = (data) => {
        console.log("findPlayers");
        return new Promise((resolve, reject) => {
            let field = ['playerId', 'mobileNumber', 'profileName', 'deviceId', 'status'];
            let query = {};
            if (field.indexOf(req.body.field) !== -1) {

                getPlayers(data)
                    .then(getWalletWithId)
                    .then(getTotalPlayerCount)
                    .then((final) => {
                        resolve(final);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err);
                        res.status(err.status);
                    });
            } else {
                getWallet(data)
                    .then(getPlayerWithId)
                    .then(getTotalWalletCount)
                    .then((final) => {
                        resolve(final);
                    })
                    .catch((err) => {
                        console.log(err);
                        res.send(err);
                        res.status(err.status);
                    });
            }
        });
    } // end of filter Functions

    validatingInputs()
        .then(getSizeLimit)
        .then(filter)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Get Filter Player List Successfully!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of filter Player List function

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
        console.log("findPlayer");
        return new Promise((resolve, reject) => {
            Player.findOne({'socialId': req.body.socialId, "socialAccount": (req.body.socialAccount).toLowerCase()})
                .select('-__v -_id')
                .exec((err, playerDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Player found", "PlayerController => findPlayer()", 10);
                        resolve(playerDetails);
                    }
                });
        });

    }; // end of findUser

    let createPlayer = (playerDetails) => {
        console.log("createUser");
        return new Promise((resolve, reject) => {
            if (check.isEmpty(playerDetails)) {
                logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                let body = {};
                body['socialPicture'] = req.body.socialPicture;
                body['socialId'] = req.body.socialId;
                body['socialName'] = req.body.socialName;
                body['socialAccount'] = (req.body.socialAccount).toLowerCase();
                body['emailId'] = req.body.emailId;
                body['playerId'] = shortid.generate();
                body['createdOn'] = new Date();
                Player.create(body, function (err, newplayerDetails) {
                    if (err) {
                        logger.error("Failed to create player", "playercontroller => createPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to create player", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("player created", "playerController => createPlayer()", 10);
                        resolve(newplayerDetails);
                    }
                });
            } else {
                resolve(playerDetails);
            }
        })
    }; // end of createPlayer

    let createWallet = (playerDetails) => {
        console.log("createWallet");
        return new Promise((resolve, reject) => {
            Wallet.findOne({playerId: playerDetails.playerId})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        let body = {};
                        body['walletId'] = shortid.generate();
                        body['diamond'] = 10;
                        body['chips'] = 1000;
                        body['playerId'] = playerDetails.playerId;
                        body['createdOn'] = new Date();
                        Wallet.create(body, function (err, walletDetails) {
                            if (err) {
                                logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                                let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                                reject(apiResponse);
                            } else {
                                logger.info("Wallet created for  Player", "playerController => createWallet()", 10);
                                Player.findOne({playerId: playerDetails.playerId})
                                    .select('-__v -_id')
                                    .exec((err, playerDetails) => {
                                        if (err) {
                                            logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                                            let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                                            reject(apiResponse);
                                        } else {
                                            let finalObject = playerDetails.toObject();
                                            resolve(finalObject);
                                        }
                                    })
                            }
                        });
                    } else {
                        logger.info("Wallet of Player found", "playerController => createWallet()", 10);
                        Player.findOne({playerId: playerDetails.playerId})
                            .select('-__v -_id')
                            .exec((err, playerDetails) => {
                                if (err) {
                                    logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                                    let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                                    reject(apiResponse);
                                } else {
                                    let finalObject = playerDetails.toObject();
                                    resolve(finalObject);
                                }
                            })
                    }
                })
        });
    }; // end of createWallet

    let validatingPassword = (retrieveUserDetails) => {
        console.log("validatingPassword");
        return new Promise((resolve, reject) => {
            passwordLib.comparePassword(req.body.password, retrieveUserDetails.password, (err, isMatch) => {
                if (err) {
                    logger.error("Login failed", "playerController => validatingPassword()", 5);
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
                    logger.error("Invalid password", "playerController => validatingPassword()", 10);
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
            tokenCol.findOne({playerId: tokenDetails.playerId})
                .exec((err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // player is logging for the first time
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
                    // player has already logged in need to update the token
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
        .then(findPlayer)
        .then(createPlayer)
        .then(createWallet)
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
} // end of player sign in function

// player sign in
let guestPlayerSignIn = (req, res) => {

    let createPlayer = () => {
        console.log("createPlayer");
        return new Promise((resolve, reject) => {
            let body = {};
            body['playerId'] = shortid.generate();
            body['createdOn'] = new Date();
            Player.create(body, function (err, playerDetails) {
                if (err) {
                    logger.error("Failed to create player", "playercontroller => createUser()", 5);
                    let apiResponse = response.generate(true, "Failed to create player", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Guest Player Created", "playerController => createUser()", 10);
                    resolve(playerDetails);
                }
            });
        });
    }; // end of createPlayer

    let createWallet = (playerDetails) => {
        console.log("createWallet");
        return new Promise((resolve, reject) => {
            let body = {};
            body['walletId'] = shortid.generate();
            body['diamond'] = 5;
            body['chips'] = 500;
            body['playerId'] = playerDetails.playerId;
            body['createdOn'] = new Date();
            Wallet.create(body, function (err, walletDetails) {
                if (err) {
                    logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                    let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Wallet created for Guest Player", "playerController => createWallet()", 10);
                    Player.findOne({playerId: playerDetails.playerId})
                        .select('-__v -_id')
                        .exec((err, playerDetails) => {
                            if (err) {
                                logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                                let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                                reject(apiResponse);
                            } else {
                                let finalObject = playerDetails.toObject();
                                resolve(finalObject);
                            }
                        })

                }
            });
        });
    }; // end of createWallet

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
            tokenCol.findOne({playerId: tokenDetails.playerId})
                .exec((err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // player is logging for the first time
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
                    // player has already logged in need to update the token
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

    createPlayer(req, res)
        .then(createWallet)
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
} // end of player sign in function

// update Player
let updatePlayer = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId missing", 400, null);
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
    }; // end of verifyToken

    let findPlayer = () => {
        console.log("findPlayer");
        return new Promise((resolve, reject) => {
            Player.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, playerDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playerDetails)) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Player found", "PlayerController => findPlayer()", 10);
                        resolve(playerDetails);
                    }
                });
        });

    }; // end of findUser

    let matchPlayer = (playerDetails) => {
        console.log("matchPlayer");
        return new Promise((resolve, reject) => {
            if (req.body.playerId === playerDetails.playerId) {
                resolve(playerDetails);
            } else {
                let apiResponse = response.generate(true, "Enter playerId is invalid", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of matchPlayer

    let updatePlayer = (playerDetails) => {
        console.log("updatePlayer");
        return new Promise((resolve, reject) => {
            let body = {};
            body['mobileNumber'] = req.body.mobileNumber;
            body['profilePhoto'] = req.body.profilePhoto;
            body['profileName'] = req.body.profileName;
            Player.findOneAndUpdate({playerId: playerDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, player) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in update player", 400, null);
                        reject(apiResponse);
                    } else {
                        resolve(player);

                    }
                })

        });
    } // end of updatePlayer

    let generateToken = (player) => {
        console.log("generateToken");
        return new Promise((resolve, reject) => {
            tokenLib.generateToken(player, (err, tokenDetails) => {
                if (err) {
                    logger.error("Failed to generate token", "playerController => generateToken()", 10);
                    let apiResponse = response.generate(true, "Failed to generate token", 500, null);
                    reject(apiResponse);
                } else {
                    let finalObject = player.toObject()
                    delete finalObject._id;
                    delete finalObject.__v;
                    tokenDetails.playerId = player.playerId;
                    tokenDetails.playerDetails = finalObject;
                    resolve(tokenDetails);
                }
            });
        });
    }; // end of generateToken

    let saveToken = (tokenDetails) => {
        console.log("saveToken");
        return new Promise((resolve, reject) => {
            tokenCol.findOne({playerId: tokenDetails.playerId})
                .exec((err, retrieveTokenDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Failed to save token", 500, null);
                        reject(apiResponse);
                    }
                    // player is logging for the first time
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
                    // player has already logged in need to update the token
                    else {
                        retrieveTokenDetails.authToken = tokenDetails.token;
                        retrieveTokenDetails.tokenSecret = tokenDetails.tokenSecret;
                        retrieveTokenDetails.tokenGenerationTime = time.now();
                        retrieveTokenDetails.save((err, newTokenDetails) => {
                            if (err) {
                                let apiResponse = response.generate(true, "Failed to save token", 500, null);
                                reject(apiResponse);
                            } else {
                                delete tokenDetails._id;
                                delete tokenDetails.__v;
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
        .then(findPlayer)
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
} // end of update Player in function

// join Game
let joinGame = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId && req.body.chips) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or chips missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let verifyToken = () => {
        console.log("verifyToken");
        return new Promise((resolve, reject) => {
            tokenLib.verifyClaims(req.headers.authtoken, (err, playerDetails) => {
                if (err) {
                    logger.error("Failed to verify token", "playerController => verifyToken()", 10);
                    let apiResponse = response.generate(true, "Failed to verify token", 500, null);
                    reject(apiResponse);
                } else {
                    resolve(playerDetails.data);
                }
            });
        });
    }; // end of verifyToken

    let matchPlayer = (playerDetails) => {
        console.log("matchPlayer");
        return new Promise((resolve, reject) => {
            if (req.body.playerId === playerDetails.playerId) {
                resolve(playerDetails);
            } else {
                let apiResponse = response.generate(true, "Enter playerId is invalid", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of matchPlayer

    let findPlayer = () => {
        console.log("findPlayer");
        return new Promise((resolve, reject) => {
            Player.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, playerDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playerDetails)) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Player found", "PlayerController => findPlayer()", 10);
                        resolve(playerDetails);
                    }
                });
        });

    }; // end of findUser

    let findWallet = () => {
        console.log("findWallet");
        return new Promise((resolve, reject) => {
            Wallet.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("wallet found", "PlayerController => findWallet()", 10);
                        resolve(walletDetails);
                    }
                });
        });

    }; // end of findWallet

    let deduction = (walletDetails) => {
        console.log("deduction");
        return new Promise((resolve, reject) => {
            if (req.body.chips <= walletDetails.chips) {
                resolve(walletDetails);
            } else {
                let apiResponse = response.generate(true, "Insufficient chips", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of deduction

    let updateWallet = (walletDetails) => {
        console.log("updatePlayer");
        return new Promise((resolve, reject) => {
            let body = {};
            body['chips'] = Number(walletDetails.chips) - Number(req.body.chips);
            Wallet.findOneAndUpdate({playerId: walletDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, newwalletDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in update wallet", 400, null);
                        reject(apiResponse);
                    } else {
                        logger.info("find and update wallet", "PlayerController => updateWallet()", 10);
                        resolve(newwalletDetails);

                    }
                })

        });
    } // end of updateWallet

    let createPlayerHistory = (walletDetails) => {
        console.log("createPlayerHistory");
        return new Promise((resolve, reject) => {
            PH.findOne({playerId: walletDetails.playerId})
                .select('-__v -_id')
                .exec((err, phDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in find player history", 400, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(phDetails)) {
                        let body = {};
                        body['gamesPlayed'] = 0;
                        body['currencyWon'] = 0;
                        body['playerId'] = walletDetails.playerId;
                        body['createdOn'] = new Date();
                        PH.create(body, function (err, newPHdetails) {
                            if (err) {
                                let apiResponse = response.generate(true, "Error in find player history", 400, null);
                                reject(apiResponse);
                            } else {
                                resolve(newPHdetails);
                            }
                        })
                    } else {
                        resolve(phDetails);
                    }
                })

        });
    } // end of createPlayerHistory

    let updatePlayerHistory = (phDetails) => {
        console.log("updatePlayerHistory");
        return new Promise((resolve, reject) => {
            let body = {}
            body['gamesPlayed'] = phDetails.gamesPlayed + 1;
            PH.findOneAndUpdate({playerId: phDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, newphDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in update player history", 400, null);
                        reject(apiResponse);
                    } else {
                        Wallet.findOne({playerId: newphDetails.playerId})
                            .select('-__v -_id')
                            .exec((err, WalletDetails) => {
                                if (err) {
                                    let apiResponse = response.generate(true, "Error in find player wallet", 400, null);
                                    reject(apiResponse);
                                } else {
                                    logger.info("wallet found", "PlayerController => updatePlayerHistory()", 10);
                                    let finalObject = WalletDetails.toObject();
                                    resolve(finalObject);
                                }
                            })
                    }
                })

        });
    } // end of createPlayerHistory

    validatingInputs()
        .then(verifyToken)
        .then(matchPlayer)
        .then(findPlayer)
        .then(findWallet)
        .then(deduction)
        .then(updateWallet)
        .then(createPlayerHistory)
        .then(updatePlayerHistory)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Join Game successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of join Game in function

// won Game
let wonGame = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId && req.body.chips) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or chips missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let verifyToken = () => {
        console.log("verifyToken");
        return new Promise((resolve, reject) => {
            tokenLib.verifyClaims(req.headers.authtoken, (err, playerDetails) => {
                if (err) {
                    logger.error("Failed to verify token", "playerController => verifyToken()", 10);
                    let apiResponse = response.generate(true, "Failed to verify token", 500, null);
                    reject(apiResponse);
                } else {
                    resolve(playerDetails.data);
                }
            });
        });
    }; // end of verifyToken

    let matchPlayer = (playerDetails) => {
        console.log("matchPlayer");
        return new Promise((resolve, reject) => {
            if (req.body.playerId === playerDetails.playerId) {
                resolve(playerDetails);
            } else {
                let apiResponse = response.generate(true, "Enter playerId is invalid", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of matchPlayer

    let findPlayer = () => {
        console.log("findPlayer");
        return new Promise((resolve, reject) => {
            Player.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, playerDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(playerDetails)) {
                        logger.error("Failed to retrieve player data", "playerController => findPlayer()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Player found", "PlayerController => findPlayer()", 10);
                        resolve(playerDetails);
                    }
                });
        });

    }; // end of findUser

    let findPH = () => {
        console.log("findPH");
        return new Promise((resolve, reject) => {
            PH.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, phDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve player history data", "playerController => findPH()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player history data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(phDetails)) {
                        logger.error("Failed to retrieve player history data", "playerController => findPH()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve player history data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("player history found", "PlayerController => findPH()", 10);
                        resolve(phDetails);
                    }
                });
        });

    }; // end of findPH

    let updatePH = (phDetails) => {
        console.log("updatePH");
        return new Promise((resolve, reject) => {
            let body = {};
            body['chipsWon'] = Number(phDetails.chipsWon) + Number(req.body.chips);
            PH.findOneAndUpdate({playerId: phDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, newPHDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in update player history", 400, null);
                        reject(apiResponse);
                    } else {
                        logger.info("find and update playerhistory", "PlayerController => updatePH()", 10);
                        resolve(newPHDetails);
                    }
                })

        });
    } // end of updatePH

    let findWallet = () => {
        console.log("findWallet");
        return new Promise((resolve, reject) => {
            Wallet.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("wallet found", "PlayerController => findWallet()", 10);
                        resolve(walletDetails);
                    }
                });
        });

    }; // end of findWallet

    let updateWallet = (walletDetails) => {
        console.log("updateWallet");
        return new Promise((resolve, reject) => {
            let body = {};
            body['chips'] = Number(walletDetails.chips) + Number(req.body.chips);
            Wallet.findOneAndUpdate({playerId: walletDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, newwalletDetails) => {
                    if (err) {
                        let apiResponse = response.generate(true, "Error in update wallet", 400, null);
                        reject(apiResponse);
                    } else {
                        logger.info("find and update wallet", "PlayerController => updateWallet()", 10);
                        let finalObject = newwalletDetails.toObject();
                        resolve(finalObject);

                    }
                })

        });
    } // end of updateWallet

    validatingInputs()
        .then(verifyToken)
        .then(matchPlayer)
        .then(findPlayer)
        .then(findPH)
        .then(updatePH)
        .then(findWallet)
        .then(updateWallet)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Won Game successful!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of won Game in function

// get Wallet
let getWallet = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.query.playerId) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let findWallet = () => {
        console.log("findWallet");
        return new Promise((resolve, reject) => {
            Wallet.findOne({'playerId': req.query.playerId})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("wallet found", "PlayerController => findWallet()", 10);
                        let finalObject = walletDetails.toObject();
                        resolve(finalObject);
                    }
                });
        });

    }; // end of findWallet

    validatingInputs()
        .then(findWallet)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Wallet information!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of get Wallet in function

// get Top Ten
let getTopTen = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.query.playerId) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let findTopTen = () => {
        console.log("findTopTen");
        return new Promise((resolve, reject) => {
            PH.find({}).sort({chipsWon: -1}).limit(10)
                .select('-__v -_id')
                .exec((err, topTenPlayer) => {
                    if (err) {
                        logger.error("Failed to retrieve top ten player", "playerController => findTopTen()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve top ten player", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Top ten player found", "PlayerController => findTopTen()", 10);
                        /*let final = [];
                        topTenPlayer.forEach((item) => {
                            let finalObject = item.toObject()
                            delete finalObject.__v;
                            delete finalObject._id;
                            final.push(finalObject);
                        })*/
                        resolve(topTenPlayer);
                    }
                });
        });

    }; // end of findTopTen

    validatingInputs()
        .then(findTopTen)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Top 10 player information!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of get Top Ten in function

// convert Diamond To Chips
let convertDiamondToChips = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId && req.body.diamond) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or diamond missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let findWallet = () => {
        console.log("findWallet");
        return new Promise((resolve, reject) => {
            Wallet.findOne({'playerId': req.body.playerId})
                .select('-__v -_id')
                .exec((err, walletDetails) => {
                    if (err) {
                        logger.error("Failed to retrieve wallet data", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                        reject(apiResponse);
                    } else if (check.isEmpty(walletDetails)) {
                        logger.error("No Wallet found", "playerController => findWallet()", 5);
                        let apiResponse = response.generate(true, "No Wallet found", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("wallet found", "PlayerController => findWallet()", 10);
                        let finalObject = walletDetails.toObject();
                        resolve(finalObject);
                    }
                });
        });

    }; // end of findWallet

    let checkDiamond = (walletDetails) => {
        console.log("checkDiamond");
        return new Promise((resolve, reject) => {
            if (req.body.diamond <= walletDetails.diamond) {
                resolve(walletDetails)
            } else {
                logger.error("Insufficient Ammount ", "playerController => checkDiamond()", 5);
                let apiResponse = response.generate(true, "Insufficient Diamond", 400, null);
                reject(apiResponse);
            }
        });

    }; // end of checkDiamond

    let convertAndSave = (walletDetails) => {
        console.log("convertAndSave");
        return new Promise((resolve, reject) => {
            let body = {};
            body['chips'] = Number(walletDetails.chips) + (Number(req.body.diamond) * 1000);
            body['diamond'] = Number(walletDetails.diamond) - Number(req.body.diamond);
            Wallet.findOneAndUpdate({playerId: walletDetails.playerId}, body, {new: true})
                .select('-__v -_id')
                .exec((err, newWalletDetails)=> {
                if (err) {
                    logger.error("Failed to retrieve wallet data", "playerController => convertAndSave()", 5);
                    let apiResponse = response.generate(true, "Failed to retrieve wallet data", 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(newWalletDetails)) {
                    logger.error("No Wallet found", "playerController => convertAndSave()", 5);
                    let apiResponse = response.generate(true, "No Wallet found", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("wallet found", "PlayerController => convertAndSave()", 10);
                    let finalObject = newWalletDetails.toObject();
                    resolve(finalObject);
                }
            });
        });

    }; // end of findWallet

    validatingInputs()
        .then(findWallet)
        .then(checkDiamond)
        .then(convertAndSave)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Diamond Convert Successfully!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of convert Diamond To Chips in function

// transaction
let transaction = (req, res) => {

    let validatingInputs = () => {
        console.log("validatingInputs");
        return new Promise((resolve, reject) => {
            if (req.body.playerId && req.body.transactionAmount && req.body.itemName) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or transactionAmount &&  itemName missing", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of validatingInputs

    let createTransaction = () => {
        console.log("createTransaction");
        return new Promise((resolve, reject) => {
            let body = {};
            body['transactionId'] = shortid.generate();
            body['playerId'] = req.body.playerId;
            body['transactionAmount'] = req.body.transactionAmount;
            body['itemName'] = req.body.itemName;
            body['createdOn'] = new Date();
            Transaction.create(body, function (err, transactionDetails) {
                if (err) {
                    logger.error("Failed to create Transaction", "playercontroller => createTransaction()", 5);
                    let apiResponse = response.generate(true, "Failed to create Transaction", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Transaction created", "playerController => createTransaction()", 10);
                    resolve(transactionDetails);
                }
            });
        });
    }

    validatingInputs()
        .then(createTransaction)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Transaction Created Successfully!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of transaction in function

module.exports = {

    createPlayer: createPlayer,
    getPlayerList: getPlayerList,
    filterPlayerList: filterPlayerList,
    playerSignIn: playerSignIn,
    guestPlayerSignIn: guestPlayerSignIn,
    updatePlayer: updatePlayer,
    joinGame: joinGame,
    wonGame: wonGame,
    getWallet: getWallet,
    getTopTen: getTopTen,
    convertDiamondToChips: convertDiamondToChips,
    transaction: transaction,

}// end exports
