import { Logger, PlatformConfig } from "homebridge";
import { HomebridgeAPI } from "homebridge/lib/api";
import { FreeAtHomeHomebridgePlatform } from "../src/platform";

const api = new HomebridgeAPI();
const config: PlatformConfig = {
  name: "Test Platform Configuration",
  platform: "free@home Unit Testing Platform",
};
const logger: Logger = {
  debug: jasmine.createSpy(),
  error: jasmine.createSpy(),
  info: jasmine.createSpy(),
  warn: jasmine.createSpy(),
  log: jasmine.createSpy(),
};

describe("free@home Homebridge Platform", () => {
  it("should be created", () => {
    const platform = new FreeAtHomeHomebridgePlatform(logger, config, api);
    expect(platform).toBeTruthy();
  });
});
