import { useState, useEffect, useMemo } from "react";
import LineChartCard from "../components/chart/LineChartCard";
import MapView from "../components/map/MapView";

import {
  getLocation,
  getLatestByLocation,
  getSensor,
  getMeasurementsBySensor,
  type LatestMeasurement,
  type Location,
  type Measurement,
} from "../services/openaq";

import { measurementsToChartPoints } from "../utils/toChartPoints";
import { getSensorParameterName, getSensorUnit } from "../utils/sensorInfo";

export default function Dashboard() {
  const [locationId, setLocationId] = useState(2178);
  const [location, setLocation] = useState<Location | null>(null);

  const [latest, setLatest] = useState<LatestMeasurement[]>([]);
  const [sensorsMap, setSensorsMap] = useState<
    Record<number, { parameterName?: string; unit?: string }>
  >({});

  const [selectedParameter, setSelectedParameter] = useState<string>("no2");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) Carga base: location + latest + metadata de sensores (solo cuando cambia locationId)
  useEffect(() => {
    let cancelled = false;

    async function loadBase() {
      setLoading(true);
      setError(null);

      try {
        const [locationRes, latestRes] = await Promise.all([
          getLocation(locationId),
          getLatestByLocation(locationId),
        ]);

        if (cancelled) return;

        const locationResult = locationRes.results?.[0] ?? null;
        const latestResults = latestRes.results ?? [];

        // ids únicos de sensores presentes en latest
        const sensorIds = Array.from(new Set(latestResults.map((m) => m.sensorsId)));

        // metadata de sensores
        const sensorResponses = await Promise.all(sensorIds.map((id) => getSensor(id)));

        if (cancelled) return;

        const nextMap: Record<number, { parameterName?: string; unit?: string }> = {};
        sensorResponses.forEach((resp) => {
          const sensor = resp.results?.[0];
          if (!sensor) return;

          const parameterName = getSensorParameterName(sensor);
          const unit = getSensorUnit(sensor);

          nextMap[sensor.id] = { parameterName, unit };
        });

        setLocation(locationResult);
        setLatest(latestResults);
        setSensorsMap(nextMap);

        // cuando cambia la ubicación, limpiamos mediciones históricas (hasta recargar)
        setMeasurements([]);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBase();
    return () => {
      cancelled = true;
    };
  }, [locationId]);

  // Parámetros disponibles para esta location (dinámico)
  const availableParameters = useMemo(() => {
    const set = new Set<string>();
    for (const m of latest) {
      const name = sensorsMap[m.sensorsId]?.parameterName;
      if (name) set.add(name.toLowerCase());
    }
    return Array.from(set).sort();
  }, [latest, sensorsMap]);

  // Si el parámetro seleccionado no existe en esa location, elige el primero disponible
  useEffect(() => {
    if (availableParameters.length === 0) return;
    if (!availableParameters.includes(selectedParameter.toLowerCase())) {
      setSelectedParameter(availableParameters[0]);
    }
  }, [availableParameters, selectedParameter]);

  // 2) Carga histórico: depende de selectedParameter + latest/sensorsMap (para resolver sensorsId)
  useEffect(() => {
    let cancelled = false;

    async function loadMeasurements() {
      setError(null);

      // Necesitamos latest + sensorsMap para encontrar el sensorId del parámetro
      if (latest.length === 0 || Object.keys(sensorsMap).length === 0) {
        setMeasurements([]);
        return;
      }

      const target = selectedParameter.toLowerCase();

      // Busca un sensorsId que corresponda al parámetro elegido
      const sensorIdForParameter =
        latest.find(
          (m) =>
            (sensorsMap[m.sensorsId]?.parameterName ?? "").toLowerCase() === target
        )?.sensorsId ?? null;

      if (!sensorIdForParameter) {
        setMeasurements([]);
        return;
      }

      setLoading(true);
      try {
        const measurementsRes = await getMeasurementsBySensor({
          sensorsId: sensorIdForParameter,
          hours: 24,
          limit: 200,
        });

        if (cancelled) return;
        setMeasurements(measurementsRes.results ?? []);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Error");
        setMeasurements([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMeasurements();
    return () => {
      cancelled = true;
    };
  }, [selectedParameter, latest, sensorsMap]);

  // Unidad del parámetro seleccionado (de metadata)
  const selectedUnit = useMemo(() => {
    const target = selectedParameter.toLowerCase();
    const match = latest.find(
      (m) => (sensorsMap[m.sensorsId]?.parameterName ?? "").toLowerCase() === target
    );
    return match ? sensorsMap[match.sensorsId]?.unit : undefined;
  }, [latest, sensorsMap, selectedParameter]);

  const chartData = measurementsToChartPoints(measurements);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold">OpenAQ Dashboard</h1>

      <div className="mt-4 flex gap-2 items-end">
        <label className="flex flex-col">
          <span className="text-sm">Location ID</span>
          <input
            className="border rounded px-3 py-2"
            type="number"
            value={locationId}
            onChange={(e) => setLocationId(Number(e.target.value))}
          />
        </label>

        <label className="flex flex-col">
          <span className="text-sm">Parameter</span>
          <select
            className="border rounded px-3 py-2"
            value={selectedParameter}
            onChange={(e) => setSelectedParameter(e.target.value)}
            disabled={availableParameters.length === 0}
          >
            {availableParameters.length === 0 ? (
              <option value="">No parameters</option>
            ) : (
              availableParameters.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))
            )}
          </select>
        </label>
      </div>

      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-600">{error}</p>}

      {!loading && !error && location && (
        <div className="mt-6 border rounded p-4">
          <h2 className="text-lg font-medium">{location.name}</h2>
          <p className="text-sm opacity-80">
            {location.locality ?? "Unknown locality"} ·{" "}
            {location.country?.name ?? "Unknown country"}
          </p>
        </div>
      )}

      {!loading && !error && location?.coordinates && (
        <MapView
          latitude={location.coordinates.latitude}
          longitude={location.coordinates.longitude}
          title={location.name}
          subtitle={`${location.locality ?? "Unknown locality"} · ${location.country?.name ?? "Unknown country"}`}
          zoom={11}
        />
      )}


      {!loading && !error && (
        <div className="mt-6">
          {latest.length > 0 && Object.keys(sensorsMap).length === 0 ? (
            <p className="text-sm opacity-80">Loading sensor metadata…</p>
          ) : chartData.length === 0 ? (
            <p className="text-sm opacity-80">
              No historical measurements found for {selectedParameter.toUpperCase()} at this
              location.
            </p>
          ) : (
            <LineChartCard
              title={`${selectedParameter.toUpperCase()} (last 24h)`}
              subtitle={selectedUnit ? `Unit: ${selectedUnit}` : undefined}
              data={chartData}
            />
          )}
        </div>
      )}
    </div>
  );
}
