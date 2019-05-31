const express = require('express');
const router = express.Router();
const playerController = require("./../../app/controllers/playerController");
const appConfig = require("./../../config/appConfig");
const middleware = require('../middlewares/auth');

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/players`;

    // defining routes.

    // get all player in one list by pagination
    app.get(`${baseUrl}/getplayerlist`, playerController.getPlayerList);

    // create player
    app.post(`${baseUrl}/craeteplayer`, playerController.createPlayer);

    // filter player list
    app.post(`${baseUrl}/filterplayerlist`, playerController.filterPlayerList);

    // player sign in through social account
    app.post(`${baseUrl}/signIn/social/account`, playerController.playerSignIn);

    // player sign in as guest
    app.post(`${baseUrl}/signIn/as/guest`, playerController.guestPlayerSignIn);

    // Update Player
    app.put(`${baseUrl}/update/profile`, middleware.isAuthorize, playerController.updatePlayer);

    // Player join game
    app.put(`${baseUrl}/join/game`, middleware.isAuthorize, playerController.joinGame);

    // Player won game
    app.put(`${baseUrl}/won/game`, middleware.isAuthorize, playerController.wonGame);

    // get wallet info
    app.get(`${baseUrl}/get/wallet/info`, middleware.isAuthorize, playerController.getWallet);

    // get top 10 players from history
    app.get(`${baseUrl}/get/top/ten/player/history`, middleware.isAuthorize, playerController.getTopTen);

    // Convert Diamond into chips
    app.post(`${baseUrl}/convert/dtc`, middleware.isAuthorize, playerController.convertDiamondToChips);

    // transaction api
    app.post(`${baseUrl}/transaction`, middleware.isAuthorize, playerController.transaction);
}
