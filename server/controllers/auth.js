const userModel = require('../models/userModel')
const otpModel = require('../models/otpModel')
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken")

exports.registration = async (req, res) => {
  try {
    const { name, email,password, address, phone, company, website ,role } = req.body;


    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(401).json("User already exists!");
    }

    if (password.length < 8) {
      return res
        .status(402)
        .json("Password must be at least 8 characters long!");
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await otpModel.create({
      name,
      email,
      password,
      address,
      phone,
      company,
      website,
      role,
      otp,
      
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "konodiosama69@gmail.com",
        pass: "fekm kopo koua kmuv",
      },
    });

    const mailOptions = {
      from: '"Page2Page" konodiosama69@gmail.com',
      to: email,
      subject: "Your OTP Code",
      html: `<p>Your OTP code is: <b>${otp}</b></p><p>This OTP is valid for 1 minutes.</p>`,
    };

    const info = await transporter.sendMail(mailOptions);
    res
      .status(200)
      .json("OTP sent to your email. Please verify to complete registration.");
  } catch (err) {
    console.error("Registration error:", err.message);
    res.status(500).json("Something went wrong");
  }
};


exports.verifyOTP = async (req, res) => {
  try {
    const { otp, email } = req.body;
    
    console.log(otp,email)
    const record = await otpModel.findOne({ email });
    if (!record) {
      return res.status(400).json("Your OTP has expired!");
    }

    if (record.otp !== otp) {
      return res.status(400).json("Invalid OTP!");
    }

    const { name, password, address, phone, company, website ,role  } = record;
    await userModel.create({ name, email,password, address, phone, company, website ,role  });

    await otpModel.deleteOne({ email });

    res.status(200).json("Account created successfully!");
  } catch (error) {
    console.error("OTP verification error:", error.message);
    res.status(500).json("Internal Server Error");
  }
};


exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const JWT_SECRET = process.env.JWT_SECRET 
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json("User not found!");
    }

    if (user.password !== password) {
      return res.status(400).json("Invalid credentials!");
    }

    
    const token = jwt.sign({ id: user._id, name:user.name, email: user.email,role : user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    
    res.cookie("token", token, {
      httpOnly: true,
      secure: "production",
      sameSite: "None", 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
    });

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json("Internal Server Error");
  }
};


exports.verifyUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    
   
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    
    req.user = decoded; 

    return res.status(200).json({ message: "User verified", user: decoded });
  } catch (error) {
    return res.status(402).json({ message: "Invalid or expired token", error: error.message });
  }
};


exports.logout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: 'production',
      sameSite: 'None',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};