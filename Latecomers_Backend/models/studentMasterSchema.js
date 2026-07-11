const mongoose = require("mongoose")

const studentMaster = new mongoose.Schema({
    studentName :{
        type : String ,
        required : true
    },
    studentRoll :{
        type : String ,
        required : true,
        unique : true
    },
    college :{
        type : String ,
        required : true
    },
    collegeCode : {
        type : String,
        required : true
    },
    school : {
        type : String,
    },
    branch :{
        type : String ,
        required : true
    },
    studentMobile :{
        type : Number ,
    },
    email : {
        type : String,
    },
    passedOutYear :{
        type : Number,
        required : true
    },
    gender :{
        type : String ,
        required : true
    },
    fatherName : {
        type : String,
    },
    fatherMobile : {
        type : Number,
    },
    suspended :{
        type : String,
    },
    updatedOn :{
        type : Date
    }
})

module.exports  = mongoose.model("studentMaster" , studentMaster);
