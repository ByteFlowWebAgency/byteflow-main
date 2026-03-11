'use client';

import { useState, FormEvent } from 'react';
import styles from './ContactForm.module.css';

interface FormState {
  name: string;
  email: string;
  company: string;
  message: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', company: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // mailto fallback — replace with API route as needed
    const mailto = `mailto:support@byteflowsolutions.com?subject=Inquiry from ${encodeURIComponent(form.name)} — ${encodeURIComponent(form.company)}&body=${encodeURIComponent(form.message)}`;
    window.location.href = mailto;
    setSubmitted(true);
  };

  if (submitted) {
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
      <button type="submit" className={styles.submit}>
        Send Message
      </button>
    </form>
  );
}
