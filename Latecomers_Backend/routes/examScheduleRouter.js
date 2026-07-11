const express = require("express");
const Router = express.Router();
const {
  addExamSchedule,
  getExamSchedules,
  deleteExamSchedule,
} = require("../controllers/examScheduleController");

Router.post("/add-schedule", addExamSchedule);
Router.get("/get-schedules", getExamSchedules);
Router.delete("/delete-schedule/:id", deleteExamSchedule);

module.exports = Router;
