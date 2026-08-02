import { Stack } from 'expo-router';

import {
  PublicBullet,
  PublicPage,
  PublicParagraph,
  PublicSection,
  SupportEmailLink,
} from '../components/PublicPage';

export default function SupportScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Support — Unforget' }} />
      <PublicPage
        description="Need help with your advice archive or reminders? Start with the answers below or send us a message."
        title="Support"
      >
        <PublicSection title="Contact support">
          <PublicParagraph>
            Include your iPhone model, iOS version, and a short description of what
            happened. Please do not email advice you want to keep private.
          </PublicParagraph>
          <SupportEmailLink />
        </PublicSection>

        <PublicSection title="Getting reminders">
          <PublicBullet>
            Save at least one piece of advice from the Remember tab.
          </PublicBullet>
          <PublicBullet>
            Allow notifications when iOS asks for permission.
          </PublicBullet>
          <PublicBullet>
            Open Archive and tap Test to schedule a reminder within a few seconds.
          </PublicBullet>
          <PublicParagraph>
            If reminders are disabled, open iOS Settings, select Notifications,
            choose Unforget, and turn on Allow Notifications.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Your advice and privacy">
          <PublicParagraph>
            Advice is stored only on your device. Unforget does not require an
            account and does not sync your archive to a server. Removing the app or
            deleting advice is permanent, so keep a separate copy of anything you
            cannot afford to lose.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Deleting advice">
          <PublicParagraph>
            In Archive, swipe an entry to the left to reveal Delete. To remove the
            entire archive, tap Delete all advice and confirm the action.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Response time">
          <PublicParagraph>
            Support messages are reviewed as soon as possible. Most questions should
            receive a response within a few business days.
          </PublicParagraph>
        </PublicSection>
      </PublicPage>
    </>
  );
}
