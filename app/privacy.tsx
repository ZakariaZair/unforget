import { Stack } from 'expo-router';

import {
  PublicBullet,
  PublicPage,
  PublicParagraph,
  PublicSection,
  SupportEmailLink,
} from '../components/PublicPage';

export default function PrivacyScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Privacy Policy — Unforget' }} />
      <PublicPage
        description="Unforget is private by design. Your advice stays on your device, and the app does not use accounts, advertising, analytics, or tracking."
        title="Privacy Policy"
      >
        <PublicSection title="Effective date">
          <PublicParagraph>August 1, 2026</PublicParagraph>
        </PublicSection>

        <PublicSection title="Information handled by the app">
          <PublicParagraph>
            Unforget does not collect or transmit personal information through the
            app. The advice you write and its creation date are stored locally on
            your device so the app can display your archive and schedule reminders.
          </PublicParagraph>
          <PublicBullet>No account or sign-in is required.</PublicBullet>
          <PublicBullet>No analytics or advertising SDKs are used.</PublicBullet>
          <PublicBullet>No tracking technologies are used.</PublicBullet>
          <PublicBullet>Your advice is not sold, shared, or uploaded.</PublicBullet>
        </PublicSection>

        <PublicSection title="Notifications">
          <PublicParagraph>
            If you grant notification permission, Unforget schedules reminders
            locally on your device. The notification contains advice you saved.
            You can change notification permission at any time in iOS Settings.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Deleting your information">
          <PublicParagraph>
            You can delete individual entries or your entire archive inside the app.
            Deleting Unforget also removes its locally stored advice from that device.
            Because Unforget has no account or cloud backup, deleted advice cannot be
            recovered by us.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Support communications">
          <PublicParagraph>
            If you email support, we receive the information you choose to include in
            that message, such as your email address and question. We use it only to
            respond and provide support. Email is processed by the providers used to
            send and receive the message.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Children’s privacy">
          <PublicParagraph>
            Unforget does not knowingly collect personal information from children or
            any other users through the app.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Changes to this policy">
          <PublicParagraph>
            This policy may be updated if Unforget’s features or data practices
            change. The effective date above will be revised when an update is made.
          </PublicParagraph>
        </PublicSection>

        <PublicSection title="Contact">
          <PublicParagraph>
            Questions about privacy or Unforget can be sent to:
          </PublicParagraph>
          <SupportEmailLink />
        </PublicSection>
      </PublicPage>
    </>
  );
}
