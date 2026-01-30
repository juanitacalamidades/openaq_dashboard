const BASE_URL = "http://localhost:3001/api/openaq" 


if(!BASE_URL) throw new Error("Falta url");



// Definit tipos

type OpenAQMeta = {
    page : number;
    limit : number; // OpenAQ returns 100 by default
    found : number;
}

export type OpenAQResponse<T> = {
    meta : OpenAQMeta;
    results : T[] // genérico = este tipo funciona con cualquier tipo, p.ej. OpenAQResponse<Location>
}

async function openaqFetch<T>(path : string): Promise<OpenAQResponse<T>> {
    const res = await fetch(`${BASE_URL}${path}`);

    // Cubrir todos los errores HTTP
    if(!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error (`OpenAQ error ${res.status} : ${text}`);
    }

    return res.json(); // devuelve any pero hay type trust boundary
}

export type Location = {
    id : number;
    name : string;
    locality? : string;
    timezone? : string;
    country? : { code : string; name : string};
    coordinates? : { latitude : number; longitude : number};
}

export type LatestMeasurement = {
    datetime : { utc : string; local : string};
    value : number;
    coordinates : { latitude : number; longitude : number};
    sensorsId : number;
    locationsId : number; 
}

export type Sensor = {
    id : number;
    name? : string;
    parameter? : {
        id?: number;
        name?:string;
        units?:string;
        displayName?:string;
    }
    unit? : string;
}

export async function getLocation( id : number ) {
   return openaqFetch<Location>(`/locations/${id}`);
}


export async function getLatestByLocation( id : number ) {
    return openaqFetch<LatestMeasurement>(`/locations/${id}/latest`);    // endpoint documentado en --> https://docs.openaq.org/resources/latest
}

export async function getSensor( id : number ) {
    return openaqFetch<Sensor>(`/sensors/${id}`)
}

