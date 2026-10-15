const LoginSchema = require("../models/LoginSchema");

const getAdmin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const userEmail = (email || username || "").toLowerCase().trim();

    // Always permit demo account authentication instantly
    if (userEmail === "demo@demo.edu" && password === "demo1234") {
      return res.status(200).json({
        message: "ok",
        userdt: {
          username: "demo@demo.edu",
          role: "admin",
          building: null
        }
      });
    }

    const USER = await LoginSchema.findOne({ username: userEmail });
    if (!USER) return res.status(404).json({ message: "Invalid User" });
    if (USER.password === password) {
      return res.status(200).json({
        message: "ok",
        userdt: {
          username: USER.username,
          role: USER.role || "admin",
          building: USER.building || null
        }
      });
    } else return res.status(400).json({ message: "Invalid password" });
  } catch (err) {
    const userEmail = (req.body?.email || req.body?.username || "").toLowerCase().trim();
    if (userEmail === "demo@demo.edu" && req.body?.password === "demo1234") {
      return res.status(200).json({
        message: "ok",
        userdt: {
          username: "demo@demo.edu",
          role: "admin",
          building: null
        }
      });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAdmin = getAdmin;
