// Envío de correos. Orden de prioridad:
//  1) Brevo por API HTTPS (BREVO_API_KEY + MAIL_FROM_EMAIL): envía a cualquier persona, sin dominio propio,
//     y funciona en Render gratis (que bloquea los puertos SMTP).
//  2) SMTP (SMTP_USER + SMTP_PASS): solo funciona en hosting que no bloquee SMTP.
//  3) Resend (en modo de prueba solo envía al dueño de la cuenta de Resend).
const TIMEOUT_MS = 10000;
let transporter = null;

const sendWithBrevo = async ({ to, subject, html }) => {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { name: process.env.MAIL_FROM_NAME || 'AgroFinanzas', email: process.env.MAIL_FROM_EMAIL },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Brevo ${res.status}: ${body.slice(0, 300)}`);
  }
};

const sendWithSmtp = async ({ to, subject, html }) => {
  if (!transporter) {
    const nodemailer = require('nodemailer');
    const port = Number(process.env.SMTP_PORT) || 465;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      // Sin esto, si el hosting bloquea el puerto la petición se queda colgada
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });
  }
  await transporter.sendMail({
    from: process.env.MAIL_FROM || `AgroFinanzas <${process.env.SMTP_USER}>`,
    to, subject, html,
  });
};

const sendWithResend = async ({ to, subject, html }) => {
  const resend = require('../config/resend');
  const { error } = await resend.emails.send({
    from: process.env.MAIL_FROM || 'AgroFinanzas <onboarding@resend.dev>',
    to, subject, html,
  });
  // El SDK de Resend no lanza excepción cuando falla: devuelve { error }
  if (error) throw error;
};

// Lanza una excepción si el envío falla
const sendEmail = async (mail) => {
  if (process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL) return sendWithBrevo(mail);
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return sendWithSmtp(mail);
  return sendWithResend(mail);
};

module.exports = { sendEmail };