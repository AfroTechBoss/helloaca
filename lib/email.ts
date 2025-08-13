import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('Missing RESEND_API_KEY environment variable');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.NEXT_PUBLIC_RESEND_FROM_EMAIL || 'noreply@yourdomain.com';
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@yourdomain.com';
// const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@yourdomain.com';

// Email templates
const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to helloaca - Hello AI Contract Analyzer',
    template: (name: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to ACA!</h1>
        <p>Hi ${name},</p>
        <p>Thank you for joining helloaca - Hello AI Contract Analyzer. We're excited to help you analyze contracts with the power of AI.</p>
        <p>Here's what you can do with your account:</p>
        <ul>
          <li>Upload and analyze contracts instantly</li>
          <li>Get detailed risk assessments</li>
          <li>Receive actionable recommendations</li>
          <li>Export professional reports</li>
        </ul>
        <p>Get started by uploading your first contract!</p>
        <p>Best regards,<br>The ACA Team</p>
      </div>
    `,
  },
  ANALYSIS_COMPLETE: {
    subject: 'Your contract analysis is ready',
    template: (contractTitle: string, riskScore: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Analysis Complete</h1>
        <p>Your contract analysis for "${contractTitle}" is now ready.</p>
        <p><strong>Risk Score:</strong> ${riskScore}/10</p>
        <p>Log in to your dashboard to view the detailed analysis and recommendations.</p>
        <p>Best regards,<br>The ACA Team</p>
      </div>
    `,
  },
  SUBSCRIPTION_WELCOME: {
    subject: 'Welcome to ACA Pro!',
    template: (planName: string, features: string[]) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to ${planName}!</h1>
        <p>Thank you for upgrading to ${planName}. You now have access to:</p>
        <ul>
          ${features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <p>Start exploring your new features in your dashboard.</p>
        <p>Best regards,<br>The ACA Team</p>
      </div>
    `,
  },
  CREDITS_LOW: {
    subject: 'Your ACA credits are running low',
    template: (creditsRemaining: number) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #f59e0b;">Credits Running Low</h1>
        <p>You have ${creditsRemaining} credits remaining in your account.</p>
        <p>To continue analyzing contracts, consider upgrading your plan or purchasing additional credits.</p>
        <p>Best regards,<br>The ACA Team</p>
      </div>
    `,
  },
  PASSWORD_RESET: {
    subject: 'Reset your ACA password',
    template: (resetLink: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset</h1>
        <p>You requested to reset your password. Click the link below to create a new password:</p>
        <p><a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Password</a></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The ACA Team</p>
      </div>
    `,
  },
  CONTACT_FORM: {
    subject: 'New contact form submission',
    template: (name: string, email: string, company: string, message: string) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Company:</strong> ${company || 'Not provided'}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      </div>
    `,
  },
};

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: EMAIL_TEMPLATES.WELCOME.subject,
      html: EMAIL_TEMPLATES.WELCOME.template(name),
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

// Send analysis complete email
export async function sendAnalysisCompleteEmail(
  email: string,
  contractTitle: string,
  riskScore: number
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: EMAIL_TEMPLATES.ANALYSIS_COMPLETE.subject,
      html: EMAIL_TEMPLATES.ANALYSIS_COMPLETE.template(contractTitle, riskScore),
    });

    if (error) {
      console.error('Error sending analysis complete email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending analysis complete email:', error);
    return { success: false, error };
  }
}

// Send subscription welcome email
export async function sendSubscriptionWelcomeEmail(
  email: string,
  planName: string,
  features: string[]
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: EMAIL_TEMPLATES.SUBSCRIPTION_WELCOME.subject,
      html: EMAIL_TEMPLATES.SUBSCRIPTION_WELCOME.template(planName, features),
    });

    if (error) {
      console.error('Error sending subscription welcome email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending subscription welcome email:', error);
    return { success: false, error };
  }
}

// Send low credits warning email
export async function sendCreditsLowEmail(email: string, creditsRemaining: number) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: EMAIL_TEMPLATES.CREDITS_LOW.subject,
      html: EMAIL_TEMPLATES.CREDITS_LOW.template(creditsRemaining),
    });

    if (error) {
      console.error('Error sending credits low email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending credits low email:', error);
    return { success: false, error };
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: EMAIL_TEMPLATES.PASSWORD_RESET.subject,
      html: EMAIL_TEMPLATES.PASSWORD_RESET.template(resetLink),
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error };
  }
}

// Send contact form email to admin
export async function sendContactFormEmail(
  name: string,
  email: string,
  company: string,
  message: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [SUPPORT_EMAIL],
      subject: EMAIL_TEMPLATES.CONTACT_FORM.subject,
      html: EMAIL_TEMPLATES.CONTACT_FORM.template(name, email, company, message),
      replyTo: email,
    });

    if (error) {
      console.error('Error sending contact form email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending contact form email:', error);
    return { success: false, error };
  }
}

// Send custom email
export async function sendCustomEmail(
  to: string | string[],
  subject: string,
  html: string,
  replyTo?: string
) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error('Error sending custom email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { success: false, error };
  }
}

// Send bulk emails (for newsletters, announcements)
export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string
) {
  try {
    const results = [];
    
    // Send in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: batch,
        subject,
        html,
      });
      
      results.push({ batch: i / batchSize + 1, success: !error, data, error });
      
      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return { success: true, results };
  } catch (error) {
    console.error('Error sending bulk email:', error);
    return { success: false, error };
  }
}