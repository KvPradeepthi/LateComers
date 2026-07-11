const { default: mongoose } = require("mongoose")

const studentBuildingSchema = new mongoose.Schema({
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
    },
    building : {
        type : String,
        required: true
    },
    scannedBy : {
        type : String,
        default: null
    }
},
{
    timestamps: true
}
)

module.exports = mongoose.model('studentBuildingSchema' , studentBuildingSchema);
