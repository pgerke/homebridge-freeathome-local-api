import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  Service,
  WithUUID,
} from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { DimmerAccessory } from "../src/dimmerAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

describe("Dimmer Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory("Dimmer Accessory", EmptyGuid);
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

  it("should be created with default state", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicOn = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    const characteristicBrightness = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristicOn.handleGetRequest()).toBeFalse();
    expect(await characteristicBrightness.handleGetRequest()).toBe(0);
  });

  it("should be created with non-default state 1/2", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
      odp0001: {
        value: "20",
      },
    };
    channel.inputs = {
      idp0002: {
        value: "50",
      },
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicOn = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    const characteristicBrightness = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristicOn.handleGetRequest()).toBeTrue();
    expect(await characteristicBrightness.handleGetRequest()).toBe(20);
  });

  it("should be created with non-default state 2/2", async () => {
    channel.inputs = {
      idp0002: {
        value: "20",
      },
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicOn = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    const characteristicBrightness = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristicOn.handleGetRequest()).toBeFalse();
    expect(await characteristicBrightness.handleGetRequest()).toBe(20);
  });

  it("should not handle a request to set On characteristic if the value has not changed", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(false);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle request to set On characteristic to true if the value has changed", async () => {
    channel.outputs = {
      odp0000: {
        value: "0",
      },
      odp0001: {
        value: "20",
      },
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
      setBrightness: (value: CharacteristicValue) => Promise<void>;
    };
    const setBrightnessSpy = spyOn(instance, "setBrightness").and.resolveTo();
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(true);
    expect(await characteristic.handleGetRequest()).toBeTrue();
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0000",
      "1"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Dimmer Accessory (Dimmer Accessory ABB7xxxxxxxx (ch1234)) set characteristic On -> true"
    );
    expect(setBrightnessSpy).toHaveBeenCalledWith(20);
  });

  it("should handle request to set On characteristic to false if the value has changed", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
      odp0001: {
        value: "20",
      },
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeTrue();
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(false);
    expect(await characteristic.handleGetRequest()).toBeFalse();
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0000",
      "0"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Dimmer Accessory (Dimmer Accessory ABB7xxxxxxxx (ch1234)) set characteristic On -> false"
    );
  });

  it("should not handle a request to set Brightness characteristic if the value has not changed", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristic.handleGetRequest()).toBe(0);
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(0);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle request to set Brightness characteristic if the value has changed", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristic.handleGetRequest()).toBe(0);
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(100);
    expect(await characteristic.handleGetRequest()).toBe(100);
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0002",
      "100"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Dimmer Accessory (Dimmer Accessory ABB7xxxxxxxx (ch1234)) set characteristic Brightness -> 100"
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
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
    const characteristicOn = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    const characteristicBrightness = instance.service.getCharacteristic(
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristicOn.handleGetRequest()).toBeFalse();
    expect(await characteristicBrightness.handleGetRequest()).toBe(0);
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update to On datapoint", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Dimmer Accessory",
      instance.service,
      accessory.platform.Characteristic.On,
      true
    );
  });

  it("should process update to Brightness datapoint", async () => {
    const accessory = new DimmerAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristic.handleGetRequest()).toBe(0);
    accessory.updateDatapoint("odp0001", "50");
    expect(spy).toHaveBeenCalledWith(
      "Dimmer Accessory",
      instance.service,
      accessory.platform.Characteristic.Brightness,
      50
    );
  });

  it("should not process Brightness update to 0%", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
      odp0001: {
        value: "20",
      },
    };
    const accessory = new DimmerAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.Brightness
    );
    expect(await characteristic.handleGetRequest()).toBe(20);
    accessory.updateDatapoint("odp0001", "0");
    expect(spy).not.toHaveBeenCalled();
  });
});
