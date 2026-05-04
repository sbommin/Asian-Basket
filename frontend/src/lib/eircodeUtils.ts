// ============================================================
// CREATE NEW FILE: src/lib/eircodeUtils.ts
// Eircode address autofill using OpenStreetMap Nominatim (free)
// ============================================================

export interface EircodeResult {
  street:  string;
  city:    string;
  state:   string;
  zipCode: string;
  country: string;
  found:   boolean;
  error?:  string;
}

/**
 * Normalise an Eircode — strips spaces, uppercases.
 * Valid Irish Eircode format: A65 F4E2 → A65F4E2 (7 chars)
 */
export function normaliseEircode(raw: string): string {
  return raw.replace(/\s+/g, "").toUpperCase().trim();
}

/**
 * Basic Eircode format validation.
 * Format: 3-char routing key + 4-char unique identifier
 * e.g. D01F5P2, A65F4E2, T12XY45
 */
export function isValidEircodeFormat(code: string): boolean {
  const normalised = normaliseEircode(code);
  return /^[AC-FHKNPRTVY]{1}[0-9]{2}[0-9AC-FHKNPRTVY]{4}$/.test(normalised);
}

/**
 * Look up an address from an Eircode using OpenStreetMap Nominatim.
 * Nominatim supports Irish Eircode search natively.
 * Free, no API key required. Rate limit: 1 request/second.
 */
export async function lookupEircode(eircode: string): Promise<EircodeResult> {
  const normalised = normaliseEircode(eircode);

  // Format with space for better Nominatim recognition: A65F4E2 → A65 F4E2
  const formatted = `${normalised.slice(0, 3)} ${normalised.slice(3)}`;

  try {
    const url = `https://nominatim.openstreetmap.org/search?` +
      new URLSearchParams({
        q:              formatted,
        countrycodes:   "ie",
        format:         "json",
        addressdetails: "1",
        limit:          "1",
        "accept-language": "en",
      });

    const res = await fetch(url, {
      headers: {
        // Nominatim requires a User-Agent identifying your app
        "User-Agent": "AsianBasket/1.0 (asianbasket.ie)",
      },
    });

    if (!res.ok) {
      throw new Error(`Nominatim request failed: ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      return {
        found:   false,
        street:  "",
        city:    "",
        state:   "",
        zipCode: formatted,
        country: "Ireland",
        error:   "Eircode not found. Please enter your address manually.",
      };
    }

    const place   = data[0];
    const address = place.address || {};

    // Extract the most relevant street info
    const street = [
      address.house_number,
      address.road || address.pedestrian || address.footway,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    // City: prefer city > town > village > suburb > county
    const city =
      address.city      ||
      address.town      ||
      address.village   ||
      address.suburb    ||
      address.county    ||
      "";

    // State / County
    const state =
      address.county    ||
      address.state     ||
      "";

    return {
      found:   true,
      street:  street  || "",
      city:    city    || "",
      state:   state   || "",
      zipCode: formatted,
      country: "Ireland",
    };
  } catch (err: any) {
    // Network error or rate limit
    return {
      found:   false,
      street:  "",
      city:    "",
      state:   "",
      zipCode: formatted,
      country: "Ireland",
      error:   "Address lookup failed. Please enter your address manually.",
    };
  }
}
