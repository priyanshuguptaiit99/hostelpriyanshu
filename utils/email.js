const sgMail = require('@sendgrid/mail');

const sendEmail = async (options) => {
  // Check if SendGrid is configured
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured. Please add SENDGRID_API_KEY to environment variables.');
  }

  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error('SendGrid from email not configured. Please add SENDGRID_FROM_EMAIL to environment variables.');
  }

  // Set SendGrid API key
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  // Prepare email message
  const message = {
    to: options.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: options.subject,
    html: options.html
  };

  // Send email via SendGrid
  await sgMail.send(message);
};

module.exports = sendEmail;
