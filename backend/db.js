const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose.connect("mongodb+srv://manmupa1020:VTBWOn37zBmr30J4@cluster0.kgxuham.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

const UserSchema = Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6,
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50,
    },
})

const accountSchema = Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    balance:{
        type: Number,
        required: true,
    }

})


const Account = mongoose.model("Account", accountSchema);
const User = mongoose.model("User", UserSchema);
module.exports = {User, Account};
