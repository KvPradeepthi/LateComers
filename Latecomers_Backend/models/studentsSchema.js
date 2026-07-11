const { default: mongoose } = require("mongoose")

const studentsSchema = new mongoose.Schema({
    studentName :{
        type : String ,
    },
    studentRoll :{
        type : String ,
    },
    college :{
        type : String ,
    },
    collegeCode : {
        type : String,
    },
    school : {
        type : String,
    },
    branch :{
        type : String ,
    },
    studentMobile :{
        type : Number ,
    },
    email : {
        type : String,
    },
    passedOutYear :{
        type : Number,
    },
    gender :{
        type : String ,
    },
    fatherName : {
        type : String,
    },
    fatherMobile : {
        type : Number,
    },
    date : {
        type : Date,
    },
    inTime : {
        type : String,
    },
    outTime : {
        type : String,
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model('studentsSchema' , studentsSchema);