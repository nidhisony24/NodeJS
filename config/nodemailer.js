// const aws = require("aws-sdk");

// const ses = new aws.SES();
const nodemailer = require("nodemailer");
const { senderEmail } = require("../utils/WebData");

async function sendWithTemplate(to, subject, message) {

  // const nodemailerTransport = nodemailer.createTransport({
  //   SES: ses
  // });
  //
  // await nodemailerTransport.sendMail({
  //   from: senderEmail,
  //   to: to, // list of receivers
  //   subject: subject, // Subject line
  //   html: message, // html text body
  // },function (err, info) {
  //   if (err) {
  //       console.log("Error : ", err);
  //   } else {
  //       console.log('Message sent: ' + info.response);
  //   }
  // });

  const nodemailerTransport = nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 2525,
    ssl: false,
    tls: true,
    auth: {
      user: 'a5f005de7d5eba', // your Mailtrap username
      pass: '9de3b2b53b51eb' //your Mailtrap password
    }
  });

  await nodemailerTransport.sendMail({
    from: senderEmail,
    to: to, // list of receivers
    subject: subject, // Subject line
    html: message, // html text body
  },function (err, info) {
    if (err) {
        console.log("Error : ", err);
    } else {
        console.log('Message sent: ' + info.response);
    }
  });

}

module.exports = { sendWithTemplate };