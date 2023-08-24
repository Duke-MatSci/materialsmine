const nodemailer = require('nodemailer');

async function sendMail (req, contact) {
  req.logger.info('sendMail Function Entry:');
  const env = req.env;
  const transporter = nodemailer.createTransport({
    host: env.MAIL_SERVER_HOST,
    port: env.MAIL_SERVER_PORT,
    auth: {
      user: env.MAIL_USER_ADDRESS,
      pass: env.MAIL_USER_PASSWORD
    }
  });

  // send mail with defined transport object
  req.logger.info('sending e-mail with defined transport object');
  await transporter.sendMail({
    from: '"Materialsmine ✨" <support@example.com>', // sender address
    to: `${contact.email}`, // list of receivers
    subject: `RE: ${contact.fullName}`, // Subject line
    text: 'Thank You for contacting us', // plain text body
    html: contact.response // html body
  });

  req.logger.info(`Email sent to ${contact.email}`);
}

module.exports = sendMail;
