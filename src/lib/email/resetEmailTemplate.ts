export function createResetEmailTemplate(name: string, email: string, resetURL: string, site_name: string) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset your password | ${site_name}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg?t=st=1741295028~exp=1741298628~hmac=0d076f885d7095f0b5bc8d34136cd6d64749455f8cb5f29a924281bafc11b96c&w=1480" alt="${site_name} Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; background-color: white; padding: 10px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">${site_name}</h1>
        </div>
        <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <p style="font-size: 18px; color: #5B86E5;"><strong>Hello ${name},</strong></p>
          <p>Somebody requested a new password for the ${site_name} account associated with ${email}.</p>
          <p>No changes have been made to your account yet.</p>
          <p>You can reset your password by clicking the link below: </p>
          
          
          <div style="text-align: center; margin: 30px 0;">
            <a href=${resetURL} style="background: linear-gradient(to right, #36D1DC, #5B86E5); color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 500; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="margin-bottom: 5px;">If you need any help or have questions, we're always here to assist you.</p>
          <p style="margin-top: 0;">If you did not request a new password, please let us know immediately by replying to this email.</p>
          
          <p style="margin-top: 25px; margin-bottom: 0;">Best regards,<br>The ${site_name} Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 ${site_name}. All rights reserved.</p>
      </body>
      </html>
      `;
}