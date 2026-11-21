// Envío de correos. Si hay SMTP_USER y SMTP_PASS (p. ej. Gmail con contraseña de aplicación) se usa SMTP
// y se puede enviar a cualquier persona. Si no, se usa Resend (en modo de prueba solo envía al dueño de la cuenta).
let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;
  const nodemailer = require('nodemailer');
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
};

const usesSmtp = () => Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);

// Lanza una excepción si el envío falla
const sendEmail = async ({ to, subject, html }) => {
  if (usesSmtp()) {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `AgroFinanzas <${process.env.SMTP_USER}>`,
      to, subject, html,
    });
    return;
  }
  const resend = require('../config/resend');
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM || 'AgroFinanzas <onboarding@resend.dev>',
    to, subject, html,
  });
  // El SDK de Resend no lanza excepción cuando falla: devuelve { error }
  if (error) throw error;
};

module.exports = { sendEmail };