import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { SmokeDetectorAccessory } from "../src/smokeDetectorAccessory.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";

describe("Smoke Detector Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Smoke Detector Accessory");
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
    const accessory = new SmokeDetectorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.SmokeDetected
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    );
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new SmokeDetectorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.SmokeDetected
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new SmokeDetectorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.SmokeDetected
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    );
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update when smoke was detected", async () => {
    const accessory = new SmokeDetectorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.SmokeDetected
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    );
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Smoke Detector",
      instance.service,
      accessory.platform.Characteristic.SmokeDetected,
      accessory.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
    );
  });

  it("should process update when smoke was not detected", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new SmokeDetectorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.SmokeDetected
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.SmokeDetected.SMOKE_DETECTED
    );
    accessory.updateDatapoint("odp0000", "0");
    expect(spy).toHaveBeenCalledWith(
      "Smoke Detector",
      instance.service,
      accessory.platform.Characteristic.SmokeDetected,
      accessory.platform.Characteristic.SmokeDetected.SMOKE_NOT_DETECTED
    );
  });
});
