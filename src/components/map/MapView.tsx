import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";


// Props del componente. 
// El mapa depende únicamente de coordenadas y de metadata (opcional) para el popup


type Props = {
    latitude : number;
    longitude : number;
    title?: string;
    subtitle?: string;
    zoom?: number;
} 


export default function MapView({
    latitude,
    longitude,
    title,
    subtitle,
    zoom = 11
} : Props) {



/**
 * 
 * useRef para contenedor del mapa en el DOM; 
 * react no expone directamente nodos del DOM.
 * Mapbox necesita un elemento HTML real donde montar el mapa imperativamente
 * useRef accede a un nodo del DOM sin provocar rerenders
 */

const mapContainerRef = useRef<HTMLDivElement | null>(null); // (null) = valor inicial estándar para refs del DOM.


/**
 * useRef para instancia del mapa de Mapbox
 * 
 * El objeto new mapboxgl.Map(...):
 * - es mutable
 * - tiede estado interno propio
 * - no debe recrearse en cada render
 * 
 * Si usamos useStatae aquí, cada useState causaría un render innecesario y el mapa se rompería
 * 
 * useRef permite: 
 * - guardar una instancia persistente entre renders sin volver a inicializar el mapa cada vez
 * 
 * misma lógica para el marker
 */

 const mapRef = useRef<mapbox.gl | null>(null);

 const markerRef = useRef<mapbox.gl | null>(null);

 // useEffect principal: sincroniza react (estado declarativo) con mapbox (API imperativa)

 useEffect(() => {

    // El token de lee desde .env

    const token = import.meta.env.VITE_MAPBOX_TOKEN as string | undefined;

    if(!token){
        console.log("Missing mapbox token");
        return;
    }

    mapboxgl.accessToken = token;

    // si el div del mapa no existe (primer render), no se puede inicializar el mapa
    if(!mapContainerRef.current) return;


    // Inicialización del mapa SOLO 1 VEZ
    // react puede hacer muchos renders pero el mapa debe crearse solo una vez
    if(!mapRef.current){
        mapRef.current = new mapboxgl.Map({
            container : mapContainerRef.current,
            style : "mapbox://styles/mapbox/streets-v12",
            center : [longitude, latitude],
            zoom
        });
        // Controles de navegación
        mapRef.current.addControl(
            new mapboxgl.NavigationControl(),
            "top-right"
        );
    }

    // Marker. Si existe un marker, lo eliminamos para evitar duplicados cuando cambian las props.
    if(markerRef.current){
        markerRef.current.remove();
    }

     /**
     * Popup simple con información contextual
     */
    const popupHtml = `
      <div style="font-size:12px">
        ${title ? `<div style="font-weight:600">${title}</div>` : ""}
        ${subtitle ? `<div style="opacity:.8">${subtitle}</div>` : ""}
        <div style="margin-top:6px; opacity:.8">
          ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
        </div>
      </div>
    `;

    //Creamos marker y lo añadimos al mapa.
    markerRef.current = new mapboxgl.Marker()
        .setLngLat([longitude,latitude])
        .setPopup( new mapboxgl.Popup( { offset : 12 } ).setHTML(popupHtml) )
        .addTo(mapRef.current);

        // Cuando cambian las cooredenadas, recentramos el mapa

        mapRef.current.setCenter([longitude, latitude]);
        mapRef.current.setZoom(zoom);

 }, [longitude, latitude, title, subtitle, zoom])


    /* Cleanup final. IMPORTANTE 
    - mapbox añade listeners 
    - usa webgl
    - consume memoria
    */
    useEffect( () => {
        return () => {
            markerRef.current?.remove();
            mapRef.current?.remove();
            mapRef.current = null;
        }
    }, [])


    return (
    <section className="border rounded p-4 mt-6">
      <h3 className="font-medium">Map</h3>
      <p className="text-sm opacity-80">Location preview</p>

      {/*
        Este div es SOLO un contenedor.
        React no dibuja el mapa:
        Mapbox se encarga de todo internamente.
      */}
      <div
        ref={mapContainerRef}
        className="mt-4 h-72 w-full rounded"
      />
    </section>
  );
}