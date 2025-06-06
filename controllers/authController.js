const User = require("../models/userModel");
const bcrypt = require("bcryptjs"); // Use bcryptjs
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  const { emailaddress, password } = req.body; 

  // Validate input
  if (!emailaddress || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // Fetch user by email
    const user = await User.findOne({ where: { emailaddress } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Checking what is returned
    console.log("User retrieved:", user.toJSON());

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.passwordhash);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Ensuring tht JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT secret is missing");
    }

    // Generate JWT
    const token = jwt.sign(
      { userid: user.userid, emailaddress: user.emailaddress, role: user.role }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        userid: user.userid,
        firstname: user.firstname,
        lastname: user.lastname,
        emailaddress: user.emailaddress,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  login,
};