const express = require("express")
const Router = express.Router()

const {addData , updateStudent , getSuspendList , getStudentData , upload ,bulkUploadHandler } = require("../controllers/studentMasterController")

Router.post("/add-Studentss" , addData)

Router.put("/update-Student" , updateStudent)

Router.get("/get-SuspendList" , getSuspendList)

Router.post("/get-Studentss" , getStudentData)

Router.post("/get-Studentss" , getStudentData)

Router.post('/upload-csv', upload, bulkUploadHandler);

module.exports = Router
