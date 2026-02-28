'use client';

import { useState } from 'react';
import styles from './ContactForm.module.css';

export default function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        email: '',
        phone: '',
        interest: 'Enterprise Software',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form submitted:', formData);
        // In a real app, integrate an API route here
        alert("Thank you for reaching out. A BYTEFLOW representative will contact you shortly.");
        setFormData({
            name: '',
            company: '',
            email: '',
            phone: '',
            interest: 'Enterprise Software',
            message: ''
        });
    };

    return (
        <div className={styles.formContainer}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="name" className={styles.label}>Full Name</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            required
                            className={styles.input}
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="company" className={styles.label}>Company Name</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            required
                            className={styles.input}
                            value={formData.company}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Work Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className={styles.input}
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    <div className={styles.inputGroup}>
                        <label htmlFor="phone" className={styles.label}>Phone Number</label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            className={styles.input}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="interest" className={styles.label}>Primary Interest</label>
                    <select
                        id="interest"
                        name="interest"
                        className={styles.select}
                        value={formData.interest}
                        onChange={handleChange}
                    >
                        <option value="Enterprise Software">Enterprise Software Solutions</option>
                        <option value="AI Integration">AI Integration</option>
                        <option value="Cloud Migration">Cloud Infrastructure</option>
                        <option value="SEO">SEO & Digital Growth</option>
                        <option value="Other">Other Consulting</option>
                    </select>
                </div>

                <div className={styles.inputGroup}>
                    <label htmlFor="message" className={styles.label}>Project Details</label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className={styles.textarea}
                        value={formData.message}
                        onChange={handleChange}
                    ></textarea>
                </div>

                <button type="submit" className={styles.submitBtn}>
                    Send Message
                </button>
            </form>
        </div>
    );
}
