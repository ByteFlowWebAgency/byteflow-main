import Image from 'next/image';
import styles from './TeamCard.module.css';

interface TeamCardProps {
    name: string;
    title: string;
    bio: string;
    imageSrc: string;
}

export default function TeamCard({ name, title, bio, imageSrc }: TeamCardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={imageSrc}
                    alt={name}
                    fill
                    className={styles.image}
                    sizes="(max-width: 768px) 100vw, 33vw"
                />
            </div>
            <div className={styles.content}>
                <h3 className={styles.name}>{name}</h3>
                <p className={styles.title}>{title}</p>
                <p className={styles.bio}>{bio}</p>
            </div>
        </div>
    );
}
