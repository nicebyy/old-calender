import { OAuth2ProviderConfig } from '../types';

export const OAUTH_PROVIDERS: OAuth2ProviderConfig[] = [
  {
    provider: 'google',
    name: 'Google 캘린더',
    iconName: 'globe',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/calendar',
    ],
    defaultColor: '#EA4335', // Google Red
  },
  {
    provider: 'apple',
    name: 'iCloud 캘린더',
    iconName: 'cloud',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scopes: ['name', 'email'],
    defaultColor: '#A2AAAD', // Apple Silver
  },
];
