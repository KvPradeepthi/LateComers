const mongoose = require("mongoose")

const visitordata = new mongoose.Schema({
    visitorName :{
        type:String,
        required:true
    },
    visitorPlace :{
        type:String,
        required:true
    },
    visitorPhone:{
        type:Number,
        required:true
    },
    visitorEmail :{
        type:String,
    },
    personToMeet :{
        type:String,
        required:true
    },
    visitorCount :{
        type:Number,
        required:true
    },
    visitorPurpose :{
        type:String,
        required:true
    },
    placeToGo :{
        type:String,
        required:true
    },
    inDate :{
        type:Date,
        required:true
    },
    outDate :{
        type:Date,
    },
    inTime :{
        type:String,
        required :true 
    },
    outTime :{
        type : String,
    },
    passNumber :{
        type : String ,
        required :true
    },
    visitorVehicle :{
        type:String,
    },
    visitorMaterial :{
        type:String,
    },
},
{
    timestamps: true
})

module.exports = mongoose.model('visitordata' , visitordata);