import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

console.log("EMAIL_USER exists:", !!process.env.EMAIL_USER);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

transporter
  .verify()
  .then(() => {
    console.log("✅ SMTP connection successful");
  })
  .catch((error) => {
    console.error("❌ SMTP connection failed:");
    console.error(error.message);
  });

const sendEmail = async (to, subject, text, html) => {
  console.log("📧 sendEmail called");
  console.log("📧 Sending to:", to);

  try {
    const info = await transporter.sendMail({
      from: `Nexora AI <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("✅ Email sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Email sending error:");
    console.error(error);
    throw error;
  }
};

export default sendEmail;