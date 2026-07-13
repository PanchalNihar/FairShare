import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
{
    username:{
        type:String,
        required:true,
        trim:true
    },

    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },

    password:{
        type:String,
        required:true,
        minlength:6
    },

    mobileNumber:{
        type:String,
        unique:true,
        sparse:true,
        trim:true
    },

    googleId:{
        type:String,
        unique:true,
        sparse:true,
        trim:true
    },

    avatar:{
        type:String,
        default:""
    }
},
{
    timestamps:true
});

export default mongoose.model("User",userSchema);