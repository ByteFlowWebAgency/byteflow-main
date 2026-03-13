'use client';

import { useState, FormEvent } from 'react';
import styles from './ContactForm.module.css';

interface FormState {
  name: string;
  email: string;
  company: string;
  message: string;
}

type Status = 'idle' | 'loading' | 'success' | 'error';

/**
 * Contact form that POSTs to /api/contact.
 * The API route logs the submission to Google Sheets and fires a SendGrid notification.
 */
export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', company: '', message: '' });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'Something went wrong. Please try again.');
      }

      setStatus('success');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className={styles.success}>
        <p className={styles.successText}>Your message is on the way. We&apos;ll be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="name" className={styles.label}>Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className={styles.input}
            value={form.name}
            onChange={handleChange}
            placeholder="Jane Smith"
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className={styles.input}
            value={form.email}
            onChange={handleChange}
            placeholder="jane@company.com"
          />
        </div>
      </div>
      <div className={styles.field}>
        <label htmlFor="company" className={styles.label}>Company</label>
        <input
          id="company"
          name="company"
          type="text"
          className={styles.input}
          value={form.company}
          onChange={handleChange}
          placeholder="Acme Corp"
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="message" className={styles.label}>Message</label>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className={styles.textarea}
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us about your project..."
        />
      </div>

      {status === 'error' && (
        <p className={styles.errorMsg}>{errorMsg}</p>
      )}

      <button type="submit" className={styles.submit} disabled={status === 'loading'}>
        {status === 'loading' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
