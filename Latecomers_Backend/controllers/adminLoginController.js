const LoginSchema = require("../models/LoginSchema");

const getAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    // console.log(req.body);
    const USER = await LoginSchema.findOne({ username: email });
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
    console.error(err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getAdmin = getAdmin;
