import { useState, useEffect } from 'react';
import { getLocation, getLatestByLocation, type LatestMeasurement, type Location} from "../services/openaq";
import LineChartCard from "../components/chart/LineChartCard"
import { toChartPoints } from "../utils/toChartPoints";




export default function Dashboard() {
    const [locationId,setLocationId] = useState(2178); // abrir la pagina con contenido
    const [location,setLocation] = useState<Location | null>(null); // hay datos | no se han cargado o no existe la ubicación; null se maneja en el render
    const [latest,setLatest] = useState<LatestMeasurement[]>([]); // siempre array
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

                setLocation(locationRes.results[0] ?? null); // si viene undefined, lo convierte en null; location acepta null (?)
                setLatest(latestRes.results ?? [])

                // console.log("latestRes sample: ", latestRes.results?.[0]);
                // console.log("latestRes results: ", latestRes.results);


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



     const chartData = latest ? toChartPoints(latest) : [];

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
            <h3 className="font-medium">Latest measurements</h3>

            {latest.length === 0 ? (
              <p className="mt-2 text-sm opacity-80">No latest measurements found for this location.</p>
            ) : (
               <div className='mt-6'>
                  <LineChartCard title="Latest measurments (value over time)" data={chartData} />
                </div>
            )}
          </div>
        )}
    </div>
    )
}