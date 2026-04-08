const cleanString = (value) => (typeof value === 'string' ? value.trim() : '');

const normalizeComparable = (value) =>
  cleanString(value)
    .replace(/\s+/g, ' ')
    .replace(/[.,]/g, '')
    .toLowerCase();

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const splitSegments = (formattedAddress) =>
  cleanString(formattedAddress)
    .split(',')
    .map((segment) => cleanString(segment))
    .filter(Boolean);

const matchesSegment = (segment, candidates) => {
  const normalizedSegment = normalizeComparable(segment);
  if (!normalizedSegment) return false;

  return candidates
    .map((candidate) => normalizeComparable(candidate))
    .filter(Boolean)
    .some((candidate) => candidate === normalizedSegment);
};

const stripCandidate = (value, candidate) => {
  const cleanCandidate = cleanString(candidate);
  if (!cleanCandidate) return value;

  return value.replace(new RegExp(`\\b${escapeRegExp(cleanCandidate)}\\b`, 'gi'), ' ');
};

const isStatePostalSegment = (segment, { state, stateCode, zipCode }) => {
  let working = cleanString(segment);
  if (!working) return false;

  if (zipCode) {
    working = working.replace(new RegExp(`\\b${escapeRegExp(zipCode)}\\b`, 'gi'), ' ');
  }

  working = stripCandidate(working, state);
  working = stripCandidate(working, stateCode);
  working = working.replace(/[.,()/\-]/g, ' ').replace(/\s+/g, ' ').trim();

  return working.length === 0;
};

const SECONDARY_DETAIL_PATTERN = /^(apt|apartment|suite|ste|unit|flat|floor|fl|room|rm|#)\b/i;

const splitStreetSegments = (segments) => {
  if (segments.length === 0) {
    return { addressLine1: '', addressLine2: '' };
  }

  const lastSegment = segments[segments.length - 1];
  if (segments.length > 1 && SECONDARY_DETAIL_PATTERN.test(lastSegment)) {
    return {
      addressLine1: segments.slice(0, -1).join(', '),
      addressLine2: lastSegment,
    };
  }

  return {
    addressLine1: segments.join(', '),
    addressLine2: '',
  };
};

export function normalizeDetectedAddress(locationData, countryNameOverride = '') {
  const city = cleanString(locationData?.city);
  const state = cleanString(locationData?.state);
  const stateCode = cleanString(locationData?.stateCode);
  const zipCode = cleanString(locationData?.postalCode);
  const country = cleanString(countryNameOverride) || cleanString(locationData?.country);
  const formattedAddress = cleanString(locationData?.formattedAddress);

  const segments = splitSegments(formattedAddress);

  if (segments.length && matchesSegment(segments[segments.length - 1], [country, locationData?.country])) {
    segments.pop();
  }

  if (segments.length && isStatePostalSegment(segments[segments.length - 1], { state, stateCode, zipCode })) {
    segments.pop();
  }

  if (segments.length && matchesSegment(segments[segments.length - 1], [city])) {
    segments.pop();
  }

  const { addressLine1, addressLine2 } = splitStreetSegments(segments);

  return {
    addressLine1,
    addressLine2,
    city,
    state,
    zipCode,
    country,
    formattedAddress,
  };
}

export function looksLikeAutoFilledCityStateLine2(line2, city, state) {
  const expected = [cleanString(city), cleanString(state)].filter(Boolean).join(', ');
  if (!expected) return false;

  return normalizeComparable(line2) === normalizeComparable(expected);
}

export function isClearlyTruncatedAddressLine1(currentLine1, normalizedAddressLine1) {
  const current = cleanString(currentLine1);
  const normalized = cleanString(normalizedAddressLine1);

  if (!current || !normalized || current === normalized) {
    return false;
  }

  const normalizedSegments = normalized.split(',').map((segment) => cleanString(segment)).filter(Boolean);
  const firstSegment = normalizedSegments[0] || '';

  return normalizedSegments.length > 1 && normalizeComparable(current) === normalizeComparable(firstSegment);
}

export function buildOnboardingAddressRepairPatch(row) {
  const gpsCountry = cleanString(row.gps_country);
  const gpsState = cleanString(row.gps_state);
  const gpsCity = cleanString(row.gps_city);
  const gpsZipCode = cleanString(row.gps_zip_code);
  const gpsFullAddress = cleanString(row.gps_full_address);

  if (!gpsCountry && !gpsState && !gpsCity && !gpsZipCode && !gpsFullAddress) {
    return null;
  }

  const normalized = normalizeDetectedAddress({
    country: gpsCountry,
    state: gpsState,
    stateCode: '',
    city: gpsCity,
    postalCode: gpsZipCode,
    phoneDialCode: '',
    timezone: '',
    formattedAddress: gpsFullAddress,
    latitude: 0,
    longitude: 0,
    countryCode: '',
  }, gpsCountry);

  const patch = {};
  const currentLine1 = cleanString(row.address_line_1);
  const currentLine2 = cleanString(row.address_line_2);

  if (
    normalized.addressLine1 &&
    (!currentLine1 || isClearlyTruncatedAddressLine1(currentLine1, normalized.addressLine1))
  ) {
    patch.address_line_1 = normalized.addressLine1;
  }

  if (looksLikeAutoFilledCityStateLine2(currentLine2, gpsCity, gpsState)) {
    patch.address_line_2 = normalized.addressLine2 || null;
  } else if (!currentLine2 && normalized.addressLine2) {
    patch.address_line_2 = normalized.addressLine2;
  }

  if (!cleanString(row.city) && normalized.city) {
    patch.city = normalized.city;
  }

  if (!cleanString(row.state) && normalized.state) {
    patch.state = normalized.state;
  }

  if (!cleanString(row.zip_code) && normalized.zipCode) {
    patch.zip_code = normalized.zipCode;
  }

  if (!cleanString(row.address_country) && normalized.country) {
    patch.address_country = normalized.country;
  }

  return Object.keys(patch).length > 0 ? patch : null;
}
