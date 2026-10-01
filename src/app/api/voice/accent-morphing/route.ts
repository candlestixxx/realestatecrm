import { NextRequest, NextResponse } from 'next/server';

/**
 * Accent Morphing — ElevenLabs voice ID assignment by area code.
 * Dynamically selects voice accent/ID based on the geo-location of the dialed number.
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { phone, agentId, preferredGender } = body;

  if (!phone) {
    return NextResponse.json({ error: 'phone number required' }, { status: 400 });
  }

  // Extract area code
  const cleaned = phone.replace(/\D/g, '');
  const areaCode = cleaned.length >= 10 ? cleaned.slice(-10, -7) : cleaned.slice(0, 3);

  // Map area code to region + accent
  const region = getRegionFromAreaCode(areaCode);

  // Map region to ElevenLabs voice ID
  const voiceConfig = selectVoice(region, preferredGender);

  return NextResponse.json({
    areaCode,
    region: region.name,
    accent: region.accent,
    voiceId: voiceConfig.voiceId,
    voiceName: voiceConfig.voiceName,
    settings: voiceConfig.settings,
    rationale: 'Voice matched to ' + region.name + ' accent for caller rapport',
  });
}

/**
 * GET: List available voices by region.
 */
export async function GET() {
  return NextResponse.json({
    voices: VOICE_CATALOG,
    areaCodeMap: AREA_CODE_REGIONS.slice(0, 20),
  });
}

interface Region {
  name: string;
  accent: string;
  states: string[];
}

const AREA_CODE_REGIONS: Record<string, Region>[] = [
  // Michigan
  { '248': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '313': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '586': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '734': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '810': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '989': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '231': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '269': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '616': { name: 'Michigan', accent: 'midwestern', states: ['MI'] }, '906': { name: 'Michigan', accent: 'midwestern', states: ['MI'] } },
  // New York
  { '212': { name: 'New York', accent: 'northeast', states: ['NY'] }, '646': { name: 'New York', accent: 'northeast', states: ['NY'] }, '718': { name: 'New York', accent: 'northeast', states: ['NY'] }, '917': { name: 'New York', accent: 'northeast', states: ['NY'] }, '347': { name: 'New York', accent: 'northeast', states: ['NY'] }, '516': { name: 'New York', accent: 'northeast', states: ['NY'] }, '631': { name: 'New York', accent: 'northeast', states: ['NY'] }, '914': { name: 'New York', accent: 'northeast', states: ['NY'] } },
  // California
  { '213': { name: 'California', accent: 'western', states: ['CA'] }, '310': { name: 'California', accent: 'western', states: ['CA'] }, '415': { name: 'California', accent: 'western', states: ['CA'] }, '510': { name: 'California', accent: 'western', states: ['CA'] }, '619': { name: 'California', accent: 'western', states: ['CA'] }, '714': { name: 'California', accent: 'western', states: ['CA'] }, '818': { name: 'California', accent: 'western', states: ['CA'] }, '408': { name: 'California', accent: 'western', states: ['CA'] }, '916': { name: 'California', accent: 'western', states: ['CA'] }, '949': { name: 'California', accent: 'western', states: ['CA'] } },
  // Texas
  { '214': { name: 'Texas', accent: 'southern', states: ['TX'] }, '512': { name: 'Texas', accent: 'southern', states: ['TX'] }, '713': { name: 'Texas', accent: 'southern', states: ['TX'] }, '832': { name: 'Texas', accent: 'southern', states: ['TX'] }, '210': { name: 'Texas', accent: 'southern', states: ['TX'] }, '281': { name: 'Texas', accent: 'southern', states: ['TX'] }, '972': { name: 'Texas', accent: 'southern', states: ['TX'] }, '817': { name: 'Texas', accent: 'southern', states: ['TX'] }, '682': { name: 'Texas', accent: 'southern', states: ['TX'] }, '361': { name: 'Texas', accent: 'southern', states: ['TX'] } },
  // Florida
  { '305': { name: 'Florida', accent: 'southern', states: ['FL'] }, '407': { name: 'Florida', accent: 'southern', states: ['FL'] }, '813': { name: 'Florida', accent: 'southern', states: ['FL'] }, '904': { name: 'Florida', accent: 'southern', states: ['FL'] }, '954': { name: 'Florida', accent: 'southern', states: ['FL'] }, '727': { name: 'Florida', accent: 'southern', states: ['FL'] }, '561': { name: 'Florida', accent: 'southern', states: ['FL'] }, '239': { name: 'Florida', accent: 'southern', states: ['FL'] } },
  // Georgia
  { '404': { name: 'Georgia', accent: 'southern', states: ['GA'] }, '770': { name: 'Georgia', accent: 'southern', states: ['GA'] }, '678': { name: 'Georgia', accent: 'southern', states: ['GA'] }, '470': { name: 'Georgia', accent: 'southern', states: ['GA'] } },
  // Illinois
  { '312': { name: 'Illinois', accent: 'midwestern', states: ['IL'] }, '773': { name: 'Illinois', accent: 'midwestern', states: ['IL'] }, '847': { name: 'Illinois', accent: 'midwestern', states: ['IL'] }, '630': { name: 'Illinois', accent: 'midwestern', states: ['IL'] }, '224': { name: 'Illinois', accent: 'midwestern', states: ['IL'] } },
];

const VOICE_CATALOG = [
  { voiceId: 'midwestern-female-1', name: 'Sarah (Midwest)', accent: 'midwestern', gender: 'female', elevenlabsId: 'EXAVITQu4vr4xnSDxMaL' },
  { voiceId: 'midwestern-male-1', name: 'James (Midwest)', accent: 'midwestern', gender: 'male', elevenlabsId: 'ErXwobaYiN019PkySvjV' },
  { voiceId: 'northeast-female-1', name: 'Rachel (Northeast)', accent: 'northeast', gender: 'female', elevenlabsId: 'MF3mGyEYCl7XYWbV9V6O' },
  { voiceId: 'northeast-male-1', name: 'David (Northeast)', accent: 'northeast', gender: 'male', elevenlabsId: 'TxGEqnHWrfWFTfGW9XjX' },
  { voiceId: 'southern-female-1', name: 'Amanda (Southern)', accent: 'southern', gender: 'female', elevenlabsId: 'LcfcDJNUP1GQjkzn1xUU' },
  { voiceId: 'southern-male-1', name: 'William (Southern)', accent: 'southern', gender: 'male', elevenlabsId: 'pNInz6obpgDQGcFmaJgB' },
  { voiceId: 'western-female-1', name: 'Jessica (Western)', accent: 'western', gender: 'female', elevenlabsId: 'jsCqWAovK2LkecY7zXl4' },
  { voiceId: 'western-male-1', name: 'Michael (Western)', accent: 'western', gender: 'male', elevenlabsId: 'ODq5zmih8GrVes37Dizd' },
];

function getRegionFromAreaCode(areaCode: string): Region {
  for (const map of AREA_CODE_REGIONS) {
    if (map[areaCode]) return map[areaCode];
  }
  return { name: 'United States', accent: 'neutral', states: [] };
}

function selectVoice(region: Region, preferredGender?: string) {
  const gender = preferredGender || 'female';
  const match = VOICE_CATALOG.find(v => v.accent === region.accent && v.gender === gender)
    || VOICE_CATALOG.find(v => v.accent === region.accent)
    || VOICE_CATALOG[0];

  return {
    voiceId: match.voiceId,
    voiceName: match.name,
    elevenlabsId: match.elevenlabsId,
    settings: {
      stability: 0.5,
      similarityBoost: 0.75,
      style: 0.2,
      useSpeakerBoost: true,
    },
  };
}
