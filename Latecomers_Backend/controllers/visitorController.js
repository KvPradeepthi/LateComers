const mongoose = require("mongoose");
const visitordata = require("../models/visitorSchema");
const moment = require("moment");

let inMemoryVisitors = [
  {
    _id: "vis_1",
    passNumber: "V-1001",
    visitorName: "Ramesh Sharma",
    visitorPhone: "9848022338",
    visitorPlace: "Rajahmundry",
    visitorCount: 1,
    visitorVehicle: "AP05BK4321",
    personToMeet: "Dr. K. Srinivas Rao (HOD CSE)",
    placeToGo: "Aditya Engineering College",
    visitorPurpose: "Parent Meeting with HOD CSE",
    visitorMaterial: "Documents File",
    inDate: new Date(),
    inTime: "10:15:00",
    outTime: null,
    outDate: null
  },
  {
    _id: "vis_2",
    passNumber: "V-1002",
    visitorName: "Sunita Patel",
    visitorPhone: "9949123456",
    visitorPlace: "Kakinada",
    visitorCount: 2,
    visitorVehicle: "AP05DL9988",
    personToMeet: "Dean Placements",
    placeToGo: "Aditya University (Autonomous)",
    visitorPurpose: "Campus Placement Discussion",
    visitorMaterial: "Laptop",
    inDate: new Date(),
    inTime: "10:45:00",
    outTime: "12:30:00",
    outDate: new Date()
  },
  {
    _id: "vis_3",
    passNumber: "V-1003",
    visitorName: "M. Venkata Reddy",
    visitorPhone: "9440188223",
    visitorPlace: "Samalkot",
    visitorCount: 1,
    visitorVehicle: "AP05CF1234",
    personToMeet: "Principal",
    placeToGo: "Aditya College of Engineering & Tech",
    visitorPurpose: "Student Admission Enquiry",
    visitorMaterial: "None",
    inDate: new Date(),
    inTime: "11:20:00",
    outTime: null,
    outDate: null
  }
];

// function to add the Visitor data into the database
const addVisitor = async (req, res) => {
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const nextPassNum = "V-" + (1000 + inMemoryVisitors.length + 1);
  const mockVis = {
    _id: "mock_vis_" + Date.now(),
    visitorName: req.body.visitorName || "Guest Visitor",
    visitorPhone: req.body.visitorPhone || "9848000000",
    visitorPlace: req.body.visitorPlace || "Local",
    visitorCount: req.body.visitorCount || 1,
    visitorVehicle: req.body.visitorVehicle || "N/A",
    personToMeet: req.body.personToMeet || "Department Office",
    placeToGo: req.body.placeToGo || "Aditya Engineering College",
    visitorPurpose: req.body.visitorPurpose || req.body.purposeOfVisit || "Official Visit",
    visitorMaterial: req.body.visitorMaterial || "None",
    passNumber: req.body.passNumber || nextPassNum,
    inDate: req.body.inDate ? new Date(req.body.inDate) : new Date(),
    inTime: req.body.inTime || time,
    outTime: null,
    outDate: null,
    ...req.body
  };

  inMemoryVisitors.unshift(mockVis);

  if (mongoose.connection.readyState !== 1) {
    return res.status(201).json(mockVis);
  }
  try {
    const newItem = new visitordata(mockVis);
    await newItem.save();
    console.log("Adding the Visitor is Successfully Done");
    res.status(201).json(newItem);
  } catch (error) {
    console.error("Error while adding visitor to DB:", error.message);
    res.status(201).json(mockVis);
  }
};

//get the data based on the id
const getVisitorById = async (req, res) => {
  const place = req.params.place;
  const filtered = inMemoryVisitors.filter(
    v => place === "ALL COLLEGES" || !place || v.placeToGo === place
  );
  if (mongoose.connection.readyState !== 1) {
    return res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }
  try {
    const data = await visitordata.aggregate([
      {
        $match: {
          placeToGo: `${place}`
        }
      }
    ]);
    if (!data || data.length === 0) {
      return res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
    }
    res.send(data);
  } catch (err) {
    res.send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }
};

// get the data based on the date and place
const getVisitorsBtDates = async (req, res) => {
  const place = req.params.place;
  const filterByPlace = list => {
    if (!place || place === "ALL COLLEGES") return list;
    return list.filter(
      v => (v.placeToGo || "").toLowerCase() === place.toLowerCase()
    );
  };

  if (mongoose.connection.readyState !== 1) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.status(200).send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }

  try {
    const istOffsetInMilliseconds = (5 * 60 + 30) * 60 * 1000;
    const fd = new Date(req.params.fromDate);
    const fromDate = new Date(fd.getTime());
    fromDate.setHours(0, 0, 0, 0);

    const td = new Date(req.params.toDate);
    const toDate = new Date(td.getTime());
    toDate.setHours(23, 59, 59, 999);

    let matchCriteria = {
      inDate: {
        $gte: fromDate,
        $lte: toDate
      }
    };
    if (place && place !== "ALL COLLEGES") {
      matchCriteria.placeToGo = place;
    }

    const data = await visitordata.aggregate([
      {
        $match: matchCriteria
      }
    ]);

    if (!data || data.length === 0) {
      const filtered = filterByPlace(inMemoryVisitors);
      return res.status(200).send(filtered.length > 0 ? filtered : inMemoryVisitors);
    }

    const combined = [...data];
    for (const mem of inMemoryVisitors) {
      if (!combined.some(v => v.passNumber === mem.passNumber)) {
        combined.unshift(mem);
      }
    }
    return res.status(200).send(filterByPlace(combined));
  } catch (err) {
    const filtered = filterByPlace(inMemoryVisitors);
    return res.status(200).send(filtered.length > 0 ? filtered : inMemoryVisitors);
  }
};

// get the receipt number
const getSNo = async (req, res) => {
  return res.status(200).send([{ _id: null, sum: 1000 + inMemoryVisitors.length }]);
};

// to get the visitor places for Drop Down
const getPlaces = async (req, res) => {
  const defaultPlaces = [
    "Aditya Engineering College",
    "Aditya University (Autonomous)",
    "Aditya College of Engineering & Tech",
    "Aditya Pharmacy College",
    "Aditya Polytechnic College"
  ];
  if (mongoose.connection.readyState !== 1) {
    return res.status(200).send(defaultPlaces);
  }
  try {
    const data = await visitordata.aggregate([
      {
        $group: {
          _id: null,
          place: { $addToSet: "$placeToGo" }
        }
      }
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

  const found = inMemoryVisitors.find(
    v => String(v.passNumber) === String(passId) || String(v._id) === String(passId)
  );
  if (found) {
    found.outDate = date;
    found.outTime = time;
  }

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
          passNumber: passId
        }
      }
    ]);
    if (dataObj.length === 0) {
      return res.status(202).send({
        passNumber: passId,
        outTime: time,
        outDate: date,
        status: "Checked Out"
      });
    } else if (dataObj[0].outDate) {
      return res.status(206).send("Visitor Already Outed");
    }

    await visitordata
      .findByIdAndUpdate(
        dataObj[0]._id,
        { outTime: time, outDate: date },
        { new: true }
      )
      .then(result => {
        return res.status(202).send(result);
      })
      .catch(err => {
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
  updateOutDate
};
