// hushh-location-geocode - Edge Function for GPS-based reverse geocoding
// Uses Google Geocoding API to convert lat/lng to full address components

import { corsHeaders } from '../_shared/cors.ts';

// Country code to phone dial code mapping
const COUNTRY_DIAL_CODES: Record<string, string> = {
  'US': '+1',
  'CA': '+1',
  'GB': '+44',
  'UK': '+44',
  'IN': '+91',
  'CN': '+86',
  'JP': '+81',
  'AU': '+61',
  'DE': '+49',
  'FR': '+33',
  'IT': '+39',
  'ES': '+34',
  'BR': '+55',
  'MX': '+52',
  'RU': '+7',
  'KR': '+82',
  'SA': '+966',
  'AE': '+971',
  'SG': '+65',
  'HK': '+852',
  'NZ': '+64',
  'ZA': '+27',
  'EG': '+20',
  'NG': '+234',
  'PK': '+92',
  'BD': '+880',
  'ID': '+62',
  'MY': '+60',
  'TH': '+66',
  'VN': '+84',
  'PH': '+63',
  'TR': '+90',
  'PL': '+48',
  'NL': '+31',
  'BE': '+32',
  'SE': '+46',
  'NO': '+47',
  'DK': '+45',
  'FI': '+358',
  'CH': '+41',
  'AT': '+43',
  'PT': '+351',
  'GR': '+30',
  'IE': '+353',
  'IL': '+972',
  'AR': '+54',
  'CL': '+56',
  'CO': '+57',
  'PE': '+51',
  'VE': '+58',
};

// Country code to timezone mapping (simplified - uses capital city timezone)
const COUNTRY_TIMEZONES: Record<string, string> = {
  'US': 'America/New_York',
  'CA': 'America/Toronto',
  'GB': 'Europe/London',
  'UK': 'Europe/London',
  'IN': 'Asia/Kolkata',
  'CN': 'Asia/Shanghai',
  'JP': 'Asia/Tokyo',
  'AU': 'Australia/Sydney',
  'DE': 'Europe/Berlin',
  'FR': 'Europe/Paris',
  'AE': 'Asia/Dubai',
  'SG': 'Asia/Singapore',
  'SA': 'Asia/Riyadh',
};

interface GeocodingResult {
  country: string;
  countryCode: string;
  state: string;
  stateCode: string;
  city: string;
  postalCode: string;
  phoneDialCode: string;
  timezone: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { latitude, longitude } = await req.json();

    if (!latitude || !longitude) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing latitude or longitude' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get Google Maps API key from environment
    const apiKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    if (!apiKey) {
      console.error('[hushh-location-geocode] Missing GOOGLE_MAPS_API_KEY');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Geocoding service not configured' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;
    
    console.log(`[hushh-location-geocode] Reverse geocoding: ${latitude}, ${longitude}`);
    
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      console.error('[hushh-location-geocode] Google API error:', data.status);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Geocoding failed: ${data.status}` 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse address components from Google response
    const result = data.results[0];
    const components = result.address_components || [];
    
    let country = '';
    let countryCode = '';
    let state = '';
    let stateCode = '';
    let city = '';
    let postalCode = '';

    for (const component of components) {
      const types = component.types || [];
      
      if (types.includes('country')) {
        country = component.long_name;
        countryCode = component.short_name;
      } else if (types.includes('administrative_area_level_1')) {
        state = component.long_name;
        stateCode = component.short_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('sublocality_level_1') && !city) {
        city = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    }

    // Get phone dial code from country code
    const phoneDialCode = COUNTRY_DIAL_CODES[countryCode] || '+1';
    
    // Get timezone from country code
    const timezone = COUNTRY_TIMEZONES[countryCode] || 'UTC';

    const locationData: GeocodingResult = {
      country,
      countryCode,
      state,
      stateCode,
      city,
      postalCode,
      phoneDialCode,
      timezone,
      formattedAddress: result.formatted_address || '',
      latitude,
      longitude,
    };

    console.log('[hushh-location-geocode] Success:', JSON.stringify(locationData, null, 2));

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: locationData 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[hushh-location-geocode] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
