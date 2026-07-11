const mongoose = require("mongoose")

const facultySchema = new mongoose.Schema({
    facultyName: {
        type: String,
    },
    facultyId: {
        type: String,
    },
    facultyMobile: {
        type: String,
    },
    facultyCollege: {
        type: String,
    },
    facultyCollegeCode: {
        type : String,
    },
    facultyMail: {
        type: String,
    },
    facultyGender: {
        type: String,
    },
    date: {
        type: Date,
    },
    inTime: {
        type: String,
    },
    outTime: {
        type: String,
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model("facultySchema", facultySchema)