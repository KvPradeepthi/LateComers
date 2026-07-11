const mongoose = require("mongoose");

const examScheduleSchema = new mongoose.Schema(
  {
    examName: {
      type: String,
    },
    collegeCode: {
      type: String,
      required: true,
    },
    program: {
      type: String,
      required: true,
    },
    semester: {
      type: String,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("examSchedule", examScheduleSchema);
