import { useState, useEffect, useMemo } from 'react';
import { getLocation, getLatestByLocation, getSensor, type LatestMeasurement, type Location } from "../services/openaq";
import LineChartCard from "../components/chart/LineChartCard"
import { toChartPoints } from "../utils/toChartPoints";
import { getSensorParameterName, getSensorUnit } from "../utils/sensorInfo";




export default function Dashboard() {
    const [locationId,setLocationId] = useState(2178); // abrir la pagina con contenido
    const [location,setLocation] = useState<Location | null>(null); // hay datos | no se han cargado o no existe la ubicación; null se maneja en el render
    const [latest,setLatest] = useState<LatestMeasurement[]>([]); // siempre array
    const [sensorsMap, setSensorsMap] = useState<Record<number, { parameterName?: string; unit?: string}>>({}); // Record es un diccionario {3916: {...}, 1234: {...}}
    const [selectedParameter, setSelectedParameter] = useState<string>("no2");
    const [loading,setLoading] = useState(false);
    const [error,setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load(){
            setLoading(true);
            setError(null);

            try {
                const [locationRes,latestRes] = await Promise.all([ // ejecuta a las dos a la vez para reducir el tiempo de carga
                    getLocation(locationId),
                    getLatestByLocation(locationId)
                ]);

                if(cancelled) return;

                // 1) Guardamos los resultados en variables locales (evita duplicar setState)
                const locationResult = locationRes.results?.[0] ?? null;
                const latestResults = latestRes.results ?? [];

                // 2). Ids únicos de sensores
                const sensorIds = Array.from(new Set(latestResults.map( (m) => m.sensorsId)));

                 // 3) Llamadas en paralelo a /sensors/:id 
                const sensorResponses = await Promise.all(sensorIds.map((id) => getSensor(id)));

                // 4) Construir diccionario sensorId -> {parameter,unit}
                const nextMap: Record<number, { parameterName?: string; unit?: string }> = {};

                sensorResponses.forEach( (resp) => {
                  const sensor = resp.results?.[0];
                  if (sensor.id === 3916) {
                    // console.log("SENSOR 3916 parameter:", sensor.parameter);
                    // console.log("SENSOR 3916 parameter.units:", sensor.parameter?.units);
                    console.log("getSensorUnit(sensor):", getSensorUnit(sensor));
                  }
                  if(!sensor) return;

                  const parameterName = getSensorParameterName(sensor);
                  const unit = getSensorUnit(sensor);

                  nextMap[sensor.id] = { parameterName, unit };

                  
                });
                  console.log("nextMap[3916]:", nextMap[3916]);
                  // 5) Actualizamos estado una sola vez por cosa
                  setLocation(locationResult);
                  setLatest(latestResults);
                  setSensorsMap(nextMap);


            }catch(e) {
                if(cancelled) return;
                setError(e instanceof Error ? e.message : "Error"); // instanceof Error es para tratar bien el tipo en TS/JS 
            }finally { // se ejecuta siempre, loading no se queda colgado
                setLoading(false);
            }
        }

        load();
        return () => {
            cancelled = true;
        };


    },[locationId]);




      const filteredLatest = useMemo(() => {
      const target = selectedParameter.toLowerCase();

      return latest.filter(
        (m) => (sensorsMap[m.sensorsId]?.parameterName ?? "").toLowerCase() === target
      );
    }, [latest, sensorsMap, selectedParameter]);



    const selectedUnit = useMemo( () => {
      const target = selectedParameter.toLowerCase();

      const match = latest.find( (m) => (sensorsMap[m.sensorsId]?.parameterName ?? "").toLowerCase() === target
    );
      return match ? sensorsMap[match.sensorsId]?.unit : undefined;
    }, [latest, sensorsMap, selectedParameter])
    

    const availableParameters = useMemo(() => {
    const set = new Set<string>();

      for (const m of latest) {
        const name = sensorsMap[m.sensorsId]?.parameterName;
        if (name) set.add(name.toLowerCase());
      }

      return Array.from(set).sort(); // ["no2", "pm25", ...]
    }, [latest, sensorsMap]);


    useEffect(() => {
      if (availableParameters.length === 0) return;

      // si el valor actual no existe, usamos el primero disponible
      if (!availableParameters.includes(selectedParameter.toLowerCase())) {
        setSelectedParameter(availableParameters[0]);
      }
    }, [availableParameters, selectedParameter]);


    const chartData = toChartPoints(filteredLatest)
    



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
              {location.locality ?? "Unknown locality"} · {location.country?.name ?? "Unknown country"}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-6">
            {latest.length > 0 && Object.keys(sensorsMap).length === 0 ? (
              <p className="text-sm opacity-80">Loading sensor metadata…</p>
            ) : filteredLatest.length === 0 ? (
              <p className="text-sm opacity-80">
                No measurements found for {selectedParameter.toUpperCase()} at this location.
              </p>
              
            ) : (
                <LineChartCard
                  title={`${selectedParameter.toUpperCase()} (latest)`}
                  subtitle={selectedUnit ? `Unit: ${selectedUnit}` : undefined}
                  data={chartData}
                />
          )}
        </div>
        )}
    </div>
    )
}