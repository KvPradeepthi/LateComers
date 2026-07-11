const visitordata = require("../models/visitorSchema");
const moment = require("moment");

// function to add the Visitor data into the database
const addVisitor = async (req, res) => {
  // console.log(req.body);
  try {
    const newItem = new visitordata(req.body);
    await newItem.save();
    console.log("Adding the Visitor is Successfully Done");
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error while adding visitor:", error);
    res
      .status(400)
      .json({ error: "Failed to add visitor", details: error.message });
  }
};

//get the data based on the id
const getVisitorById = async (req, res) => {
  const place = req.params.place;
  // console.log(typeof iid);
  try {
    var data = await visitordata.aggregate([
      {
        $match: {
          placeToGo: `${place}`,
        },
      },
    ]);
    // console.log(data);
    res.send(data);
  } catch (err) {
    res.status(400).send({ err });
  }
};

// get the data based on the date and place
const getVisitorsBtDates = async (req, res) => {
  // console.log(req.params);
  const place = req.params.place;

  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const fd = new Date(req.params.fromDate);
  const fromDate = new Date(
    new Date(
      `${fd.getFullYear()}-${String(fd.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(fd.getDate()).padStart(2, "0")}T00:00:00.000`
    ).getTime() + istOffsetInMilliseconds
  );

  const td = new Date(req.params.toDate);
  const toDate = new Date(
    new Date(
      `${td.getFullYear()}-${String(td.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(td.getDate()).padStart(2, "0")}T23:59:59.999`
    ).getTime() + istOffsetInMilliseconds
  );

  // console.log(fromDate, toDate);

  try {
    if (place == "ALL COLLEGES") {
      const data = await visitordata.aggregate([
        {
          $match: {
            inDate: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        },
      ]);

      // console.log(data);
      return res.status(200).send(data);
    } else {
      const data = await visitordata.aggregate([
        {
          $match: {
            placeToGo: place,
            inDate: {
              $gte: fromDate,
              $lte: toDate,
            },
          },
        },
      ]);
      // console.log(data)
      res.status(200).send(data);
    }
  } catch (err) {
    return res
      .status(500)
      .send({ error: "Data not fetched", details: err.message });
  }
};

// get the receipt number
const getSNo = async (req, res) => {
  try {
    const count = await visitordata.aggregate([
      {
        $group: {
          _id: null,
          sum: { $sum: 1 },
        },
      },
    ]);

    // console.log(count);
    res.status(200).send(count);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .send({ error: "Not able to get the Data", details: err.message });
  }
};

// to get the visitor places for Drop Down
const getPlaces = async (req, res) => {
  try {
    const data = await visitordata.aggregate([
      {
        $group: {
          _id: null,
          place: { $addToSet: "$placeToGo" },
        },
      },
    ]);

    const places = data[0]?.place || [];
    res.status(200).send(places);
  } catch (err) {
    console.error(err);
    res.status(500).send({ Error: err.message });
  }
};

const updateOutDate = async (req, res) => {
  try {
    const currentDate = new Date();
    const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
    const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);

    const time = date.toISOString().slice(11, 19);

    const passId = req.body.passId;

    const dataObj = await visitordata.aggregate([
      {
        $match: {
          passNumber: passId,
        },
      },
    ]);
    // console.log(dataObj);
    // console.log(dataObj[0].outDate)
    if (dataObj.length === 0) {
      return res.status(404).json("visitor not found");
    }
    else if(dataObj[0].outDate){
      return res.status(206).send("Visitor Already Outed")
    }

    await visitordata
      .findByIdAndUpdate(
        dataObj[0]._id,
        { outTime: time, outDate: date },
        { new: true }
      )
      .then((result) => {
        // console.log(result);
        return res.status(202).send(result);
      })
      .catch((err) => {
        console.log(err);
        return res.status(404).send({ err: err.message });
      });
  } catch (err) {
    console.log(err);
    res.status(404).send(err);
  }
};

module.exports = {
  addVisitor,
  getVisitorsBtDates,
  getVisitorById,
  getSNo,
  getPlaces,
  updateOutDate,
};
