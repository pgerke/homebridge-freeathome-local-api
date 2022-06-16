import { Channel, Device } from "freeathome-local-api-client";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { SwitchActuatorAccessory } from "../src/switchActuatorAccessory";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

const channel: Channel = {};
const device: Device = {};

describe("Switch Actuator Accessory", () => {
  it("should be created", () => {
    const platform = new MockFreeAtHomeHomebridgePlatform();
    const platformAccessory: PlatformAccessory<FreeAtHomeContext> =
      new PlatformAccessory("Test Switch Actuator Accessory", EmptyGuid);
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
    const accessory = new SwitchActuatorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
  });
});
