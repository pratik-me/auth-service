import nodemailer from "nodemailer";
import "dotenv/config";
import { createWelcomeEmailTemplate } from "./emailTemplate.js";


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    service: process.env.SMTP_SERVICE,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    }
})


export const sendEmail = async(to: string, subject: string, templateName: string, site_name: string, verifyURL: string) => {
    try {
        await transporter.verify();

        await transporter.sendMail({
            from: `${process.env.SMTP_USER}`,
            to,
            subject,
            html: createWelcomeEmailTemplate(templateName, verifyURL, site_name),
        });
        return true;
    } catch (error) {
        console.log("Error while sending email:\n", error);
        return false;
    }
}