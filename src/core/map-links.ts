import type { SourcedCoordinates } from "./coordinates.js";

function validated(value: SourcedCoordinates): SourcedCoordinates | null {
  if (
    !Number.isFinite(value.lat) ||
    !Number.isFinite(value.lon) ||
    value.lat < -90 ||
    value.lat > 90 ||
    value.lon < -180 ||
    value.lon > 180
  ) {
    return null;
  }
  return value;
}

export function safeDecode(value: string): string {
  if (!value) return "";
  try {
    return decodeURIComponent(String(value).replace(/\+/g, " "));
  } catch {
    return String(value);
  }
}

/** Extract coordinates without making a network request. */
export function extractFromString(input: string): SourcedCoordinates | null {
  if (!input) return null;
  const text = String(input);
  let match: RegExpMatchArray | null;

  match = text.match(/(?:coordinate|ll|sll)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i);
  if (match && /maps\.apple\.(?:com|cn)/i.test(text)) {
    const name = text.match(/[?&](?:name|q)=([^&]+)/i);
    return validated({
      lat: Number(match[1]),
      lon: Number(match[2]),
      name: name ? safeDecode(name[1]!) : "",
      src: "apple",
    });
  }

  match = text.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  if (match && /google|goo\.gl/i.test(text)) {
    return validated({ lat: Number(match[1]), lon: Number(match[2]), name: "", src: "google" });
  }
  match = text.match(/[?&](?:q|query)=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i);
  if (match && /google|goo\.gl/i.test(text)) {
    return validated({ lat: Number(match[1]), lon: Number(match[2]), name: "", src: "google" });
  }

  match = text.match(
    /[?&]p=[^,&%]*(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)(?:(?:,|%2C)((?:(?!,|%2C|&).)+))?/i
  );
  if (match && /amap|gaode/i.test(text)) {
    return validated({
      lat: Number(match[1]),
      lon: Number(match[2]),
      name: match[3] ? safeDecode(match[3]) : "",
      src: "amap",
    });
  }
  match = text.match(
    /[?&]position=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (match && /amap|gaode/i.test(text)) {
    const name = text.match(/[?&]name=([^&]+)/i);
    return validated({
      lat: Number(match[2]),
      lon: Number(match[1]),
      name: name ? safeDecode(name[1]!) : "",
      src: "amap",
    });
  }
  match = text.match(
    /[?&]q=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)(?:(?:,|%2C)((?:(?!,|%2C|&).)+))?/i
  );
  if (match && /amap|gaode/i.test(text)) {
    return validated({
      lat: Number(match[1]),
      lon: Number(match[2]),
      name: match[3] ? safeDecode(match[3]) : "",
      src: "amap",
    });
  }

  match = text.match(/location=(-?\d{1,3}(?:\.\d+)?)(?:,|%2C)(-?\d{1,3}(?:\.\d+)?)/i);
  if (match && /baidu/i.test(text)) {
    return validated({ lat: Number(match[1]), lon: Number(match[2]), name: "", src: "baidu" });
  }
  match = text.match(/[?&]lat=(-?\d{1,3}(?:\.\d+)?).*?[?&]l(?:ng|on)=(-?\d{1,3}(?:\.\d+)?)/i);
  if (match && /baidu/i.test(text)) {
    return validated({ lat: Number(match[1]), lon: Number(match[2]), name: "", src: "baidu" });
  }

  match = text.match(/(-?\d{1,3}\.\d{4,})\s*(?:,|%2C)\s*(-?\d{1,3}\.\d{4,})/);
  if (match) {
    return validated({ lat: Number(match[1]), lon: Number(match[2]), name: "", src: "text" });
  }

  return null;
}
