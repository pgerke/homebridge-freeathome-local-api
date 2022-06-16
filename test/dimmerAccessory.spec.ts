import { Channel, Device } from "freeathome-local-api-client";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { DimmerAccessory } from "../src/dimmerAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

const channel: Channel = {};
const device: Device = {};

describe("Dimmer Accessory", () => {
  it("should be created", () => {
    const platform = new MockFreeAtHomeHomebridgePlatform();
    const platformAccessory: PlatformAccessory<FreeAtHomeContext> =
      new PlatformAccessory("Test Dimmer Accessory", EmptyGuid);
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
  });
});
