import UserModel from '../models/User.js'
import ChatsModel from '../models/ChatModel.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import transporter from '../config/emailConfig.js'


class UserController {
  static userRegistration = async (req, res) => {
    const { name, email, password } = req.body
    const user = await UserModel.findOne({ email: email })
    
    if (user) {
      res.send({ "status": "failed", "message": "Email already exists" })
    } else {
      if (name && email && password) {
          try {
            const salt = await bcrypt.genSalt(10)
            const hashPassword = await bcrypt.hash(password, salt)
            const doc = new UserModel({
              name: name,
              email: email,
              password: hashPassword,
            });
            await doc.save()
            const saved_user = await UserModel.findOne({ email: email })
            // Generate JWT Token
            const token = jwt.sign({ userID: saved_user._id,userEmail:saved_user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })
            console.log("user registered")
            res.status(201).send({ "status": "success", "message": "Registration Success", "token": token })
          } catch (error) {
            console.log(error)
            res.send({ "status": "failed", "message": "Unable to Register" })
          }
      } else {
        res.send({ "status": "failed", "message": "All fields are required" })
      }
    }
  }


  static userLogin = async (req, res) => {
    try {
      const { email, password } = req.body
      console.log("received login request")
      if (email && password) {
        const user = await UserModel.findOne({ email: email })
        console.log("a")
        if (user != null) {
          console.log(password,user.password)
          const isMatch = await bcrypt.compare(password, user.password,)
          console.log("b",isMatch)
          console.log(user.email , email,isMatch)
          delete(user?._doc?.password)
          if ((user.email === email) && isMatch) {
            // Generate JWT Token
            const token = jwt.sign({ userID: user._id,userEmail:user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' })
            res.send({ "status": "success", "message": "Login Success", "token": token ,...user})
          } else {
            res.send({ "status": "failed", "message": "Email or Password is not Valid" })
          }
        } else {
          res.send({ "status": "failed", "message": "You are not a Registered User" })
        }
      } else {
        res.send({ "status": "failed", "message": "All Fields are Required" })
      }
    } catch (error) {
      console.log(error)
      res.send({ "status": "failed", "message": "Unable to Login" })
    }
  }

  static changeUserPassword = async (req, res) => {
    console.log("pass change req");
    const { password, password_confirmation } = req.body
    if (password && password_confirmation) {
      if (password !== password_confirmation) {
        res.send({ "status": "failed", "message": "New Password and Confirm New Password doesn't match" })
      } else {
        const salt = await bcrypt.genSalt(10)
        const newHashPassword = await bcrypt.hash(password, salt)
        await UserModel.findByIdAndUpdate(req.user._id, { $set: { password: newHashPassword } })
        res.send({ "status": "success", "message": "Password changed succesfully" })
      }
    } else {
      res.send({ "status": "failed", "message": "All Fields are Required" })
    }
  }

  static loggedUser = async (req, res) => {
    res.send({ "user": req.user })
  }

  static sendUserPasswordResetEmail = async (req, res) => {
    const { email } = req.body
    if (email) {
      const user = await UserModel.findOne({ email: email })
      if (user) {
        const secret = user._id + process.env.JWT_SECRET_KEY
        const token = jwt.sign({ userID: user._id }, secret, { expiresIn: '15m' })
        //frontend link 1:48:09
        const link = `https://api.richin.in:5000/api/user/reset/${user._id}/${token}`
        console.log(link)
        // // Send Email
        let info = await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "RichIn - Password Reset Link",
          html: `<a href=${link}>Click Here</a> to Reset Your Password`
        })
        res.send({ "status": "success", "message": "Password Reset Email Sent... Please Check Your Email" })
      } else {
        res.send({ "status": "failed", "message":"Email doesn't exists" })
      }
    } else {
      res.send({ "status": "failed", "message": "Email Field is Required" })
    }
  }

  static canChatToday = async (req,res)=>{
    console.log("checking")
    try{

      const chatSchema = await ChatsModel.findOne({id:1});
      console.log(chatSchema);
      if(!chatSchema){
        const chat = await new ChatsModel({
          id:1,
          totalChats:0,
          limit:200,
          date:new Date().toDateString()}
        )
        await chat.save();
      }else{
        console.log(chatSchema);
        if(new Date().toDateString() ==  new Date(chatSchema.date).toDateString()){
          if(chatSchema.totalChats + 1 > chatSchema.limit){
            return res.json({message:"Daily chat limit exceded",status:400,data:false})
          }
        }else{
          chatSchema.date = new Date().toDateString();
          if(chatSchema.totalChats + 1 > chatSchema.limit){
            return res.json({message:"Daily chat limit exceded",status:400,data:false})
          }
        }
      }
      chatSchema.totalChats += 1;
      chatSchema.save();

      return res.json({message:"You can chat further",status:200,data:true})
    }catch(err){
      console.log(err);
    }
  }

  static userPasswordReset = async (req, res) => {
    const { password, password_confirmation } = req.body
    const { id, token } = req.params
    const user = await UserModel.findById(id)
    const new_secret = user._id + process.env.JWT_SECRET_KEY
    try {
      jwt.verify(token, new_secret)
      if (password && password_confirmation) {
        if (password !== password_confirmation) {
          res.send({ "status": "failed", "message": "New Password and Confirm New Password doesn't match" })
        } else {
          const salt = await bcrypt.genSalt(10)
          const newHashPassword = await bcrypt.hash(password, salt)
          await UserModel.findByIdAndUpdate(user._id, { $set: { password: newHashPassword } })
          res.send({ "status": "success", "message": "Password Reset Successfully" })
        }
      } else {
        res.send({ "status": "failed", "message": "All Fields are Required" })
      }
    } catch (error) {
      console.log(error)
      res.send({ "status": "failed", "message": "Invalid Token" })
    }
  }
}

export default UserController