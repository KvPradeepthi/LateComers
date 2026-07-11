const express = require("express");
const Router = express.Router();
const {
  addStudentBuildingInData,
  addStudentBuildingOutData,
  todayStudentBuildingInData,
  todayStudentBuildingOutData,
  searchStudentBuilding,
  WeeklyBuildingReport,
  studentBuildingMonthlyReport,
  collegeBranchDateBuildingData,
  collegeWiseStudentBuildingCount,
  branchWiseStudentBuildingCount,
  getTodayOverallBuildingData,
} = require("../controllers/studentBuildingController");

Router.post("/add-Student-Building-InData", addStudentBuildingInData);
Router.post("/add-Student-Building-OutData", addStudentBuildingOutData);
Router.post("/student-Building-Weekly-Report-Api", WeeklyBuildingReport);
Router.get("/collegeWise-Student-Building-Count", collegeWiseStudentBuildingCount);
Router.get("/college-Branch-Date-Building-Data/:college/:branch/:fromDate/:toDate", collegeBranchDateBuildingData);
Router.get("/branchWise-Student-Building-Count/:college", branchWiseStudentBuildingCount);
Router.get("/search-Student-Building/:rollNo/:fromDate/:toDate", searchStudentBuilding);
Router.get("/student-Building-Monthly-Report/:date", studentBuildingMonthlyReport);
Router.get("/today-Student-Building-InData", todayStudentBuildingInData);
Router.get("/today-Student-Building-OutData", todayStudentBuildingOutData);
Router.get("/get-today-building-data", getTodayOverallBuildingData);

module.exports = Router;
