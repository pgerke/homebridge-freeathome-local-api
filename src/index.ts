import { API } from "homebridge";
import { PLATFORM_NAME } from "./settings";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import fetch from "node-fetch";
globalThis.fetch = fetch;

/** This method registers the platform with Homebridge */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, FreeAtHomeHomebridgePlatform);
};
