import { env, isProduction } from '../../config/env.js';
import { logger } from '../../config/logger.js';

/**
 * MailerSend HTTP API service — instantiated once at module-load.
 * Uses MailerSend's REST API instead of SMTP to avoid SSL/TLS negotiation issues.
 * Falls back to dev logger if API_TOKEN is not set.
 */
const API_TOKEN = env.MAILERSEND_API_TOKEN || null;
const API_URL = 'https://api.mailersend.com/v1/email';

export const mailService = {
  async sendPasswordResetEmail(email, rawToken) {
    const resetUrl = `${env.PUBLIC_APP_URL}/reset-password?token=${rawToken}`;
    const minutes = env.PASSWORD_RESET_EXPIRES_IN_MIN;

    // Debug: Check if API token is configured (don't log the actual token for security)
    logger.debug(
      { hasApiToken: !!API_TOKEN },
      `MailerSend API token check`
    );

    if (!API_TOKEN) {
      logger.info(
        { email, resetUrl },
        `Password reset email (dev mode, API token not configured): reset URL valid for ${minutes} min`,
      );
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: env.MAIL_FROM,
          },
          to: [
            {
              email: email,
            }
          ],
          subject: 'Reset your Docio password',
          html: `<p>Reset your password (valid for ${minutes} minutes).</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
          text: `Reset your password (link valid for ${minutes} minutes):\n${resetUrl}`,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(
          { status: response.status, error: errorText, email },
          `MailerSend API error`
        );
        throw new Error(`MailerSend API failed with status ${response.status}`);
      }

      logger.info(
        { email },
        `Password reset email sent successfully via MailerSend API`
      );
    } catch (error) {
      logger.error(
        { error: error.message, email },
        `Failed to send password reset email via MailerSend API`
      );
      // Re-throw so the calling code knows email failed
      throw error;
    }
  },
};