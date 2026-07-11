const examSchedule = require("../models/examSchedule");

// Add a new exam schedule
const addExamSchedule = async (req, res) => {
  try {
    const { examName, collegeCode, program, semester, startDate, endDate } = req.body;
    
    if (!collegeCode || !program || !semester || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const newSchedule = new examSchedule({
      examName,
      collegeCode,
      program,
      semester,
      startDate,
      endDate
    });

    await newSchedule.save();
    res.status(200).json(newSchedule);
  } catch (err) {
    console.error("Error adding exam schedule:", err);
    res.status(500).json({ error: "Failed to add exam schedule.", details: err.message });
  }
};

// Get all exam schedules
const getExamSchedules = async (req, res) => {
  try {
    const schedules = await examSchedule.find({}).sort({ createdAt: -1 });
    res.status(200).json(schedules);
  } catch (err) {
    console.error("Error getting exam schedules:", err);
    res.status(500).json({ error: "Failed to fetch exam schedules.", details: err.message });
  }
};

// Delete an exam schedule
const deleteExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await examSchedule.findByIdAndDelete(id);
    res.status(200).json({ message: "Exam schedule deleted successfully." });
  } catch (err) {
    console.error("Error deleting exam schedule:", err);
    res.status(500).json({ error: "Failed to delete exam schedule.", details: err.message });
  }
};

module.exports = {
  addExamSchedule,
  getExamSchedules,
  deleteExamSchedule
};
