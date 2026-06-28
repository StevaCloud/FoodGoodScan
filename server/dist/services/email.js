"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResetCode = sendResetCode;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});
async function sendResetCode(toEmail, code) {
    await transporter.sendMail({
        from: `"FoodGoodScan" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'Code de réinitialisation FoodGoodScan',
        html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#111;color:#fff;border-radius:12px;padding:32px;">
        <h1 style="color:#22c55e;margin-top:0;">FoodGoodScan 🥗</h1>
        <h2 style="margin-bottom:8px;">Réinitialisation du mot de passe</h2>
        <p style="color:#aaa;">Tu as demandé à réinitialiser ton mot de passe. Voici ton code :</p>
        <div style="background:#1a1a1a;border:2px solid #22c55e;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#22c55e;">${code}</span>
        </div>
        <p style="color:#aaa;font-size:13px;">Ce code expire dans <strong>15 minutes</strong>.</p>
        <p style="color:#aaa;font-size:13px;">Si tu n'as pas fait cette demande, ignore cet email.</p>
        <hr style="border-color:#333;margin:24px 0;">
        <p style="color:#555;font-size:11px;">FoodGoodScan — Scanner alimentaire &amp; santé</p>
      </div>
    `,
    });
}
