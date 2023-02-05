import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  Service,
  WithUUID,
} from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { WeatherStationTemperatureSensorAccessory } from "../src/temperatureSensorAccessory";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

describe("Temperature Sensor Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {
      outputs: {
        dp1: {
          pairingID: 1024,
        },
      },
    };
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory(
      "Temperature Sensor Accessory",
      EmptyGuid
    );
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
  });

  it("should throw if expected data points are missing on channel", () => {
    channel.outputs = undefined;

    expect(
      () =>
        new WeatherStationTemperatureSensorAccessory(
          platform,
          platformAccessory
        )
    ).toThrowError("Channel lacks expected input or output data points.");
  });

  it("should be created", async () => {
    const accessory = new WeatherStationTemperatureSensorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    expect(await characteristic.handleGetRequest()).toBe(0.0);
  });

  it("should be created with non-default state", async () => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    platformAccessory.context.channel.outputs!.dp1.value = "12.3";
    const accessory = new WeatherStationTemperatureSensorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const value = await characteristic.handleGetRequest();
    expect(value).not.toBeNull();
    expect(Math.abs((value as number) - 12.3)).toBeLessThan(0.0001);
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new WeatherStationTemperatureSensorAccessory(
      platform,
      platformAccessory
    );
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
      accessory.platform.Characteristic.CurrentTemperature
    );
    expect(await characteristic.handleGetRequest()).toBe(0);
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update if the datapoint is known", async () => {
    const accessory = new WeatherStationTemperatureSensorAccessory(
      platform,
      platformAccessory
    );
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
      accessory.platform.Characteristic.CurrentTemperature
    );
    expect(await characteristic.handleGetRequest()).toBe(0);
    accessory.updateDatapoint("dp1", "12.3");
    expect(spy).toHaveBeenCalledWith(
      "Temperature Sensor",
      instance.service,
      accessory.platform.Characteristic.CurrentTemperature,
      12.3
    );
  });
});
