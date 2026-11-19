import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ADMIN,
    pass: process.env.EMAIL_ADMIN_PASS,
  },
});

function hasValidEmailContent({ to, subject, text, html } = {}) {
  const hasText = typeof text === "string" && text.trim().length > 0;
  const hasHtml = typeof html === "string" && html.trim().length > 0;

  return (
    typeof to === "string" &&
    to.trim().length > 0 &&
    typeof subject === "string" &&
    subject.trim().length > 0 &&
    (hasText || hasHtml)
  );
}

export async function sendEmail({ to, subject, text, html } = {}) {
  if (!hasValidEmailContent({ to, subject, text, html })) {
    throw new TypeError("Se requieren to, subject y al menos uno entre text o html.");
  }
  if (!process.env.EMAIL_ADMIN || !process.env.EMAIL_ADMIN_PASS) {
    throw new Error("Faltan EMAIL_ADMIN o EMAIL_ADMIN_PASS en el entorno.");
  }

  return transporter.sendMail({
    from: process.env.EMAIL_ADMIN,
    to: to.trim(),
    subject: subject.trim(),
    ...(typeof text === "string" && { text }),
    ...(typeof html === "string" && { html }),
  });
}

export async function sendEmailController(req, res) {
  const message = req.body ?? {};

  if (!hasValidEmailContent(message)) {
    return res.status(400).json({
      message: "Se requieren to, subject y al menos uno entre text o html.",
    });
  }

  if (!process.env.EMAIL_ADMIN || !process.env.EMAIL_ADMIN_PASS) {
    console.error("Faltan EMAIL_ADMIN o EMAIL_ADMIN_PASS en el entorno.");
    return res.status(500).json({ message: "El correo no está configurado." });
  }

  try {
    const info = await sendEmail(message);
    return res.status(200).json({
      message: "Correo enviado correctamente.",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("No se pudo enviar el correo:", error);
    return res.status(500).json({ message: "No se pudo enviar el correo." });
  }
}