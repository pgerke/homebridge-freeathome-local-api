import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { SceneAccessory } from "../src/sceneAccessory.js";
import { EmptyGuid } from "../src/util.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";

describe("Scene Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Scene Accessory");
    platformAccessory.context = {
      channel: channel,
      channelId: "ch1234",
      device: device,
      deviceSerial: "ABB7xxxxxxxx",
    };
  });
  afterEach(() => {
    jasmine.clock().uninstall();
    platform.resetLoggerCalls();
  });

  it("should be created", async () => {
    const accessory = new SceneAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new SceneAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeTrue();
  });

  it("should not handle a request to set On characteristic if the value has not changed", async () => {
    const accessory = new SceneAccessory(platform, platformAccessory);
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
    jasmine.clock().install();
    const accessory = new SceneAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.On
    );
    expect(await characteristic.handleGetRequest()).toBeFalse();
    const setDatapointSpy = spyOn(accessory.platform.sysap, "setDatapoint");
    const updateDatapointSpy = spyOn(accessory, "updateDatapoint");
    await characteristic.handleSetRequest(true);
    expect(await characteristic.handleGetRequest()).toBeTrue();
    expect(setDatapointSpy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "odp0000",
      "1"
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Scene Accessory (Scene Actuator ABB7xxxxxxxx (ch1234)) set characteristic On -> true"
    );
    jasmine.clock().tick(3000);
    expect(updateDatapointSpy).toHaveBeenCalledWith("odp0000", "0");
  });

  it("should not handle requests to set On characteristic to false even if the value has changed", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new SceneAccessory(platform, platformAccessory);
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
    expect(spy).not.toHaveBeenCalled();

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.error).toHaveBeenCalledWith(
      "Scene Accessory (Scene Actuator ABB7xxxxxxxx (ch1234)) cannot be disabled"
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new SceneAccessory(platform, platformAccessory);
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
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update to known datapoint", async () => {
    const accessory = new SceneAccessory(platform, platformAccessory);
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
      "Scene Actuator",
      instance.service,
      accessory.platform.Characteristic.On,
      true
    );
  });
});
