import { describe, expect, it } from 'vitest';

import {
  buildOnboardingAddressRepairPatch,
  normalizeDetectedAddress,
} from '../src/services/location/addressNormalization.js';
import type { LocationData } from '../src/services/location/types';

const mahalungeAddress = {
  country: 'India',
  countryCode: 'IN',
  state: 'Maharashtra',
  stateCode: 'MH',
  city: 'Pune',
  postalCode: '411045',
  phoneDialCode: '+91',
  timezone: 'Asia/Kolkata',
  formattedAddress: '1, Tower-3, Godrej Hillside, Mahalunge, Pune, Maharashtra 411045, India',
  latitude: 18.5943,
  longitude: 73.7537,
} satisfies LocationData;

describe('address normalization', () => {
  it('keeps the full street/building/locality prefix in address line 1', () => {
    const normalized = normalizeDetectedAddress(mahalungeAddress, 'India');

    expect(normalized.addressLine1).toBe('1, Tower-3, Godrej Hillside, Mahalunge');
    expect(normalized.addressLine2).toBe('');
    expect(normalized.city).toBe('Pune');
    expect(normalized.state).toBe('Maharashtra');
    expect(normalized.zipCode).toBe('411045');
    expect(normalized.country).toBe('India');
  });

  it('builds a repair patch for truncated line 1 and auto-filled city/state line 2', () => {
    const patch = buildOnboardingAddressRepairPatch({
      address_line_1: '1',
      address_line_2: 'Pune, Maharashtra',
      city: null,
      state: null,
      zip_code: null,
      address_country: null,
      gps_full_address: mahalungeAddress.formattedAddress,
      gps_city: 'Pune',
      gps_state: 'Maharashtra',
      gps_country: 'India',
      gps_zip_code: '411045',
    });

    expect(patch).toEqual({
      address_line_1: '1, Tower-3, Godrej Hillside, Mahalunge',
      address_line_2: null,
      city: 'Pune',
      state: 'Maharashtra',
      zip_code: '411045',
      address_country: 'India',
    });
  });
});
