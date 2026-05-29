export type LoginProfile = 'client' | 'admin';

export function getProfileAccentColor(profile: LoginProfile): '#1a4731' | '#d4a020' {
  return profile === 'admin' ? '#1a4731' : '#d4a020';
}
