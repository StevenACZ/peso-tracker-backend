import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is required');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail =
      this.configService.get<string>('email.fromEmail') ||
      'onboarding@resend.dev';
    this.fromName =
      this.configService.get<string>('email.fromName') || 'Peso Tracker';
    this.frontendUrl =
      this.configService.get<string>('cors.origin') || 'http://localhost:3000';
  }

  async sendPasswordResetCode(
    email: string,
    username: string,
    resetCode: string,
  ): Promise<void> {
    try {
      // Load HTML template for code
      const templatePath = join(
        __dirname,
        'templates',
        'reset-password-code.html',
      );
      let htmlTemplate = readFileSync(templatePath, 'utf-8');

      // Replace placeholders
      htmlTemplate = htmlTemplate
        .replace(/{{username}}/g, username)
        .replace(/{{resetCode}}/g, resetCode);

      // Send email
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: [email],
        subject: `🔐 Tu código de recuperación: ${resetCode} - Peso Tracker`,
        html: htmlTemplate,
        text: this.generatePlainTextCodeVersion(username, resetCode),
      });

      if (error) {
        this.logger.error('Failed to send password reset code email', error);
        throw new Error('Failed to send password reset code email');
      }

      this.logger.log(`Password reset code sent successfully to ${email}`, {
        emailId: data?.id,
        recipient: email,
        code: resetCode,
      });
    } catch (error) {
      this.logger.error('Error sending password reset code email', error);
      throw new Error('Failed to send password reset code email');
    }
  }

  private generatePlainTextCodeVersion(
    username: string,
    resetCode: string,
  ): string {
    return `
¡Hola ${username}!

Tu código de recuperación para Peso Tracker es:

${resetCode}

IMPORTANTE:
- Este código expira en 15 minutos
- Solo funciona una vez
- Tienes máximo 3 intentos para usarlo
- Si no solicitaste este cambio, ignora este email

Ingresa este código en tu aplicación Peso Tracker para restablecer tu contraseña.

Por tu seguridad, nunca compartas este código con nadie.

---
Peso Tracker Team
Tu aplicación de seguimiento de peso personal

Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test to verify Resend API key is valid
      const { error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: ['test@example.com'], // This won't actually send
        subject: 'Test Connection',
        html: '<p>Test</p>',
      });

      // If we get a specific error about invalid recipient, API key is valid
      if (error?.message?.includes('Invalid recipient')) {
        return true;
      }

      return !error;
    } catch (error) {
      this.logger.error('Email service connection test failed', error);
      return false;
    }
  }
}
