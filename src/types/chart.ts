// Tipo de gráfico. Separa datos crudos de la API de datos para UI.

export type ChartPoint = {
    time : string; // etiqueta en el eje X
    value : number; // eje Y
}