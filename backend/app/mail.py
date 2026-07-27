import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from app.config import settings

def send_reset_password_email(recipient_email: str, temporary_password: str):
    subject = "SkinGenie Skincare - Password Reset Request"
    body_text = (
        f"Hello,\n\n"
        f"You requested a password reset for your SkinGenie Skincare account.\n\n"
        f"Your temporary password is: {temporary_password}\n\n"
        f"Please log in using this password and update it in your profile settings.\n\n"
        f"Best regards,\n"
        f"The SkinGenie Skincare Team"
    )
    
    body_html = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; margin-bottom: 20px;">SkinGenie Skincare</h2>
        <p>Hello,</p>
        <p>You requested a password reset for your SkinGenie Skincare account.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">Temporary Password</p>
          <strong style="font-size: 24px; color: #0f172a; letter-spacing: 0.05em; font-family: monospace;">{temporary_password}</strong>
        </div>
        <p>Please log in using this temporary password and update it in your profile settings as soon as possible.</p>
        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
          Best regards,<br>
          <strong>The SkinGenie Skincare Team</strong>
        </p>
      </body>
    </html>
    """

    # Always log email to a file for easy local development verification
    try:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
        os.makedirs(log_dir, exist_ok=True)
        log_file = os.path.join(log_dir, "last_email.txt")
        with open(log_file, "w", encoding="utf-8") as f:
            f.write(f"To: {recipient_email}\n")
            f.write(f"Subject: {subject}\n\n")
            f.write(body_text)
        print(f"[MAIL LOG] Saved forgot-password email copy to: {log_file}")
    except Exception as log_err:
        print(f"[MAIL LOG] Could not save email copy to file: {log_err}")

    # Check if SMTP settings are present
    if not settings.smtp_username or not settings.smtp_password:
        print("[SMTP] No SMTP credentials configured. Email output simulation printed to logs.")
        print(f"--- SIMULATED EMAIL TO {recipient_email} ---")
        print(body_text)
        print("--------------------------------------------")
        return True

    # Send via real SMTP
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.smtp_from_email
        msg["To"] = recipient_email
        
        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        msg.attach(part1)
        msg.attach(part2)

        server = smtplib.SMTP(settings.smtp_host, settings.smtp_port)
        server.starttls()
        server.login(settings.smtp_username, settings.smtp_password)
        server.sendmail(settings.smtp_from_email, recipient_email, msg.as_string())
        server.quit()
        print(f"[SMTP] Successfully sent password reset email to {recipient_email}")
        return True
    except Exception as smtp_err:
        print(f"[SMTP] Failed to send email via SMTP: {smtp_err}")
        return False
