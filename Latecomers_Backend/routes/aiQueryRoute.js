const express = require("express");
const Router = express.Router();
const { executeAiQuery } = require("../controllers/aiQueryController");

Router.post("/ai-query", executeAiQuery);

module.exports = Router;
