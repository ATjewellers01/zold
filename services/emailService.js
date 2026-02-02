const { Resend } = require('resend');
require('dotenv').config();

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use this for testing until you verify your domain
      to: to,
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log(`Email sent successfully: ${data.id}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

const sendOTP = async (userEmail, otp) => {
  const subject = 'Your Verification OTP';
  const html = `
    <h2>Verify Your Email</h2>
    <p>Your One-Time Password (OTP) for registration is:</p>
    <h1 style="color: #3D3066; letter-spacing: 5px;">${otp}</h1>
    <p>This code will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
    <br/>
    <p style="color: gray; font-size: 12px;">(Testing Mode: Original recipient was ${userEmail})</p>
  `;
  // In Resend Test Mode, we can ONLY send to the verified email.
  // Redirecting everything to your email for now.
  return await sendEmail('vikashchaudhari103@gmail.com', subject, html);
};

const sendAdminApprovalEmail = async (adminDetails, approvalLink) => {
  const subject = 'Action Required: Approve New Admin User';
  const html = `
    <h2>New Admin Approval Request</h2>
    <p>A new user has signed up and requested Admin access.</p>
    <p><strong>Name:</strong> ${adminDetails.name}</p>
    <p><strong>Email:</strong> ${adminDetails.email}</p>
    <p><strong>Username:</strong> ${adminDetails.username}</p>
    <br/>
    <p>Please click the link below to approve this user as an Admin:</p>
    <a href="${approvalLink}" style="padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Approve Admin</a>
    <p>If you did not expect this, please ignore this email.</p>
  `;
  // Send to super admin
  return await sendEmail('vikashchaudhari103@gmail.com', subject, html);
};

const sendApprovalNotificationToAdmin = async (adminEmail) => {
  const subject = 'Admin Access Approved';
  const html = `
    <h2>Access Approved!</h2>
    <p>Your request for Admin access has been approved.</p>
    <p>You can now log in to the dashboard.</p>
  `;
  return await sendEmail(adminEmail, subject, html);
};

module.exports = {
  sendAdminApprovalEmail,
  sendOTP,
  sendApprovalNotificationToAdmin
};
