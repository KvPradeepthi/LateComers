const express = require("express");
const Router = express.Router();
const { collegeWiseStudentCount , collegeBranchDateData , branchWiseStudentCount , searchStudent , addStudentInData , studentMonthlyReport, WeeklyReport , addStudentOutData ,todayStudentInData ,todayStudentOutData , deleteErrorData,
    getErrorData,getTodayOverallData , getStudentData } = require("../controllers/studentsController")
const {sendingMails} = require("../controllers/mailController")


Router.post("/add-Student-InData", addStudentInData)
Router.post("/add-Student-OutData" , addStudentOutData)
Router.post("/student-Weekly-Report-Api" , WeeklyReport)
Router.get("/collegeWise-Student-Count", collegeWiseStudentCount)
Router.get("/college-Branch-Date-Data/:college/:branch/:fromDate/:toDate", collegeBranchDateData)
Router.get("/branchWise-Student-Count/:college", branchWiseStudentCount)
Router.get("/search-Student/:rollNo/:fromDate/:toDate", searchStudent)
Router.get("/student-Monthly-Report/:date" , studentMonthlyReport)
Router.get("/today-Student-InData" , todayStudentInData)
Router.get("/today-Student-OutData" , todayStudentOutData)
Router.get("/delete-Error-Data", deleteErrorData);
Router.get("/get-Error-Data" , getErrorData)
Router.get("/get-today-data" , getTodayOverallData)
Router.get("/get-Student-Data/:roll" , getStudentData)

Router.get("/sendingMails" , sendingMails)
// Router.get("/sendOutLookMail" , sendOutLookMail)



module.exports = Router