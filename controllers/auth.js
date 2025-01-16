import { TryCatch } from "../middlewares/error.js";
import { User } from "../models/user.js";
import { sendVerificationEmail } from "../utils/features.js";
import { ErrorHandler } from "../utils/utility.js";

const resendOTP = TryCatch(async (req, res, next) => {
    const { email } = req.body;
  
    // Find the user by email
    const user = await User.findOne({ email });
  
    if (!user) return next(new ErrorHandler("User not found!", 404));
  
    if (user.isVerified) {
      return res.status(400).json({ message: "User already verified!" });
    }
  
    // Generate a new OTP
    const newOTP = Math.floor(1000 + Math.random() * 9000);
  
    // Update the user's OTP in the database
    user.otp = newOTP;
    await user.save();
  
    // Send the new OTP via email
    try {
      sendVerificationEmail(user.email, user.name, newOTP);
    } catch (error) {
      return next(new ErrorHandler("Failed to send verification email.", 500));
    }    
  
    return res.status(200).json({
      success: true,
      message: "New OTP has been sent to your email.",
    });
  });
export {resendOTP}
  