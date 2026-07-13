'use client';

import { useState } from 'react';
import styles from './ProposalForm.module.css';
import type { SectionProps } from './ProposalForm';

interface ServicesSectionProps extends SectionProps {
  serviceOptions: string[];
}

export default function ServicesSection({
  proposal,
  dispatch,
  serviceOptions,
}: ServicesSectionProps) {
  const [customLabel, setCustomLabel] = useState('');
  const customServices = proposal.services.filter((s) => s.isCustom);

  const addCustom = () => {
    if (!customLabel.trim()) return;
    dispatch({ type: 'addCustomService', id: crypto.randomUUID(), label: customLabel });
    setCustomLabel('');
  };

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>Services</h2>

      <div className={styles.checkList}>
        {serviceOptions.map((label) => {
          const checked = proposal.services.some((s) => !s.isCustom && s.label === label);
          return (
            <label key={label} className={styles.checkRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={checked}
                onChange={() => dispatch({ type: 'toggleService', label })}
              />
              {label}
            </label>
          );
        })}
      </div>

      <div className={styles.customRow}>
        <input
          className={`${styles.input} ${styles.itemGrow}`}
          type="text"
          value={customLabel}
          placeholder="Add a custom service…"
          aria-label="Custom service name"
          onChange={(e) => setCustomLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <button type="button" className={styles.addButton} style={{ marginTop: 0 }} onClick={addCustom}>
          Add
        </button>
      </div>

      {customServices.length > 0 && (
        <ul className={styles.chipList}>
          {customServices.map((service) => (
            <li key={service.id} className={styles.chip}>
              {service.label}
              <button
                type="button"
                className={styles.removeButton}
                aria-label={`Remove ${service.label}`}
                onClick={() => dispatch({ type: 'removeService', id: service.id })}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
