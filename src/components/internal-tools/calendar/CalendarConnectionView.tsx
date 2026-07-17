import DisconnectButton from './DisconnectButton';
import styles from './CalendarConnection.module.css';

/**
 * The presentation of the Google Calendar connection card — pure props, no data access,
 * so both states can be rendered and reviewed without a live Google grant. The server
 * component (CalendarConnection) does the fetching and hands the result here.
 *
 * Colour is never the only signal: the state is spelled out ("Connected" / "Not
 * connected") and the success tint only reinforces the text.
 */

export type ConnectionNotice = { message: string; tone: 'ok' | 'bad' };

export interface CalendarConnectionViewProps {
  /** False when GOOGLE_CLIENT_ID/SECRET or Supabase env are missing. */
  configured: boolean;
  connected: boolean;
  /** Which Google account is connected, when known. */
  googleEmail?: string | null;
  notice?: ConnectionNotice;
}

export default function CalendarConnectionView({
  configured,
  connected,
  googleEmail,
  notice,
}: CalendarConnectionViewProps) {
  return (
    <div className={styles.card}>
      <div className={styles.body}>
        <span className={styles.title}>
          Google Calendar
          <span className={connected ? styles.pillOn : styles.pillOff}>
            {connected ? 'Connected' : 'Not connected'}
          </span>
        </span>
        <p className={styles.description}>
          {connected ? (
            <>
              Reading upcoming meetings
              {googleEmail ? (
                <>
                  {' '}
                  from <strong className={styles.email}>{googleEmail}</strong>
                </>
              ) : null}
              . Read-only — ByteFlow never edits your calendar.
            </>
          ) : (
            <>
              Connect your calendar to match upcoming meetings to CRM records. Read-only
              access to events; you can disconnect at any time.
            </>
          )}
        </p>
        {notice ? (
          <p
            className={notice.tone === 'ok' ? styles.noticeOk : styles.noticeBad}
            role="status"
          >
            {notice.message}
          </p>
        ) : null}
      </div>

      <div className={styles.actions}>
        {!configured ? (
          <span className={styles.disabledNote}>Not configured</span>
        ) : connected ? (
          <DisconnectButton />
        ) : (
          // A plain link, not fetch(): the OAuth flow is a top-level navigation to Google.
          <a className={styles.connect} href="/api/google/connect">
            Connect
          </a>
        )}
      </div>
    </div>
  );
}
