const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
app.use(cors());

require('dotenv').config();
const MONGODB_URL = process.env.MONGODB_URL;

mongoose.connect(MONGODB_URL).then(async function () {
    app.use(logger('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    const indexRouter = require('./routes/index');
    app.use('/', indexRouter);

    console.log('server started');
});

module.exports = app;