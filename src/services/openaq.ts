// src/services/openaq.ts

const BASE_URL = "http://localhost:3001/api/openaq";

if (!BASE_URL) throw new Error("Falta url");

// Definit tipos
type OpenAQMeta = {
  page: number;
  limit: number; // OpenAQ returns 100 by default
  found: number;
};

export type OpenAQResponse<T> = {
  meta: OpenAQMeta;
  results: T[]; // genérico = este tipo funciona con cualquier tipo, p.ej. OpenAQResponse<Location>
};

async function openaqFetch<T>(path: string): Promise<OpenAQResponse<T>> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url);

  // Cubrir todos los errores HTTP
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // incluye la URL para depurar 404 del proxy
    throw new Error(`OpenAQ proxy error ${res.status} on ${url}${text ? ` : ${text}` : ""}`);
  }

  return res.json(); // devuelve any pero hay type trust boundary
}

export type Location = {
  id: number;
  name: string;
  locality?: string;
  timezone?: string;
  country?: { code: string; name: string };
  coordinates?: { latitude: number; longitude: number };
};

export type LatestMeasurement = {
  datetime: { utc: string; local: string };
  value: number;
  coordinates: { latitude: number; longitude: number };
  sensorsId: number;
  locationsId: number;
};

export type Sensor = {
  id: number;
  name?: string;
  parameter?: {
    id?: number;
    name?: string; // "no2", "pm25", etc.
    units?: string; // "µg/m³", etc.
    displayName?: string;
  };
  unit?: string; // a veces viene aquí; tú ya lo normalizas en utils
};

export async function getLocation(id: number) {
  return openaqFetch<Location>(`/locations/${id}`);
}

export async function getLatestByLocation(id: number) {
  return openaqFetch<LatestMeasurement>(`/locations/${id}/latest`);
}

export async function getSensor(id: number) {
  return openaqFetch<Sensor>(`/sensors/${id}`);
}

/**
 * Histórico (v3): lo normal es que el timestamp venga en:
 * period.datetimeFrom.utc
 *
 * Dejo también `date` como opcional por compat si tu proxy lo mapea a "date".
 */
export type Measurement = {
  value: number;
  unit?: string;

  // v3 habitual:
  period?: {
    datetimeFrom?: { utc: string; local?: string };
    datetimeTo?: { utc: string; local?: string };
  };

  // compat (si tu proxy lo transforma o si tu util viejo lo esperaba)
  date?: { utc: string; local?: string };

  // opcional (a veces existe)
  parameter?: string;
};

export async function getMeasurementsBySensor(params: {
  sensorsId: number;
  hours?: number;
  limit?: number;
}) {
  const { sensorsId, hours = 24, limit = 200 } = params;

  const dateFrom = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const qs = new URLSearchParams({
    date_from: dateFrom,
    limit: String(limit),
    sort: "datetime",
    order: "asc",
  });

  // Endpoint correcto: /sensors/:id/measurements
  return openaqFetch<Measurement>(`/sensors/${sensorsId}/measurements?${qs.toString()}`);
}
