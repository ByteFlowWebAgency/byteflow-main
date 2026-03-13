import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

/**
 * POST /api/contact
 *
 * 1. Appends the submission to the Google Sheet via Apps Script webhook.
 * 2. Fires the SendGrid dynamic template as a plain notification.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, email, company, message } = body as {
            name: string;
            email: string;
            company?: string;
            message: string;
        };

        // Basic validation
        if (!name?.trim() || !email?.trim() || !message?.trim()) {
            return NextResponse.json(
                { error: 'Name, email, and message are required.' },
                { status: 400 },
            );
        }

        // ── 1. Log to Google Sheets via Apps Script webhook ──────────────────────
        const sheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
        if (sheetWebhookUrl) {
            try {
                const sheetRes = await fetch(sheetWebhookUrl, {
                    method: 'POST',
                    redirect: 'follow',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, company: company ?? '', message }),
                });
                const sheetText = await sheetRes.text();
                console.log('[contact] Sheets webhook status:', sheetRes.status, sheetText);
            } catch (sheetErr) {
                // Non-fatal: log the error but don't block the email send
                console.error('[contact] Google Sheets webhook error:', sheetErr);
            }
        }

        // ── 2. Send SendGrid notification email ──────────────────────────────────
        await sgMail.send({
            to: email,
            from: process.env.SENDGRID_FROM_EMAIL as string,
            templateId: process.env.SENDGRID_TEMPLATE_ID as string,
        });

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (err: unknown) {
        console.error('[contact] SendGrid error:', err);
        return NextResponse.json(
            { error: 'Failed to send message. Please try again later.' },
            { status: 500 },
        );
    }
}
