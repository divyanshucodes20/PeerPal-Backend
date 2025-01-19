export function rideSeatsFullEmail({ rideName, creatorName }) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #007bff;">🚗 Ride Seats Full Notification</h2>
                
                <p>Dear ${creatorName},</p>
                
                <p>We wanted to let you know that your ride request "<strong>${rideName}</strong>" has now reached full capacity. No more seats are available for this ride.</p>
                
                <p>If you would like to update the ride details, extend seat availability, or manage requests, you can do so in your PeerPal dashboard.</p>
                <p>
                Also after the ride is completed, please delete the ride  from your dashboard to help us keep track of the rides and improve the platform for everyone.If not we will delete the ride after 7 days of completion.
                </p>

                <p>Thank you for offering a ride and making commuting easier for others! 🚀</p>
                
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">Need assistance? Contact us from our website's contact us section</p>
            </div>
        </body>
        </html>
    `;
}
export function roommateRequestJoinedEmail({ creatorName, joinerName}) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #007bff;">🏠 Roommate Request Update</h2>
                
                <p>Dear ${creatorName},</p>
                
                <p>Great news! <strong>${joinerName}</strong> has joined your roommate request and is interested in connecting with you. 🤝</p>
                
                <p>
                You can chat with him on the platform,Also if you find convinient roommate, please delete the request  from your dashboard to help us keep track of the requests and improve the platform for everyone.If not we will delete the ride after 7 days of completion.
                </p>
                
                <p>You can now discuss preferences, living arrangements, and finalize your decision. Feel free to reach out to them at your convenience.</p>

                <p>We wish you the best in finding the perfect roommate! 🏡</p>
                
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">Need assistance? Contact us from our website's contact us section</p>
            </div>
        </body>
        </html>
    `;
}
export function rideRequestJoinedEmail({ creatorName, joinerName, rideDetails, rideDate }) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #007bff;">🚗 Ride Request Update</h2>
                
                <p>Dear ${creatorName},</p>
                
                <p>Good news! <strong>${joinerName}</strong> has joined your ride request for:</p>
                <ul>
                    <li><strong>Route:</strong> ${rideDetails}</li>
                    <li><strong>Date:</strong> ${rideDate}</li>
                </ul>
                
                <p>They are trying to connect with you via the PeerPal platform. You can now discuss ride details, pickup points, and any preferences.</p>
                

                <p>Safe travels! 🚀</p>
                
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">Need assistance? Contact us from our website's contact us section</p>
            </div>
        </body>
        </html>
    `;
}

export function learnerRequestFullEmail({ creatorName, topic, teamSize }) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #28a745;">📚 Your Learning Team is Ready!</h2>
                
                <p>Dear ${creatorName},</p>
                
                <p>Great news! Your learning group <strong>"${topic}"</strong> has reached its full capacity of <strong>${teamSize} members</strong>!</p>
                
                <p>Now is the perfect time to connect with your team and start collaborating on your learning journey.</p>
                <p>Happy Learning! 🚀</p>
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">Need assistance? Contact us from our website's contact us section</p>
            </div>
        </body>
        </html>
    `;
}
export function newLearnerJoinedEmail({ creatorName, learnerName, topic}) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #007bff;">🎉 A New Member Has Joined Your Learning Team!</h2>
                
                <p>Dear ${creatorName},</p>
                
                <p>Exciting news! <strong>${learnerName}</strong> has joined your learning group <strong>"${topic}"!</strong></p>
                
                <p>Now is a great time to connect and start collaborating with your new team member.</p>
                
                <p>You can message ${learnerName} directly on PeerPal:</p>
                <p>Keep Learning & Growing! 🚀</p>
                <p>Best Regards,</p>
                <p><strong>The PeerPal Team</strong></p>
                <hr style="border: none; border-top: 1px solid #ddd;">
                <p style="font-size: 12px; color: #777;">Need assistance? Contact us from our website's contact us section</p>
            </div>
        </body>
        </html>
    `;
}


