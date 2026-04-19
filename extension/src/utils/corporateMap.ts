export const CORPORATE_MAP: Record<string, string> = {
  'doubleclick.net': 'Alphabet',
  'google-analytics.com': 'Alphabet',
  'googletagmanager.com': 'Alphabet',
  'google.com': 'Alphabet',
  'googleadservices.com': 'Alphabet',
  'facebook.net': 'Meta',
  'connect.facebook.net': 'Meta',
  'facebook.com': 'Meta',
  'amazon-adsystem.com': 'Amazon',
  'amazon.com': 'Amazon',
  'clarity.ms': 'Microsoft',
  'bing.com': 'Microsoft',
  'linkedin.com': 'Microsoft',
  'segment.io': 'Twilio',
  'segment.com': 'Twilio',
  'hotjar.com': 'Hotjar',
  'amplitude.com': 'Amplitude',
  'scorecardresearch.com': 'Comscore',
  'criteo.com': 'Criteo',
  'outbrain.com': 'Outbrain',
  'taboola.com': 'Taboola',
  'rlcdn.com': 'LiveRamp',
  'adroll.com': 'NextRoll',
  'quantserve.com': 'Quantcast',
  'demdex.net': 'Adobe'
};

/**
 * Helper function to try and resolve a domain to a parent company.
 */
export function getParentCompany(domain: string): string | undefined {
  return CORPORATE_MAP[domain];
}
