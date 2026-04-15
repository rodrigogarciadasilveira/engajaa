const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'maildev',
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
});

async function sendInviteEmail(email, token) {
  const acceptUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/invite/accept?token=${token}`;

  await transporter.sendMail({
    from: 'no-reply@engajaa.com',
    to: email,
    subject: 'Você foi convidado para o Engajaa',
    html: `
      <h2>Você foi convidado para o Engajaa</h2>
      <p>Clique no link abaixo para aceitar o convite e criar sua senha:</p>
      <a href="${acceptUrl}" style="background:#7C3AED;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
        Aceitar convite
      </a>
      <p>O link expira em 7 dias.</p>
    `,
  });
}

module.exports = { sendInviteEmail };
