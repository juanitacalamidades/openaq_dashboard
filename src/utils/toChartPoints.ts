import type { LatestMeasurement } from "../services/openaq";
import type { ChartPoint } from "../types/chart";

// Convierte las mediciones con tipo LatestMeasurement[] en ChartPoint[] para gráficos
// m = measurement
// nombre parámetro : tipo
// : tipo de retorno
//.filter para evitar valores raros o NaN; 
// .map para convertir cada medición en puntos del gráfico

export function toChartPoints( latest: LatestMeasurement[]): ChartPoint[] {
    return latest.filter( (m) => Number.isFinite(m.value) ).map( (m) => ({ 
        time: new Date(m.datetime.utc).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit"}),
        value: m.value
    }));
}


// At this point the chart visualizes the latest available measurements for a location. V
// Values are shown without grouping by parameter, as the goal is to demonstrate data fetching, transformation, and visualization patterns.