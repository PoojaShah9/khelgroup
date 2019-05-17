const express = require('express');
const router = express.Router();
const playerController = require("./../../app/controllers/playerController");
const appConfig = require("./../../config/appConfig")

module.exports.setRouter = (app) => {

    let baseUrl = `${appConfig.apiVersion}/players`;

    // defining routes.

    // get all player in one list by pagination
    app.get(`${baseUrl}/getplayerlist`, playerController.getPlayerList);

    // create player
    app.post(`${baseUrl}/craeteplayer`, playerController.createPlayer);

    // filter player list
    app.post(`${baseUrl}/filterplayerlist`, playerController.filterPlayerList);

}
