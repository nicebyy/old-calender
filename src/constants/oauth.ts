import { OAuth2ProviderConfig } from '../types';

export const OAUTH_PROVIDERS: OAuth2ProviderConfig[] = [
  {
    provider: 'microsoft',
    name: 'Outlook.com / Live.com',
    iconName: 'mail',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    scopes: ['openid', 'profile', 'email', 'Calendars.ReadWrite', 'offline_access'],
    defaultColor: '#0078D7', // Outlook Blue
  },
  {
    provider: 'exchange',
    name: 'Microsoft 365 / Exchange',
    iconName: 'building',
    authUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/organizations/oauth2/v2.0/token',
    scopes: ['openid', 'profile', 'email', 'Calendars.ReadWrite', 'offline_access'],
    defaultColor: '#107C41', // Exchange Green
  },
  {
    provider: 'google',
    name: 'Google',
    iconName: 'chrome',
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
    name: 'iCloud',
    iconName: 'cloud',
    authUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    scopes: ['name', 'email'],
    defaultColor: '#A2AAAD', // Apple Silver
  },
];
