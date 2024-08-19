const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Email = require('../model/Email');
const formidable = require('formidable');

dotenv.config();

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (req, res) => {
  const { recipient, subject, body, senderEmail, name, conversationId } = req.body;
  const frontendId = req.headers['x-frontend-id'];

  if (frontendId !== 'orionship') {
    console.error('Unauthorized request: Invalid frontend ID');
    return res.status(403).json({ error: 'Unauthorized request' });
  }

  if (!recipient || !subject || !body || !senderEmail) {
    console.error('Missing fields:', { recipient, subject, body, senderEmail });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  let convoId = conversationId;
  if (!convoId) {
    convoId = new mongoose.Types.ObjectId(); // Generate a new conversation ID
  }

  const msg = {
    to: recipient,
    from: `${name}@${process.env.ORION_CANVA_EMAIL}`,
    replyTo: `${name}@${process.env.ORION_CANVA_EMAIL}`,
    subject: subject,
    text: body,
    html: body,
    headers: {
      'Message-ID': `<${convoId}@orioncanva.com>`, // Include the conversation ID in the email headers
    }
  };

  if (conversationId) {
    msg.headers['In-Reply-To'] = `<${conversationId}@orioncanva.com>`;
    msg.headers['References'] = `<${conversationId}@orioncanva.com>`;
  }

  try {
    const result = await sgMail.send(msg);
    console.log('Email sent successfully:', result);

    const email = new Email({
      subject: subject,
      from: `${name}@${process.env.ORION_CANVA_EMAIL}`,
      replyTo: senderEmail,
      to: [recipient],
      body: body,
      sentAt: new Date(),
      conversationId: convoId, // Assign conversation ID
    });
    await email.save();
    console.log('Email saved to MongoDB');

    res.status(200).json({ message: 'Email sent successfully', result });
  } catch (error) {
    console.error('Error sending email:', error.response ? error.response.body.errors : error.message);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
};

const getAllEmails = async (req, res) => {
  try {
    const emails = await Email.find({});
    console.log('Fetched all emails from MongoDB');
    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    res.status(500).json({ error: 'Failed to fetch emails', details: error.message });
  }
};

const receiveEmail = (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error('Error parsing incoming form data:', err);
      return res.status(500).send('Error parsing form data');
    }

    console.log('Received inbound email fields:', fields);
    console.log('Received inbound email files:', files);

    // Extract relevant fields
    const emailData = fields;
    const conversationId = emailData['in-reply-to'] ? emailData['in-reply-to'].replace(/[<>]/g, '') : null;

    const email = new Email({
      subject: emailData.subject[0],
      from: emailData.from[0],
      to: emailData.to,
      body: emailData.text[0],
      receivedAt: new Date(),
      conversationId: conversationId, // Assign conversation ID if available
    });

    email.save()
      .then(() => {
        console.log('Inbound email saved to MongoDB');
        res.status(200).send('Email received and saved.');
      })
      .catch((error) => {
        console.error('Error saving inbound email to MongoDB:', error);
        res.status(500).send('Error saving email to MongoDB.');
      });
  });
};

const getEmailsByConversationId = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const emails = await Email.find({ conversationId });
    console.log('Fetched emails by conversationId from MongoDB');
    res.status(200).json(emails);
  } catch (error) {
    console.error('Error fetching emails by conversationId:', error);
    res.status(500).json({ error: 'Failed to fetch emails by conversationId', details: error.message });
  }
};

module.exports = { sendEmail, receiveEmail, getAllEmails, getEmailsByConversationId };
