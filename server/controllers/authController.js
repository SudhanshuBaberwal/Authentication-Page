import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
import userModel from "../models/userModel.js";
import tranporter from "../config/nodemailer.js";


export const register = async (req , res) =>{
    const {name ,email , password} = req.body;
    if (!name || !email || !password){
        return res.json({success : false , message : "Missing Detials"})
    }

    try{
        const existingUser = await userModel.findOne({email})
        if (existingUser){
            return res.json({success : fasle , message : "User Already Exist"})
        }
        
        const hashedPassword = await bcrypt.hash(password , 10 , );
        const user = new userModel({
            name,
            email,
            password : hashedPassword,
        });
        await user.save();

        const token = jwt.sign({id : user._id} , process.env.JWT_SECRET , {expiresIn : "7d"});
        res.cookie("token" , token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge : 7*24*60*60*1000
        });
        // Sending Welcome Email
        const mainOptions = {
            from : process.env.SENDER_EMAIL,
            to : email,
            subject : "Welcome To GreatStack" ,
            text : `Welcome to greatestack website. Your account has been created with email id : ${email}`
        }

        await tranporter.sendMail(mainOptions);
                
        return res.json({success  : true})
    }
    catch(err){
        res.json({success : false , message : err.message})
    }
}


export const login =  async (req,res) =>{
    const {email , password} = req.body;

    if (!email || !password){
        return res.json({success : false , message : "Email Or Password are required"})
    }
    try{
        const user = await userModel.findOne({email});
        if (!user){
            return res.json({success : false , message : "Something Went Wrong"})
        }
        const isMatch = await bcrypt.compare(password , user.password)
        if (!isMatch){
            return res.json({success : false , message : "Something Went Wrong"})
        };

        const token = jwt.sign({id : user._id} , process.env.JWT_SECRET , {expiresIn : "7d"});
        res.cookie("token" , token , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            maxAge : 7*24*60*60*1000
        });

        return res.json({success : true})

    }
    catch(error){
        return res.json({success : false , message : error.message})
    }
}

export const logout = async (req ,res) =>{
    try{
        res.clearCookie('token' , {
            httpOnly : true,
            secure : process.env.NODE_ENV === 'production',
            sameSite : process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            'none' : 'strict'
        })
        return res.json({success : true , message : "Logged out"})
    }
    catch(error){
        return res.json({success : false , message : error.message})
    }
}

export const sendVerifyOtp = async (req, res) => {
    try {
        const userId = req.userId;  // Get from middleware
        const user = await userModel.findById(userId);

        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.isAccountVerified) {
            return res.json({ success: false, message: "Account Already Verified" });
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now() + 24 * 60 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Account Verification OTP",
            text: `Your OTP is ${otp}. Verify Your Account Using This OTP`
        };
        await tranporter.sendMail(mailOption);

        res.json({ success: true, message: "Verification OTP sent on Email" });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
    const userId = req.userId;  // Get from middleware
    const { otp } = req.body;   // OTP still comes from client

    if (!userId || !otp) {
        return res.json({ success: false, message: "Missing Details" });
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (!user.verifyOtp || user.verifyOtp !== otp) {
            return res.json({ success: false, message: "Invalid OTP" });
        }

        if (user.verifyOtpExpireAt < Date.now()) {
            return res.json({ success: false, message: "OTP Expired" });
        }

        user.isAccountVerified = true;
        user.verifyOtp = "";
        user.verifyOtpExpireAt = 0;

        await user.save();
        return res.json({ success: true, message: "Email Verified Successfully" });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};

export const isAuthenticated = async (req , res) =>{
    try{
        return res.json({success : true})
    }
    catch(error){
        res.json({success : fasle , message : error.message})
    }
}

export const sendResetOtp = async (req , res) =>{
    const {email} = req.body;

    if (!email){
        return res.json({success : false , message : "Email is required"})
    }

    try{
        const user = await userModel.findOne({email});
        if (!user){
            return res.json({success : false , message : "User not found"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15 * 60 * 1000;

        await user.save();

        const mailOption = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: "Password Reset Otp",
            text: `Your OTP for resetting your password is ${otp}. Use this OTP to proceed with resetting your password`
        };
        await tranporter.sendMail(mailOption);

        return res.json({success : true , message : "OTP sent to your email"})
    }
    catch(err){
        return res.json({success : false , message : err.message})
    }
}

export const resetPassword = async (req,res) => {
    const {email , otp , newPassword} = req.body;
    if (!email || !otp || !newPassword){
        return res.json({success : false , message : "Email ,OTP and new Password are required"})
    }

    try{
        const user = await userModel.findOne({email});
        if (!user){
            res.json({success : false , message : "User not found"});
        }

        if (user.resetOtp === "" || user.resetOtp !== otp){
            return res.json({success : false , message : "Invalid OTP"})
        }

        if (user.resetOtpExpireAt < Date.now()){
            return res.json({success : false , message : "OTP Expired"})
        }

        const hashedPassword = await bcrypt.hash(newPassword , 10);
        user.password = hashedPassword;
        user.resetOtp = "";
        user.resetOtpExpireAt = 0;
        await user.save();

        return res.json({success : true, message : "Password has been reset succsessfully"})
    }
    catch(err){
        res.json({success : false , message : err.message})
    }
}