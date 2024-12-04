import { Channel, Device } from "freeathome-local-api-client";
import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { TriggerSensorAccessory } from "../src/triggerSensorAccessory.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";

describe("Trigger Sensor Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {
      inputs: {
        dp1: {
          pairingID: 2,
        },
      },
    };
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Trigger Sensor Accessory");
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
  });
  afterEach(() => {
    platform.resetLoggerCalls();
    jasmine.clock().uninstall();
  });

  it("should be created", async () => {
    const accessory = new TriggerSensorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ProgrammableSwitchEvent
    );
    expect(await characteristic.handleGetRequest()).toBeNull();
  });

  it("should ignore update if datapoint is unknown", () => {
    const accessory = new TriggerSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ProgrammableSwitchEvent
    );
    const spy = spyOn(characteristic, "sendEventNotification");
    accessory.updateDatapoint("test");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should send a notification when the datapoint is updated", () => {
    const accessory = new TriggerSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ProgrammableSwitchEvent
    );
    const spy = spyOn(characteristic, "sendEventNotification");
    accessory.updateDatapoint("dp1");
    expect(spy).toHaveBeenCalledWith(
      platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
    );
  });
});
