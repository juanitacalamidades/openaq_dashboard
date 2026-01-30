import type { Sensor } from "../services/openaq"




export function getSensorParameterName(sensor: Sensor): string | undefined {
  return sensor.parameter?.name;
}

export function getSensorUnit(sensor: Sensor): string | undefined {
  return sensor.parameter?.units;
}
