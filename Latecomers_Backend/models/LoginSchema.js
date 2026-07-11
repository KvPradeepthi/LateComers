const express = require('express')
const mongoose = require('mongoose')

const LoginSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'building'
    },
    building: {
        type: String,
        default: null
    }
});

module.exports  = mongoose.model("LoginSchema" , LoginSchema);
