const express = require('express');
const Router = express.Router();
const adminLoginControllors = require('../controllers/adminLoginController');


Router.post('/get-admin-login', adminLoginControllors.getAdmin);

module.exports = Router;
