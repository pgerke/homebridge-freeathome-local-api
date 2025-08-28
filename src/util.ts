import { InOutPut } from "freeathome-local-api-client";
import { CharacteristicValue } from "homebridge";

/**
 * The current version of the application.
 *
 * This constant is used to indicate the build or release version of the app.
 * In development environments, it may be set to "DEBUG".
 */
export const APP_VERSION = "v1.15.1-pre.0-6eeecf4";

/**
 * In the local API the system access point UUID is always an empty UUID. Could be extended later to also support the cloud API.
 */
export const EmptyGuid = "00000000-0000-0000-0000-000000000000";

/**
 * Gets the name of the data point with the specified pairing ID.
 * @param datapoints The data points
 * @param pairingID The pairing ID.
 * @returns The data point name or null, if no data point was found for the specified pairing ID.
 */
export function getDataPointByPairingID(
  datapoints: { [key: string]: InOutPut } | undefined,
  pairingID: number
): string {
  if (!datapoints) throw new Error("Data point object is undefined");

  for (const e of Object.keys(datapoints)) {
    if (datapoints[e].pairingID === pairingID) {
      return e;
    }
  }

  throw new Error(`No data point found for pairing ID ${pairingID}`);
}

export function convertToString(value: CharacteristicValue): string {
  return typeof value.valueOf() === "object"
    ? JSON.stringify(value, undefined, 2)
    : // eslint-disable-next-line @typescript-eslint/no-base-to-string, indent
      value.toString();
}
