import nodemailer from 'nodemailer'
import { env } from '../../config/env'

export const mailer = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: false,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
})

export async function sendInviteEmail(to: string, orgName: string, token: string) {
  const inviteUrl = `${env.APP_URL}/invites/${token}`

  await mailer.sendMail({
    from: env.SMTP_FROM,
    to,
    subject: `Você foi convidado para ${orgName} no Kortex`,
    html: `
      <h2>Você recebeu um convite!</h2>
      <p>Você foi convidado para fazer parte da organização <strong>${orgName}</strong> no Kortex.</p>
      <p>Clique no link abaixo para aceitar o convite:</p>
      <a href="${inviteUrl}" style="background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;">
        Aceitar convite
      </a>
      <p>Este link expira em 7 dias.</p>
      <p>Se você não esperava este convite, pode ignorar este email.</p>
    `,
  })
}