export function createWelcomeEmailTemplate(name: string, verifyURL: string, site_name: string) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ${site_name}</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <img src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg?t=st=1741295028~exp=1741298628~hmac=0d076f885d7095f0b5bc8d34136cd6d64749455f8cb5f29a924281bafc11b96c&w=1480" alt="Chatapp Logo" style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%; background-color: white; padding: 10px;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">Welcome to Chatapp!</h1>
        </div>
        <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
          <p style="font-size: 18px; color: #5B86E5;"><strong>Hello ${name},</strong></p>
          <p>We're excited to have you join our platform!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href=${verifyURL} style="background: linear-gradient(to right, #36D1DC, #5B86E5); color: white; text-decoration: none; padding: 12px 30px; border-radius: 50px; font-weight: 500; display: inline-block;">Verify</a>
          </div>
          
          <p style="margin-bottom: 5px;">If you need any help or have questions, we're always here to assist you.</p>
          <p style="margin-top: 0;">Happy messaging!</p>
          
          <p style="margin-top: 25px; margin-bottom: 0;">Best regards,<br>The ${site_name} Team</p>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
          <p>© 2025 ${site_name}. All rights reserved.</p>
      </body>
      </html>
      `;
}