require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3500;
const { ValidationError } = require("express-validation");
const LoginRoutes = require("./routes/nonAuthRoutes");
const AuthRoutes = require("./routes/authRoutes");
const path = require("path");
const { Model } = require("objection");
const knexConfig = require("./knexfile");
const knex = require('knex');
Model.knex(knex(knexConfig[process.env.NODE_ENV]));
const AppError = require('./utils/appError');
const globalErrHandler = require('./controllers/errorController');



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// require("./db");
app.use("/api/auth/", LoginRoutes);

app.use("/api/", AuthRoutes);

app.use(express.static(path.join(__dirname, 'public')));


// handle undefined Routes
// app.use('*', (req, res, next) => {
//   const err = new AppError(404, 'fail', 'undefined route');
//   next(err, req, res, next);
// });

app.use(globalErrHandler);

app.listen(port, () => {
  console.log(`app is running at http://localhost:${port}`);
});
