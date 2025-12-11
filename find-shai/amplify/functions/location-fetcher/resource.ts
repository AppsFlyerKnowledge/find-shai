import { defineFunction } from '@aws-amplify/backend';

export const locationFetcher = defineFunction({
  name: 'location-fetcher',
  entry: './handler.ts'
});