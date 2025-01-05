import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import nodemailer from "nodemailer";
import { ContactRequestBody } from "../types/types.js";

const prisma = new PrismaClient();

export const submitContactForm = async (req: Request<{}, {}, ContactRequestBody>, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    // Save to the database
    const newContact = await prisma.contact.create({
      data: {
        name,
        email,
        subject,
        message,
      },
    });

    // Send email notification
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_PASS, // Your Gmail password or app-specific password
      },
    });

    const mailOptions = {
      from: email,
      to: process.env.GMAIL_USER,
      subject: `New Contact Form Submission: ${subject}`,
      text: `You have a new contact form submission:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    await transporter.sendMail(mailOptions);

    return res.status(201).json({ success: true, message: "Contact form submitted successfully" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
};
