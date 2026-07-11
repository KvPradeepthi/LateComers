const mongoose = require('mongoose')

const errorSchema = mongoose.Schema({
    studentRoll: {
        type: String,
    },
    date :{
        type : Date,
    }
});

module.exports  = mongoose.model("errorSchema" , errorSchema);
