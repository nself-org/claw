import { redirect } from 'next/navigation';

/**
 * /settings — redirect to the Profile section as the default landing.
 * Next.js permanent redirect keeps the URL canonical.
 */
export default function SettingsIndexPage(): never {
  redirect('/settings/profile');
}
