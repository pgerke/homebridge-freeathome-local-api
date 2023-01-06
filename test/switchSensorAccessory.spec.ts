import { Channel, Device } from "freeathome-local-api-client";
import { Service } from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { SwitchSensorAccessory } from "../src/switchSensorAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

describe("Switch Sensor Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory(
      "Switch Sensor Accessory",
      EmptyGuid
    );
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
    const accessory = new SwitchSensorAccessory(platform, platformAccessory);
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
    const accessory = new SwitchSensorAccessory(platform, platformAccessory);
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
    const accessory = new SwitchSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ProgrammableSwitchEvent
    );
    const spy = spyOn(characteristic, "sendEventNotification");
    accessory.updateDatapoint("idp0000");
    expect(spy).toHaveBeenCalledWith(
      platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS
    );
  });
});
