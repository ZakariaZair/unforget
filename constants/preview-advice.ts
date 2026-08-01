import { Advice } from '../types/advice';

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export const PREVIEW_ADVICE: Advice[] = [
  {
    id: 'preview-attention',
    text: 'Protect your attention; it becomes your life.',
    createdAt: new Date(Date.now() - 2 * DAY_IN_MILLISECONDS).toISOString(),
  },
  {
    id: 'preview-courage',
    text: 'Ask the question, even when your voice shakes.',
    createdAt: new Date(Date.now() - 8 * DAY_IN_MILLISECONDS).toISOString(),
  },
  {
    id: 'preview-rest',
    text: 'Rest is part of the work, not a reward for finishing it.',
    createdAt: new Date(Date.now() - 15 * DAY_IN_MILLISECONDS).toISOString(),
  },
];
