const express = require('express')
const Router = express.Router()

const {getBranchWise , getGender , getVisitiors7days , getCollegenames, getCollegeCodes, getBranchWiseWithFullName, getStudents7days, getBuildingNames, getUniOverview} = require('../controllers/dashboardController');

Router.post('/get-branchwise',getBranchWise);
Router.post('/get-gender',getGender);
Router.get('/get-visitor-seven',getVisitiors7days);
Router.get('/get-student-seven',getStudents7days);
Router.post('/get-student-seven',getStudents7days);
Router.get('/get-clg-names',getCollegenames);
Router.get('/get-clg-codes',getCollegeCodes);
Router.post('/get-brachwise-fullname',getBranchWiseWithFullName);
Router.get('/get-building-names',getBuildingNames);
Router.post('/get-uni-overview', getUniOverview);



module.exports = Router