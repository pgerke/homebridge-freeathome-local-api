import { API, HomebridgeAPI } from "homebridge/api";

describe("Homebridge entrypoint", () => {
  it("should successfully register the plugin", (done) => {
    const api = new HomebridgeAPI();
    api.once("registerPlatform", () => done());
    import("../src/index.js")
      .then((fn: { default: (api: API) => void }) => fn.default(api))
      .catch((reason) => fail(reason));
  });
});
