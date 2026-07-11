const express = require("express")

const Router = express.Router()

const {addFacultyInData , searchFaculty, collegeDateData , collegeWiseFacultyCount, addFacultyOutData , todayFacultyInData , todayFacultyOutData , getFacultyData} = require("../controllers/facultyController")

Router.post("/add-Faculty-InData" , addFacultyInData)
Router.post("/add-Faculty-Outdata", addFacultyOutData);
Router.get("/search-Faculty/:facultyId/:fromDate/:toDate" , searchFaculty);
Router.get("/college-Date-Data/:facultyCollege/:fromDate/:toDate" , collegeDateData)
Router.get("/collegeWise-Faculty-Count" , collegeWiseFacultyCount)
Router.get("/today-Faculty-InData" , todayFacultyInData)
Router.get("/today-Faculty-OutData" , todayFacultyOutData)
Router.get("/get-Faculty-Data/:empId" , getFacultyData)
// Router.get("/today-Faculty-Data/:facultyCollege" , todayFacultyData)


module.exports = Router 