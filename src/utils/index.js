const sgMail = require('@sendgrid/mail');

exports.getRandomCode = (length = 5) => Math
  .random().toString(36).substring(2, 2 + length).toUpperCase();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
exports.sendMail = async (recipientMail, subject, text, html) => {
  const msg = {
    to: recipientMail,
    from: 'usmanah9817@gmail.com',
    subject,
    text,
    html,
  };

  return sgMail.send(msg);
};
