export function VerificationEmail({ username, otp }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PeerPal Verification Code</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 20px auto;
                background: #ffffff;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                font-size: 24px;
                font-weight: bold;
                color: #2d89ff;
                margin-bottom: 20px;
            }
            .content {
                font-size: 16px;
                color: #333;
                line-height: 1.6;
            }
            .otp {
                font-size: 22px;
                font-weight: bold;
                color: #2d89ff;
                text-align: center;
                padding: 15px;
                background: #f3f8ff;
                border-radius: 5px;
                margin: 20px 0;
            }
            .footer {
                font-size: 14px;
                text-align: center;
                color: #777;
                margin-top: 20px;
            }
            .button {
                display: inline-block;
                padding: 12px 20px;
                font-size: 16px;
                color: #fff;
                background-color: #2d89ff;
                text-decoration: none;
                border-radius: 5px;
                text-align: center;
                margin-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">PeerPal Verification</div>
            <div class="content">
                <p>Hello <b>${username}</b>,</p>
                <p>Thank you for signing up for PeerPal! To complete your registration, please use the following verification code:</p>
                <div class="otp">${otp}</div>
                <p>If you did not request this code, please ignore this email.</p>
                <p>Best regards, <br><b>PeerPal Team</b></p>
            </div>
            <div class="footer">
                &copy; 2025 PeerPal. All rights reserved.
            </div>
        </div>
    </body>
    </html>
  `;
}
