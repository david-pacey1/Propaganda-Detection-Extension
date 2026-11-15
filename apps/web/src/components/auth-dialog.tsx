import { useState } from 'react';
import type { ReactNode } from 'react';
import { Loader2, ScanLine, Mail, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useDisclosure } from '@/hooks/use-disclosure';
import { useFormSubmission } from '@/hooks/use-form-submission';
import { useAuth } from '@/hooks/use-auth';
import { pocketbaseClient } from '@/lib/pocketbase-client';

export function AuthDialog({ children, open, onOpenChange }: { children?: ReactNode; open?: boolean; onOpenChange?: (value: boolean) => void }) {
  const disclosure = useDisclosure();
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [message, setMessage] = useState('');
  const { login, signup } = useAuth();
  const changeOpen = onOpenChange ?? ((value: boolean) => value ? disclosure.open() : disclosure.close());
  const form = useFormSubmission({ resetOnSuccess: false, submit: async (values) => {
    const email = String(values.email);
    const password = String(values.password ?? '');
    setMessage('');
    if (mode === 'reset') {
      await pocketbaseClient.collection('users').requestPasswordReset(email);
      setMessage('If an account exists, a password reset link is on its way. Check your inbox.');
    } else if (mode === 'signup') {
      await signup(email, password, { name: String(values.name ?? '') });
      setMessage('Your account is ready. Check your inbox and verify your email before running an AI analysis.');
    } else {
      await login(email, password);
      changeOpen(false);
    }
  } });
  const switchMode = (next: typeof mode) => { setMode(next); setMessage(''); form.reset(); };
  return <Dialog open={open ?? disclosure.isOpen} onOpenChange={changeOpen}>
    {children && <DialogTrigger asChild>{children}</DialogTrigger>}
    <DialogContent className="clear-dialog">
      <span className="auth-mark"><ScanLine size={26} /></span>
      <DialogTitle className="dialog-heading">{mode === 'signup' ? 'A little more clarity.' : mode === 'reset' ? 'Let’s get you back in.' : 'Welcome to Proper Gander.'}</DialogTitle>
      <DialogDescription>{mode === 'reset' ? 'We’ll send a secure password reset link to your email.' : 'Your own space to think critically, check claims and save useful context.'}</DialogDescription>
      <form onSubmit={form.onSubmit} className="stack-form">
        <input {...form.honeypotProps} />
        {mode === 'signup' && <label>Name<input name="name" autoComplete="name" required placeholder="Your name" /></label>}
        <label>Email address<input name="email" type="email" autoComplete="email" required placeholder="you@example.com" /></label>
        {mode !== 'reset' && <label>Password<input name="password" type="password" minLength={8} required autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>}
        {Object.entries(form.fieldErrors).map(([field, error]) => <p className="error-text" key={field}>{field}: {error}</p>)}
        {form.isError && <p role="alert" className="error-text">{form.errorStatus === 400 ? 'Check your email and password, or use the reset link below.' : 'We couldn’t complete that request. Please try again.'}</p>}
        {message && <p className="success-text" role="status"><Mail size={17} />{message}</p>}
        <button className="primary-button full-width" disabled={form.isSubmitting}>{form.isSubmitting ? <Loader2 size={17} className="spin" /> : <ArrowRight size={17} />}{mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
      </form>
      <div className="auth-links">{mode === 'login' ? <><button onClick={() => switchMode('signup')}>Create an account</button><button onClick={() => switchMode('reset')}>Forgot password?</button></> : <button onClick={() => switchMode('login')}>Already have an account? Sign in</button>}</div>
      <p className="fine-print">AI analysis requires a verified email. Educational examples are available without an account.</p>
    </DialogContent>
  </Dialog>;
}
