import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { DoorOpenerAccessory } from "../src/doorOpenerAccessory.js";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { EmptyGuid } from "../src/util.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";

describe("Door Opener Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {};
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Door Opener Accessory");
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
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicLockCurrentState = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockCurrentState
    );
    expect(await characteristicLockCurrentState.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockCurrentState.SECURED
    );
    const characteristicLockTargetState = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristicLockTargetState.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
  });

  it("should be created with non-default state", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicLockCurrentState = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockCurrentState
    );
    expect(await characteristicLockCurrentState.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockCurrentState.UNSECURED
    );
    const characteristicLockTargetState = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristicLockTargetState.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.UNSECURED
    );
  });

  it("should not handle a request to set LockTargetState characteristic if the value has not changed", async () => {
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle request to set LockTargetState characteristic to unsecured if the value has changed", async () => {
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.LockTargetState.UNSECURED
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.UNSECURED
    );
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0000",
      "1"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Door Opener Accessory (Door Opener ABB7xxxxxxxx (ch1234)) set characteristic LockTargetState -> 0"
    );
  });

  it("should handle request to set LockTargetState characteristic to secured if the value has changed", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.UNSECURED
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0000",
      "0"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Door Opener Accessory (Door Opener ABB7xxxxxxxx (ch1234)) set characteristic LockTargetState -> 1"
    );
  });

  it("should handle a rejected request to set LockTargetState characteristic", async () => {
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.LockTargetState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint").and.rejectWith(
      "Some Error"
    );
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.LockTargetState.UNSECURED
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockTargetState.SECURED
    );
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0000",
      "1"
    );
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.error).toHaveBeenCalledWith(
      // eslint-disable-next-line max-len
      "Door Opener Accessory (Door Opener ABB7xxxxxxxx (ch1234)) failed to set characteristic LockTargetState -> 0. Is the door opener configured in free@home?"
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
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

  it("should process update to known datapoint (now unsecured)", async () => {
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.LockCurrentState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockCurrentState.SECURED
    );
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Door Opener",
      instance.service,
      accessory.platform.Characteristic.LockCurrentState,
      accessory.platform.Characteristic.LockCurrentState.UNSECURED
    );
  });

  it("should process update to known datapoint (now secured)", async () => {
    channel.outputs = {
      odp0000: {
        value: "1",
      },
    };
    const accessory = new DoorOpenerAccessory(platform, platformAccessory);
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
      accessory.platform.Characteristic.LockCurrentState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.LockCurrentState.UNSECURED
    );
    accessory.updateDatapoint("odp0000", "0");
    expect(spy).toHaveBeenCalledWith(
      "Door Opener",
      instance.service,
      accessory.platform.Characteristic.LockCurrentState,
      accessory.platform.Characteristic.LockCurrentState.SECURED
    );
  });
});
