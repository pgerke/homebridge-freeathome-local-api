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
    jasmine.clock().uninstall();
  });

  it("should throw if expected data points are missing on channel", () => {
    channel.outputs = undefined;

    expect(
      () => new MotionSensorAccessory(platform, platformAccessory)
    ).toThrowError("Channel lacks expected input or output data points.");
  });

  it("should be created", async () => {
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
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
    expect(await characteristic.handleGetRequest()).toBeFalse();
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp123: {
        pairingID: 6,
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
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
      },
    };
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
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
      },
    };
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
    accessory.updateDatapoint("odp123", "1");
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      true
    );
  });

  it("should not set a reset timer if the sensor is reset manually", async () => {
    platform.config.motionSensorAutoReset = true;
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
      },
    };
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      resetTimeout?: NodeJS.Timeout;
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
    expect(instance.resetTimeout).toBeUndefined();
    accessory.updateDatapoint("odp123", "0");
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      false
    );
    expect(instance.resetTimeout).toBeUndefined();
  });

  it("should cancel a set reset timer if the sensor is reset manually", async () => {
    jasmine.clock().install();
    platform.config.motionSensorAutoReset = true;
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
      },
    };
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      resetTimeout?: NodeJS.Timeout;
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
    instance.resetTimeout = setTimeout(
      () => fail("Timer should be cancelled"),
      10000
    );
    accessory.updateDatapoint("odp123", "0");
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      false
    );
    expect(instance.resetTimeout).toBeUndefined();
    jasmine.clock().tick(15000);
  });

  it("should reset the sensor automatically after the specified time", async () => {
    jasmine.clock().install();
    platform.config.motionSensorAutoReset = true;
    channel.outputs = {
      odp123: {
        pairingID: 6,
        value: "0",
      },
    };
    const accessory = new MotionSensorAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      resetTimeout?: NodeJS.Timeout;
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
    expect(instance.resetTimeout).toBeUndefined();
    accessory.updateDatapoint("odp123", "1");
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      true
    );
    expect(instance.resetTimeout).toBeDefined();
    jasmine.clock().tick(20000);
    expect(instance.resetTimeout).toBeUndefined();
    expect(spy).toHaveBeenCalledWith(
      "Motion Sensor",
      instance.service,
      accessory.platform.Characteristic.MotionDetected,
      false
    );
  });
});
