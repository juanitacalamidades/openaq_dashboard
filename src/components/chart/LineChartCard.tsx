import type { ChartPoint } from "../../types/chart";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";


// TS define lo que el componente necesita exactamente
type Props = {
    title: string;
    data: ChartPoint[];
}

export default function LineChartCard( {title,data} : Props ) {
    return (
        <section className="border rounded p-4">
            <h4 className="font-medium">{title}</h4>

            <div className="mt-4 h-64">
                {data.length === 0 ? (
                    <p className="text-sm opacity-80">No data to display</p>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="value" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                )}

            </div>
        </section>
    )
}
