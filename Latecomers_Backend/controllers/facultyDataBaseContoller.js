const facultyDataBase = require('../models/facultyDataBaseSchema')

const addFaculty = async(req , res) =>{
    try{
        var data = req.body;
        console.log(data)
        var finalData = new facultyDataBase(data)
         finalData.save()
        console.log("added Successfully")
        res.status(200).send(finalData)
    }
    catch(err){
        console.log(err)
        res.status(500).send({err : "Error While adding the Data" , details : err})
    }
}

module.exports = {addFaculty}