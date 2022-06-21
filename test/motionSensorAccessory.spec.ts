import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  Service,
  WithUUID,
} from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { MotionSensorAccessory } from "../src/motionSensorAccessory";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

describe("Motion Sensor Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory(
      "Motion Sensor Accessory",
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
  });

  it("should be created", async () => {
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.MotionDetected
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.MotionDetected
    );
    expect(await characteristic.handleGetRequest()).toBeTrue();
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
      doUpdateDatapoint: (
        acccessoryDisplayType: string,
        service: Service,
        characteristic: WithUUID<new () => Characteristic>,
        characteristicValue: CharacteristicValue
      ) => void;
    };
    const spy = spyOn(instance, "doUpdateDatapoint");
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.MotionDetected
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update to known datapoint", async () => {
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
      doUpdateDatapoint: (
        acccessoryDisplayType: string,
        service: Service,
        characteristic: WithUUID<new () => Characteristic>,
        characteristicValue: CharacteristicValue
      ) => void;
    };
    const spy = spyOn(instance, "doUpdateDatapoint");
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.MotionDetected
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      true
    );
  });
});
