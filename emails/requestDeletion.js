export function requestDeletionEmail({ requestType, username }) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #e63946;">Important Notice from PeerPal</h2>
                
                <p>Dear ${username},</p>
                
                <p>We regret to inform you that your <strong>${requestType}</strong> request has been deleted due to unforeseen circumstances.</p>
                
                <p>We understand this may be inconvenient, and we sincerely apologize for any disruption this may have caused. If you believe this was a mistake or need further assistance, please feel free to contact our support team.</p>
                
                <p>We value your presence on PeerPal and appreciate your understanding.</p>
                
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">If you want more details Please contact us from our webiste Contact Us Section
                </a>.</p>
            </div>
        </body>
        </html>
    `;
}

