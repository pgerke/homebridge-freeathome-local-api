import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  Service,
  WithUUID,
} from "homebridge";
import { PlatformAccessory } from "homebridge/lib/platformAccessory";
import { ContactSensorAccessory } from "../src/contactSensorAccessory";
import { FreeAtHomeContext } from "../src/freeAtHomeContext";
import { EmptyGuid } from "../src/util";
import { MockFreeAtHomeHomebridgePlatform } from "./platform.mock";

describe("Contact Sensor Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = new PlatformAccessory(
      "Contact Sensor Accessory",
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
    const accessory = new ContactSensorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ContactSensorState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      platform.Characteristic.ContactSensorState.CONTACT_DETECTED
    );
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new ContactSensorAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.ContactSensorState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new ContactSensorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.ContactSensorState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      platform.Characteristic.ContactSensorState.CONTACT_DETECTED
    );
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update to when contact is not detected", async () => {
    const accessory = new ContactSensorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.ContactSensorState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      platform.Characteristic.ContactSensorState.CONTACT_DETECTED
    );
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Contact Sensor",
      instance.service,
      accessory.platform.Characteristic.ContactSensorState,
      platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
    );
  });

  it("should process update to when contact is detected", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new ContactSensorAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.ContactSensorState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
    );
    accessory.updateDatapoint("odp0000", "0");
    expect(spy).toHaveBeenCalledWith(
      "Contact Sensor",
      instance.service,
      accessory.platform.Characteristic.ContactSensorState,
      platform.Characteristic.ContactSensorState.CONTACT_DETECTED
    );
  });
});
