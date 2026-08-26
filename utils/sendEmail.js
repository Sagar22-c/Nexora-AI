// import dotenv from "dotenv";
// import nodemailer from "nodemailer";

// dotenv.config();

// const transporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: false,

//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },

//   tls: {
//     minVersion: "TLSv1.2",
//   },
// });

// const sendEmail = async (to, subject, text, html) => {
//   try {
//     console.log("📧 sendEmail called");
//     console.log("📧 Sending to:", to);

//     const info = await transporter.sendMail({
//       from: `Nexora AI <${process.env.EMAIL_USER}>`,
//       to,
//       subject,
//       text,
//       html,
//     });

//     console.log("✅ Email sent successfully");
//     console.log("📨 Message ID:", info.messageId);

//     return info;
//   } catch (error) {
//     console.error("❌ Email sending error:");
//     console.error(error);

//     throw error;
//   }
// };

// export default sendEmail;