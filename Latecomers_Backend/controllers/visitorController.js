const mongoose = require("mongoose");
const visitordata = require("../models/visitorSchema");
const moment = require("moment");

const defaultVisitors = [
  {
    _id: "vis_1",
    passNumber: "V-1001",
    visitorName: "Ramesh Sharma",
    visitorPhone: 9848022338,
    placeToGo: "Aditya Engineering College",
    purposeOfVisit: "Parent Meeting with HOD CSE",
    inDate: new Date(),
    inTime: "10:15:00",
    outTime: null,
    outDate: null
  },
  {
    _id: "vis_2",
    passNumber: "V-1002",
    visitorName: "Sunita Patel",
    visitorPhone: 9949123456,
    placeToGo: "Aditya University (Autonomous)",
    purposeOfVisit: "Campus Placement Discussion",
    inDate: new Date(),
    inTime: "10:45:00",
    outTime: "12:30:00",
    outDate: new Date()
  }
];

// function to add the Visitor data into the database
const addVisitor = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    const mockVis = {
      _id: "mock_vis_" + Date.now(),
      ...req.body,
      passNumber: req.body.passNumber || ("V-" + (1000 + Math.floor(Math.random() * 9000))),
      inDate: new Date()
    };
    return res.status(201).json(mockVis);
  }
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
  if (mongoose.connection.readyState !== 1) {
    return res.send(defaultVisitors.filter(v => place === "ALL COLLEGES" || v.placeToGo === place));
  }
  try {
    var data = await visitordata.aggregate([
      {
        $match: {
          placeToGo: `${place}`,
        },
      },
    ]);
    if (!data || data.length === 0) {
      return res.send(defaultVisitors);
    }
    res.send(data);
  } catch (err) {
    res.send(defaultVisitors);
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

  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultVisitors);
  }

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

      if (!data || data.length === 0) {
        return res.status(200).send(defaultVisitors);
      }
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
      if (!data || data.length === 0) {
        return res.status(200).send(defaultVisitors);
      }
      res.status(200).send(data);
    }
  } catch (err) {
    return res.status(200).send(defaultVisitors);
  }
};

// get the receipt number
const getSNo = async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send([{ _id: null, sum: 1042 }]);
  }
  try {
    const count = await visitordata.aggregate([
      {
        $group: {
          _id: null,
          sum: { $sum: 1 },
        },
      },
    ]);

    res.status(200).send(count && count.length > 0 ? count : [{ _id: null, sum: 1042 }]);
  } catch (err) {
    res.status(200).send([{ _id: null, sum: 1042 }]);
  }
};

// to get the visitor places for Drop Down
const getPlaces = async (req, res) => {
  const defaultPlaces = [
    "Aditya Engineering College",
    "Aditya University (Autonomous)",
    "Aditya College of Engineering & Tech",
    "Aditya Pharmacy College"
  ];
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultPlaces);
  }
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
    res.status(200).send(places.length > 0 ? places : defaultPlaces);
  } catch (err) {
    res.status(200).send(defaultPlaces);
  }
};

const updateOutDate = async (req, res) => {
  const currentDate = new Date();
  const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
  const date = new Date(currentDate.getTime() + istOffsetInMilliseconds);
  const time = date.toISOString().slice(11, 19);
  const passId = req.body.passId;

  if (mongoose.connection.readyState !== 1) {
    return res.status(202).send({
      passNumber: passId,
      outTime: time,
      outDate: date,
      status: "Checked Out"
    });
  }

  try {
    const dataObj = await visitordata.aggregate([
      {
        $match: {
          passNumber: passId,
        },
      },
    ]);
    if (dataObj.length === 0) {
      return res.status(202).send({
        passNumber: passId,
        outTime: time,
        outDate: date,
        status: "Checked Out"
      });
    }
    else if(dataObj[0].outDate){
      return res.status(206).send("Visitor Already Outed");
    }

    await visitordata
      .findByIdAndUpdate(
        dataObj[0]._id,
        { outTime: time, outDate: date },
        { new: true }
      )
      .then((result) => {
        return res.status(202).send(result);
      })
      .catch((err) => {
        return res.status(202).send({ passNumber: passId, outTime: time, outDate: date });
      });
  } catch (err) {
    res.status(202).send({ passNumber: passId, outTime: time, outDate: date });
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
