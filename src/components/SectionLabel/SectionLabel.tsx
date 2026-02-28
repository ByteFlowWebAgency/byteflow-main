import styles from './SectionLabel.module.css';

interface SectionLabelProps {
    label: string;
}

export default function SectionLabel({ label }: SectionLabelProps) {
    return <p className={styles.label}>{label}</p>;
}
