const express = require('express')
const Router = express.Router();

const { StudentWeeklyMessageSender, StudentWeeklyBuildingMessageSender } = require('../controllers/messageController');

// Router.post('/Student-Monthly-Message-Sender', StudentMonthlyMessageSender)
Router.post('/Student-Weekly-Message-Sender', StudentWeeklyMessageSender)
Router.post('/Student-Weekly-Building-Message-Sender', StudentWeeklyBuildingMessageSender)
// Router.get('/WeeklyReport' , WeeklyReport)

module.exports = Router;