import { Channel, Device } from "freeathome-local-api-client";
import {
  Characteristic,
  CharacteristicValue,
  PlatformAccessory,
  Service,
  WithUUID,
} from "homebridge";
import { FreeAtHomeContext } from "../src/freeAtHomeContext.js";
import { RadiatorActuatorAccessory } from "../src/radiatorActuatorAccessory.js";
import { EmptyGuid } from "../src/util.js";
import {
  createPlatformAccessory,
  MockFreeAtHomeHomebridgePlatform,
} from "./platform.mock.js";

describe("Radiator Actuator Accessory", () => {
  let channel: Channel;
  let device: Device;
  let platform: MockFreeAtHomeHomebridgePlatform;
  let platformAccessory: PlatformAccessory<FreeAtHomeContext>;

  beforeEach(() => {
    channel = {
      outputs: {
        odp0000: {
          pairingID: 331,
        },
        odp0006: {
          pairingID: 51,
        },
        odp0008: {
          pairingID: 56,
        },
        odp0010: {
          pairingID: 304,
        },
      },
      inputs: {
        idp0012: { pairingID: 66 },
        idp0016: { pairingID: 320 },
      },
    };
    device = {};
    platform = new MockFreeAtHomeHomebridgePlatform();
    platformAccessory = createPlatformAccessory("Radiator Actuator Accessory");
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

  it("should throw if expected data points are missing on channel", () => {
    channel.inputs = undefined;

    expect(
      () => new RadiatorActuatorAccessory(platform, platformAccessory)
    ).toThrowError("Channel lacks expected input or output data points.");
  });

  it("should be created with default state", async () => {
    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    const characteristicTdu = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TemperatureDisplayUnits
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    expect(await characteristicCt.handleGetRequest()).toBe(0);
    expect(await characteristicTt.handleGetRequest()).toBe(7);
    expect(await characteristicTdu.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TemperatureDisplayUnits.CELSIUS
    );
  });

  it("should be created with heating state", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.HEAT
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristicCt.handleGetRequest()).toBe(20);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
  });

  it("should be created with controller active but not heating or cooling", async () => {
    channel.outputs!.odp0000.value = "0";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "23";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristicCt.handleGetRequest()).toBe(23);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
  });

  // it("should be created with invalid CurrentHeatingCooling state", async () => {
  //   /* eslint-disable @typescript-eslint/no-non-null-assertion */
  //   channel.outputs!.odp0000.value = "1";
  //   channel.outputs!.odp0001.value = "1";
  //   channel.outputs!.odp0006.value = "21.5";
  //   channel.outputs!.odp0008.value = "1";
  //   channel.outputs!.odp0010.value = "23";
  //   /* eslint-enable @typescript-eslint/no-non-null-assertion */

  //   const accessory = new RadiatorActuatorAccessory(
  //     platform,
  //     platformAccessory
  //   );
  //   expect(accessory).toBeTruthy();
  //   const instance = accessory as unknown as {
  //     service: Service;
  //   };
  //   const characteristicChcs = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState
  //   );
  //   const characteristicThcs = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.TargetHeatingCoolingState
  //   );
  //   const characteristicCt = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.CurrentTemperature
  //   );
  //   const characteristicTt = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.TargetTemperature
  //   );
  //   expect(await characteristicChcs.handleGetRequest()).toBe(
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
  //   );
  //   expect(await characteristicThcs.handleGetRequest()).toBe(
  //     accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
  //   );
  //   expect(await characteristicCt.handleGetRequest()).toBe(23);
  //   expect(await characteristicTt.handleGetRequest()).toBe(21.5);
  //   // eslint-disable-next-line @typescript-eslint/unbound-method
  //   expect(accessory.platform.log.error).toHaveBeenCalledWith(
  //     "Invalid State: Heating and cooling cannot be on simultaneously!"
  //   );
  // });

  it("should not handle a request to set TargetTemperature characteristic if the value has not changed", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristic.handleGetRequest()).toBe(21.5);
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(21.5);
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle request to set TargetTemperature characteristic if the value has changed", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristic.handleGetRequest()).toBe(21.5);
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(22);
    expect(await characteristic.handleGetRequest()).toBe(22);
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0016",
      "22.0"
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Radiator Actuator Accessory (Radiator Actuator ABB7xxxxxxxx (ch1234)) set characteristic TargetTemperature -> 22"
    );
  });

  it("should not handle a request to set TargetHeatingCoolingState characteristic if the value has not changed", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(spy).not.toHaveBeenCalled();
  });

  it("should handle request to set TargetHeatingCoolingState characteristic to off", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0012",
      "0"
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Radiator Actuator Accessory (Radiator Actuator ABB7xxxxxxxx (ch1234)) set characteristic TargetHeatingCoolingState -> 0"
    );
  });

  it("should handle request to set TargetHeatingCoolingState characteristic to off", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "0";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
      platform,
      platformAccessory
    );
    expect(accessory).toBeTruthy();
    const instance = accessory as unknown as {
      service: Service;
    };
    const characteristic = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    const spy = spyOn(accessory.platform.sysap, "setDatapoint");
    await characteristic.handleSetRequest(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristic.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(spy).toHaveBeenCalledWith(
      EmptyGuid,
      "ABB7xxxxxxxx",
      "ch1234",
      "idp0012",
      "1"
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(platform.log.info).toHaveBeenCalledWith(
      "Radiator Actuator Accessory (Radiator Actuator ABB7xxxxxxxx (ch1234)) set characteristic TargetHeatingCoolingState -> 3"
    );
  });

  it("should ignore update if datapoint is unknown", async () => {
    const accessory = new RadiatorActuatorAccessory(
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
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    expect(await characteristicCt.handleGetRequest()).toBe(0);
    expect(await characteristicTt.handleGetRequest()).toBe(7);
    accessory.updateDatapoint("test", "0");
    expect(spy).not.toHaveBeenCalled();
  });

  it("should process update to heating mode datapoint", async () => {
    channel.outputs!.odp0000.value = "0";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
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
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristicCt.handleGetRequest()).toBe(20);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
    accessory.updateDatapoint("odp0000", "1");
    expect(spy).toHaveBeenCalledWith(
      "Radiator Actuator",
      instance.service,
      accessory.platform.Characteristic.CurrentHeatingCoolingState,
      accessory.platform.Characteristic.CurrentHeatingCoolingState.HEAT
    );
  });

  // it("should process update to cooling mode datapoint", async () => {
  //   /* eslint-disable @typescript-eslint/no-non-null-assertion */
  //   channel.outputs!.odp0000.value = "0";
  //   channel.outputs!.odp0001.value = "0";
  //   channel.outputs!.odp0006.value = "21.5";
  //   channel.outputs!.odp0008.value = "1";
  //   channel.outputs!.odp0010.value = "23";
  //   /* eslint-enable @typescript-eslint/no-non-null-assertion */

  //   const accessory = new RadiatorActuatorAccessory(
  //     platform,
  //     platformAccessory
  //   );
  //   const instance = accessory as unknown as {
  //     service: Service;
  //     doUpdateDatapoint: (
  //       acccessoryDisplayType: string,
  //       service: Service,
  //       characteristic: WithUUID<new () => Characteristic>,
  //       characteristicValue: CharacteristicValue
  //     ) => void;
  //   };
  //   const spy = spyOn(instance, "doUpdateDatapoint");
  //   const characteristicChcs = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState
  //   );
  //   const characteristicThcs = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.TargetHeatingCoolingState
  //   );
  //   const characteristicCt = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.CurrentTemperature
  //   );
  //   const characteristicTt = instance.service.getCharacteristic(
  //     accessory.platform.Characteristic.TargetTemperature
  //   );
  //   expect(await characteristicChcs.handleGetRequest()).toBe(
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
  //   );
  //   expect(await characteristicThcs.handleGetRequest()).toBe(
  //     accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
  //   );
  //   expect(await characteristicCt.handleGetRequest()).toBe(23);
  //   expect(await characteristicTt.handleGetRequest()).toBe(21.5);
  //   accessory.updateDatapoint("odp0001", "1");
  //   expect(spy).toHaveBeenCalledWith(
  //     "Radiator Actuator",
  //     instance.service,
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState,
  //     accessory.platform.Characteristic.CurrentHeatingCoolingState.COOL
  //   );
  // });

  it("should process update to controller on/off datapoint", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "0";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
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
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.OFF
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.OFF
    );
    expect(await characteristicCt.handleGetRequest()).toBe(20);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
    accessory.updateDatapoint("odp0008", "1");
    expect(spy).toHaveBeenCalledWith(
      "Radiator Actuator",
      instance.service,
      accessory.platform.Characteristic.CurrentHeatingCoolingState,
      accessory.platform.Characteristic.CurrentHeatingCoolingState.HEAT
    );
    expect(spy).toHaveBeenCalledWith(
      "Radiator Actuator",
      instance.service,
      accessory.platform.Characteristic.TargetHeatingCoolingState,
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
  });

  it("should process update to target temperature datapoint", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
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
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.HEAT
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristicCt.handleGetRequest()).toBe(20);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
    accessory.updateDatapoint("odp0006", "23");
    expect(spy).toHaveBeenCalledWith(
      "Radiator Actuator",
      instance.service,
      accessory.platform.Characteristic.TargetTemperature,
      23
    );
  });

  it("should process update to current temperature datapoint", async () => {
    channel.outputs!.odp0000.value = "1";
    channel.outputs!.odp0006.value = "21.5";
    channel.outputs!.odp0008.value = "1";
    channel.outputs!.odp0010.value = "20";

    const accessory = new RadiatorActuatorAccessory(
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
    const characteristicChcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentHeatingCoolingState
    );
    const characteristicThcs = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetHeatingCoolingState
    );
    const characteristicCt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.CurrentTemperature
    );
    const characteristicTt = instance.service.getCharacteristic(
      accessory.platform.Characteristic.TargetTemperature
    );
    expect(await characteristicChcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.CurrentHeatingCoolingState.HEAT
    );
    expect(await characteristicThcs.handleGetRequest()).toBe(
      accessory.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );
    expect(await characteristicCt.handleGetRequest()).toBe(20);
    expect(await characteristicTt.handleGetRequest()).toBe(21.5);
    accessory.updateDatapoint("odp0010", "20.46");
    expect(spy).toHaveBeenCalledWith(
      "Radiator Actuator",
      instance.service,
      accessory.platform.Characteristic.CurrentTemperature,
      20.46
    );
  });
});
