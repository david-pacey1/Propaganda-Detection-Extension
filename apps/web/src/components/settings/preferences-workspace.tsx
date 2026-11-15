import { useState } from 'react';
import { Eye, ShieldCheck, Loader2, Check, Mail, ArrowUpRight, LogOut, KeyRound, Copy, Trash2, Puzzle } from 'lucide-react';
import type { RecordModel } from 'pocketbase';
import { useAuth } from '@/hooks/use-auth';
import { usePocketbaseRecords } from '@/hooks/use-pocketbase-records';
import { AuthDialog } from '@/components/auth-dialog';
import { pocketbaseClient } from '@/lib/pocketbase-client';
import { formatDate } from '@/lib/intl-format';
import { clearChatHistory } from '@/api/integrated-ai-api';

type PreferenceRecord = RecordModel & { payload: { highlights: boolean } };
type ExtensionToken = RecordModel & { token: string; label: string; owner: string; created: string };

export function PreferencesWorkspace() {
  const auth = useAuth();
  const prefs = usePocketbaseRecords<PreferenceRecord>('reading_preferences', { enabled: auth.isAuthed });
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const tokens = usePocketbaseRecords<ExtensionToken>('extension_tokens', { enabled: auth.isAuthed, sort: '-created' });
  const [newToken, setNewToken] = useState('');
  const [copied, setCopied] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
  const enabled = prefs.records[0]?.payload?.highlights !== false;

  const toggle = async () => {
    if (!auth.isAuthed) { setAuthOpen(true); return; }
    setSaving(true);
    try {
      const record = prefs.records[0];
      const payload = { highlights: !enabled };
      if (record) await prefs.update(record.id, { payload });
      else await prefs.create({ owner: auth.user!.id, payload });
      setNotice('Reading preference saved to your account.');
    } catch {
      setNotice('We couldn’t save this preference. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const verification = async () => {
    setBusy(true);
    try {
      await pocketbaseClient.collection('users').requestVerification(String(auth.user?.email));
      setNotice('Verification email sent. Check your inbox, then return here.');
    } catch {
      setNotice('We couldn’t send the verification email. Please try again later.');
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setBusy(true);
    try {
      await pocketbaseClient.collection('users').authRefresh();
      setNotice('Your account status has been refreshed.');
    } catch {
      setNotice('Please sign in again to refresh your account.');
    } finally {
      setBusy(false);
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await clearChatHistory();
      setNotice('AI history permanently deleted. Saved analyses are unchanged.');
      setConfirmClear(false);
    } catch {
      setNotice('History could not be deleted. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!auth.isAuthed) { setAuthOpen(true); return; }
    setGenBusy(true);
    try {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const token = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await tokens.create({ owner: auth.user!.id, token, label: 'Browser extension' });
      setNewToken(token);
      setNotice('Extension link token created. Copy it into the extension popup.');
    } catch {
      setNotice('Could not create a token. Try again.');
    } finally {
      setGenBusy(false);
    }
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(newToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setNotice('Copy failed — select the token and copy manually.');
    }
  };

  const revoke = async (id: string) => {
    try {
      await tokens.remove(id);
      setNotice('Token revoked.');
    } catch {
      setNotice('Could not revoke token.');
    }
  };

  return (
    <main className="page-content secondary-page">
      <div className="page-title">
        <span className="eyebrow">YOU’RE IN CONTROL</span>
        <h1>Your space.<br /><span>Your preferences.</span></h1>
        <p>Make the context layer work for the way you read.</p>
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}

      <section className="settings-section">
        <div className="settings-heading"><Eye size={21} /><h2>Reading experience</h2></div>
        <div className="setting-row">
          <div>
            <h3>Subtle text highlights</h3>
            <p>Highlight detected phrases in the imported post. Context notes remain available when highlights are off.</p>
          </div>
          <button
            role="switch"
            aria-checked={enabled}
            aria-label="Subtle text highlights"
            disabled={saving || prefs.isLoading || Boolean(prefs.error)}
            className={`toggle-switch ${enabled ? 'toggle-on' : ''}`}
            onClick={() => void toggle()}
          >
            <span>{saving && <Loader2 size={11} className="spin" />}</span>
          </button>
        </div>
        {Boolean(prefs.error) && (
          <p className="error-text">Reading preferences could not be loaded. <button onClick={() => void prefs.reload()}>Try again</button></p>
        )}
        <p className="fine-print">Preferences are saved to your account. Dismiss context notes in your feed at any time.</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><Mail size={21} /><h2>Your account</h2></div>
        {auth.isLoading ? (
          <p>Loading account…</p>
        ) : !auth.isAuthed ? (
          <div className="setting-row">
            <div>
              <h3>A personal workspace</h3>
              <p>Sign in to analyze content, save perspectives and sync preferences.</p>
            </div>
            <button className="secondary-button" onClick={() => setAuthOpen(true)}>Sign in<ArrowUpRight size={15} /></button>
          </div>
        ) : (
          <>
            <div className="setting-row">
              <div>
                <h3>{auth.user?.name || 'Your account'}</h3>
                <p>{auth.user?.email}</p>
              </div>
              <span className={`available-badge ${!auth.user?.verified ? 'verification-pending' : ''}`}>
                {auth.user?.verified ? <><Check size={14} />Email verified</> : 'Verification required'}
              </span>
            </div>
            {!auth.user?.verified && (
              <div className="account-controls">
                <button disabled={busy} className="secondary-button" onClick={() => void verification()}>Resend verification</button>
                <button disabled={busy} className="text-button" onClick={() => void refresh()}>I’ve verified my email</button>
              </div>
            )}
            <button className="text-button" onClick={auth.logout}><LogOut size={15} />Sign out</button>
          </>
        )}
      </section>

      <section className="settings-section">
        <div className="settings-heading"><Puzzle size={21} /><h2>Browser extension</h2></div>
        <div className="setting-row">
          <div>
            <h3>Link the extension for AI fact-checking</h3>
            <p>
              Generate a link token and paste it into the Proper Gander extension popup. This lets the extension verify a
              post&rsquo;s claims with an AI agent that browses the web for reputable sources &mdash; charged against your
              account&rsquo;s AI message budget.
            </p>
          </div>
        </div>
        {newToken ? (
          <div className="import-preview">
            <p className="fine-print">Copy this token into the extension popup. It won&rsquo;t be shown again, but you can revoke it anytime below.</p>
            <p style={{ wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '11px', margin: '8px 0' }}>{newToken}</p>
            <div className="account-controls">
              <button className="secondary-button" onClick={() => void copyToken()}>
                {copied ? <><Check size={15} />Copied</> : <><Copy size={15} />Copy token</>}
              </button>
              <button className="text-button" onClick={() => setNewToken('')}>Done</button>
            </div>
          </div>
        ) : (
          <div className="account-controls">
            <button disabled={genBusy} className="secondary-button" onClick={() => void generate()}>
              {genBusy ? <Loader2 size={15} className="spin" /> : <KeyRound size={15} />}Generate link token
            </button>
          </div>
        )}
        {tokens.records.length > 0 && (
          <div style={{ marginTop: '6px' }}>
            {tokens.records.map(t => (
              <div key={t.id} className="setting-row" style={{ padding: '12px 0' }}>
                <div>
                  <h3>{t.label || 'Browser extension'}</h3>
                  <p>Created {formatDate(t.created, { locale: 'en', dateStyle: 'medium' })}</p>
                </div>
                <button className="text-button danger-button" onClick={() => void revoke(t.id)}><Trash2 size={14} />Revoke</button>
              </div>
            ))}
          </div>
        )}
        <p className="fine-print">A link token grants access to your account&rsquo;s AI fact-checking. Revoke any you no longer use.</p>
      </section>

      <section className="settings-section">
        <div className="settings-heading"><ShieldCheck size={21} /><h2>Privacy, without the fine print</h2></div>
        <div className="privacy-prose">
          <p><strong>Your social accounts are not connected.</strong> We do not collect social passwords, post on your behalf, or access private feeds. Public Bluesky links are retrieved only when you import them.</p>
          <p><strong>Analysis is AI-assisted.</strong> Submitted post text is sent to the AI service. Avoid including private messages, personal contact details or sensitive information. AI conversation history is stored under your account; saved analyses are visible only to you.</p>
          <p><strong>No advertising or analytics cookies are added by Proper Gander.</strong> Necessary account session storage keeps you signed in.</p>
          <p><strong>Context isn’t certainty.</strong> We distinguish rhetorical signals from factual evidence. Suggested references are not guaranteed live checks, and we never establish someone’s intent from a single post.</p>
        </div>
        {auth.isAuthed && (
          <div className="delete-history">
            {confirmClear ? (
              <>
                <p>Delete your AI conversation history permanently? Saved perspectives will remain.</p>
                <button className="secondary-button danger-button" disabled={busy} onClick={() => void clear()}>
                  {busy ? 'Deleting…' : 'Yes, delete AI history'}
                </button>
                <button className="text-button" onClick={() => setConfirmClear(false)}>Cancel</button>
              </>
            ) : (
              <button className="text-button" onClick={() => setConfirmClear(true)}>Delete AI conversation history</button>
            )}
          </div>
        )}
      </section>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} />
    </main>
  );
}
