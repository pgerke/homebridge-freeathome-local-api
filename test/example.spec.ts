import { originalTimeout } from "./../test.js";
import { PLUGIN_NAME } from "./../src/settings.js";

describe("Example Test Suite", () => {
  afterAll(() => {
    // Restore the default Jasmine timeout after the test suite.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
  });

  it("should be executed", () => {
    expect(PLUGIN_NAME).toBe("homebridge-freeathome-local-api");
  });
});
