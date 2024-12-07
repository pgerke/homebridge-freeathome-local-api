import { Categories } from "hap-nodejs";
import { Logger, PlatformAccessory, PlatformConfig } from "homebridge";
import { HomebridgeAPI } from "homebridge/api";
import { PlatformAccessory as PlatformAccessoryInternal } from "homebridge/platformAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { EmptyGuid } from "../src/util.js";
import { FreeAtHomeHomebridgePlatform } from "./../src/platform.js";

const logger: Logger = {
  debug: jasmine.createSpy(),
  error: jasmine.createSpy(),
  info: jasmine.createSpy(),
  warn: jasmine.createSpy(),
  log: jasmine.createSpy(),
  success: jasmine.createSpy(),
};

function config(): PlatformConfig {
  return {
    name: "Test Platform Configuration",
    platform: "free@home Unit Testing Platform",
    motionSensorAutoReset: false,
    motionSensorDefaultResetTimer: 20000,
  };
}

/**
 * Creates a new platform accessory.
 *
 * @param displayName - The display name of the accessory.
 * @param UUID - The unique identifier for the accessory. Defaults to `EmptyGuid`.
 * @param category - The category of the accessory (optional).
 * @returns A new instance of `PlatformAccessory` with the specified context.
 */
export function createPlatformAccessory(
  displayName: string,
  UUID: string = EmptyGuid,
  category?: Categories
): PlatformAccessory<FreeAtHomeContext> {
  return new PlatformAccessoryInternal<FreeAtHomeContext>(
    displayName,
    UUID,
    category
  );
}

const api = new HomebridgeAPI();
export class MockFreeAtHomeHomebridgePlatform extends FreeAtHomeHomebridgePlatform {
  constructor() {
    super(logger, config(), api);
  }

  public resetLoggerCalls(): void {
    (this.log.debug as jasmine.Spy).calls.reset();
    (this.log.error as jasmine.Spy).calls.reset();
    (this.log.info as jasmine.Spy).calls.reset();
    (this.log.warn as jasmine.Spy).calls.reset();
    (this.log.log as jasmine.Spy).calls.reset();
  }
}
