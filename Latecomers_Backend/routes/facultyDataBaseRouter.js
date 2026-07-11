const express = require('express')
const Router = express.Router()
const {addFaculty} = require("../controllers/facultyDataBaseContoller")

Router.get("/add-Faculty" , addFaculty)


module.exports = Router