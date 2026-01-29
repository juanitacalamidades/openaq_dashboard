const BASE_URL = "http://localhost:3001/api/openaq" 
const API_KEY = import.meta.env.VITE_OPENAQ_API_KEY as string; //type assertion

if(!BASE_URL) throw new Error("Falta url");
if(!API_KEY) throw new Error("Falta API KEY");


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
    const res = await fetch(`${BASE_URL}${path}`, {
        headers : {"X-API-Key" : API_KEY}
    });

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

export async function getLocation( id : number ) {
   return openaqFetch<Location>(`/locations/${id}`);
}


export async function getLatestByLocation( id : number ) {
    return openaqFetch<LatestMeasurement>(`/locations/${id}/latest`);    // endpoint documentado en --> https://docs.openaq.org/resources/latest
}