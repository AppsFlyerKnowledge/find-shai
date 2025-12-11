import { defineFunction } from '@aws-amplify/backend';

export const geocoding = defineFunction({
  name: 'geocoding',
  entry: './handler.ts'
});

