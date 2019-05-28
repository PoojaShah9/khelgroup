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
} // end of create Player function

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
            Wallet.findOne({playerId: playerDetails.playerId}, function (err, walletDetails) {
                if (err) {
                    logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                    let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                    reject(apiResponse);
                } else if (check.isEmpty(walletDetails)) {
                    let body = {};
                    body['walletId'] = shortid.generate();
                    body['currencyType'] = 'coins';
                    body['currencyAmount'] = 1000;
                    body['playerId'] = playerDetails.playerId;
                    Wallet.create(body, function (err, walletDetails) {
                        if (err) {
                            logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                            let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                            reject(apiResponse);
                        } else {
                            logger.info("Wallet created for  Player", "playerController => createWallet()", 10);
                            Player.findOne({playerId: playerDetails.playerId}, function (err, playerDetails) {
                                if (err) {
                                    logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                                    let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                                    reject(apiResponse);
                                } else {
                                    resolve(playerDetails);
                                }
                            })
                        }
                    });
                } else {
                    logger.info("Wallet of Player found", "playerController => createWallet()", 10);
                    Player.findOne({playerId: playerDetails.playerId}, function (err, playerDetails) {
                        if (err) {
                            logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                            let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                            reject(apiResponse);
                        } else {
                            resolve(playerDetails);
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
            tokenCol.findOne({playerId: tokenDetails.playerId}).exec((err, retrieveTokenDetails) => {
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
            body['currencyType'] = 'coins';
            body['currencyAmount'] = 500;
            body['playerId'] = playerDetails.playerId;
            Wallet.create(body, function (err, walletDetails) {
                if (err) {
                    logger.error("Failed to create Wallet", "playercontroller => createWallet()", 5);
                    let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                    reject(apiResponse);
                } else {
                    logger.info("Wallet created for Guest Player", "playerController => createWallet()", 10);
                    Player.findOne({playerId: playerDetails.playerId}, function (err, playerDetails) {
                        if (err) {
                            logger.error("Failed to find player", "playercontroller => createWallet()", 5);
                            let apiResponse = response.generate(true, "Failed to create Wallet", 500, null);
                            reject(apiResponse);
                        } else {
                            resolve(playerDetails);
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
            tokenCol.findOne({playerId: tokenDetails.playerId}).exec((err, retrieveTokenDetails) => {
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
            Player.findOneAndUpdate({playerId: playerDetails.playerId}, body, {new: true}, function (err, player) {
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
            if (req.body.playerId && req.body.currencyAmount && req.body.currencyType) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or currencyAmount or currencyType missing", 400, null);
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
            if (req.body.currencyAmount <= walletDetails.currencyAmount) {
                resolve(walletDetails);
            } else {
                let apiResponse = response.generate(true, "Insufficient amount", 400, null);
                reject(apiResponse);
            }
        });
    }; // end of deduction

    let updateWallet = (walletDetails) => {
        console.log("updatePlayer");
        return new Promise((resolve, reject) => {
            let body = {};
            body['currencyAmount'] = walletDetails.currencyAmount - req.body.currencyAmount;
            Wallet.findOneAndUpdate({playerId: walletDetails.playerId}, body, {new: true}, function (err, newwalletDetails) {
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
            PH.findOne({playerId: walletDetails.playerId}, function (err, phDetails) {
                if (err) {
                    let apiResponse = response.generate(true, "Error in find player history", 400, null);
                    reject(apiResponse);
                } else if (check.isEmpty(phDetails)) {
                    let body = {};
                    body['gamesPlayed'] = 0;
                    body['currencyWon'] = 0;
                    body['playerId'] = walletDetails.playerId;
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
            PH.findOneAndUpdate({playerId: phDetails.playerId}, body, {new: true}, function (err, newphDetails) {
                if (err) {
                    let apiResponse = response.generate(true, "Error in update player history", 400, null);
                    reject(apiResponse);
                } else {
                    Wallet.findOne({playerId: newphDetails.playerId}, function (err, WalletDetails) {
                        if (err) {
                            let apiResponse = response.generate(true, "Error in find player wallet", 400, null);
                            reject(apiResponse);
                        } else {
                            logger.info("wallet found", "PlayerController => updatePlayerHistory()", 10);
                            let responseBody = {
                                walletInfo: WalletDetails
                            };
                            resolve(responseBody);
                        }
                    })
                }
            })

        });
    } // end of createPlayerHistory

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
            if (req.body.playerId && req.body.currencyAmount && req.body.currencyType) {
                resolve(req);
            } else {
                let apiResponse = response.generate(true, "playerId or currencyAmount or currencyType missing", 400, null);
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
            body['currencyWon'] = phDetails.currencyWon + req.body.currencyAmount;
            PH.findOneAndUpdate({playerId: phDetails.playerId}, body, {new: true}, function (err, newPHDetails) {
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
            body['currencyAmount'] = walletDetails.currencyAmount + req.body.currencyAmount;
            Wallet.findOneAndUpdate({playerId: walletDetails.playerId}, body, {new: true}, function (err, newwalletDetails) {
                if (err) {
                    let apiResponse = response.generate(true, "Error in update wallet", 400, null);
                    reject(apiResponse);
                } else {
                    logger.info("find and update wallet", "PlayerController => updateWallet()", 10);
                    let response = {
                        walletInformation:newwalletDetails
                    }
                    resolve(response);

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
                        let response = {
                            walletInfo: walletDetails
                        }
                        resolve(response);
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
            PH.find({}).sort({currencyWon: -1}).limit(10)
                .exec((err, topTenPlayer) => {
                    if (err) {
                        logger.error("Failed to retrieve top ten player", "playerController => findTopTen()", 5);
                        let apiResponse = response.generate(true, "Failed to retrieve top ten player", 500, null);
                        reject(apiResponse);
                    } else {
                        logger.info("Top ten player found", "PlayerController => findTopTen()", 10);
                        let response = {
                            topTenPlayer: topTenPlayer
                        }
                        resolve(response);
                    }
                });
        });

    }; // end of findTopTen

    validatingInputs()
        .then(findTopTen)
        .then((resolve) => {
            let apiResponse = response.generate(false, "Wallet information!!", 200, resolve);
            res.send(apiResponse);
        })
        .catch((err) => {
            console.log(err);
            res.send(err);
            res.status(err.status);
        });
} // end of get Top Ten in function

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
} // end of get Player List function

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
} // end of filter Player List function


module.exports = {

    getPlayerList: getPlayerList,
    createPlayer: createPlayer,
    filterPlayerList: filterPlayerList,
    playerSignIn: playerSignIn,
    guestPlayerSignIn: guestPlayerSignIn,
    updatePlayer: updatePlayer,
    joinGame: joinGame,
    wonGame: wonGame,
    getWallet: getWallet,
    getTopTen: getTopTen,

}// end exports
