import {
  CharacteristicSetHandler,
  CharacteristicValue,
  PlatformAccessory,
  Service,
} from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import { DefaultDebounce, EmptyGuid } from "./util";
import { debounce } from "debounce";

/** A room temperature controller accessory. */
export class RoomTemperatureControllerAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private controllerOnOff: boolean;
  private heatingOn: boolean;
  private coolingOn: boolean;
  private sysApTargetTemperature: number;
  private stateCurrentTemperature: number;
  private readonly setTargetHeatingCoolingState: CharacteristicSetHandler =
    debounce(
      (value: CharacteristicValue) =>
        this.setTargetHeatingCoolingStateDebounced(value),
      DefaultDebounce
    );
  private readonly setTargetTemperature: CharacteristicSetHandler = debounce(
    (value: CharacteristicValue) => this.setTargetTemperatureDebounced(value),
    DefaultDebounce
  );

  private get stateCurrentHeatingCoolingState(): number {
    if (!this.controllerOnOff) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    } else if (this.heatingOn && !this.coolingOn) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.HEAT;
    } else if (!this.heatingOn && this.coolingOn) {
      return this.platform.Characteristic.CurrentHeatingCoolingState.COOL;
    } else {
      if (this.heatingOn && this.coolingOn)
        this.platform.log.error(
          "Invalid State: Heating and cooling cannot be on simultaneously!"
        );
      return this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
    }
  }
  private get stateTargetHeatingCoolingState(): number {
    return this.controllerOnOff
      ? this.platform.Characteristic.TargetHeatingCoolingState.AUTO
      : this.platform.Characteristic.TargetHeatingCoolingState.OFF;
  }
  private get stateTargetTemperature(): number {
    return this.sysApTargetTemperature;
    // return Math.max(10.0, this.sysApTargetTemperature);
  }

  /**
   * Constructs a new Room Temperature Controller accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // set initial state
    this.controllerOnOff = !!parseInt(
      this.accessory.context.channel.outputs?.odp0008.value ?? "0"
    );
    this.heatingOn = !!parseInt(
      this.accessory.context.channel.outputs?.odp0000.value ?? "0"
    );
    this.coolingOn = !!parseInt(
      this.accessory.context.channel.outputs?.odp0001.value ?? "0"
    );
    this.stateCurrentTemperature = parseFloat(
      this.accessory.context.channel.outputs?.odp0010.value ?? "0.0"
    );
    this.sysApTargetTemperature = parseFloat(
      this.accessory.context.channel.outputs?.odp0006.value ?? "0.0"
    );

    // get the Thermostat service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.Thermostat) ||
      this.accessory.addService(this.platform.Service.Thermostat);

    // register handlers for the Current Heating Cooling State Characteristic
    this.service
      .getCharacteristic(
        this.platform.Characteristic.CurrentHeatingCoolingState
      )
      .onGet(() => this.stateCurrentHeatingCoolingState);
    // register handlers for the Target Heating Cooling State Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.TargetHeatingCoolingState)
      .onSet(this.setTargetHeatingCoolingState.bind(this))
      .onGet(() => this.stateTargetHeatingCoolingState)
      .setProps({
        validValues: [0, 3],
      });
    // register handlers for the Current Temperature Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(() => this.stateCurrentTemperature);
    // register handlers for the Target Temperature Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.TargetTemperature)
      .onSet(this.setTargetTemperature.bind(this))
      .onGet(() => this.stateTargetTemperature)
      .setProps({
        maxValue: 35,
        minValue: 7,
        minStep: 0.5,
      });
    // register handlers for the Temperature Display Units Characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.TemperatureDisplayUnits)
      .onGet(
        () => this.platform.Characteristic.TemperatureDisplayUnits.CELSIUS
      );
  }

  private async setTargetTemperatureDebounced(
    value: CharacteristicValue
  ): Promise<void> {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Room Temperature Controller ${
        this.serialNumber
      }) set characteristic TargetTemperature -> ${value.toString()}`
    );

    // Heating Cooling State must not be OFF to set the target temperature
    if (
      this.stateCurrentHeatingCoolingState ===
      this.platform.Characteristic.CurrentHeatingCoolingState.OFF
    ) {
      await this.setTargetHeatingCoolingStateDebounced(
        this.platform.Characteristic.TargetHeatingCoolingState.AUTO
      );
    }

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0016",
      (value as number).toFixed(1)
    );
  }

  private async setTargetHeatingCoolingStateDebounced(
    value: CharacteristicValue
  ): Promise<void> {
    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Room Temperature Controller ${
        this.serialNumber
      }) set characteristic TargetHeatingCoolingState -> ${value.toString()}`
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      "idp0012",
      value === this.platform.Characteristic.TargetHeatingCoolingState.OFF
        ? "0"
        : "1"
    );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    switch (datapoint) {
      case "odp0000":
        this.heatingOn = !!parseInt(value);
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.CurrentHeatingCoolingState,
          this.stateCurrentHeatingCoolingState
        );
        return;
      case "odp0001":
        this.coolingOn = !!parseInt(value);
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.CurrentHeatingCoolingState,
          this.stateCurrentHeatingCoolingState
        );
        return;
      case "odp0008":
        this.controllerOnOff = !!parseInt(value);
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.CurrentHeatingCoolingState,
          this.stateCurrentHeatingCoolingState
        );
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.TargetHeatingCoolingState,
          this.stateTargetHeatingCoolingState
        );
        return;
      case "odp0006":
        this.sysApTargetTemperature = parseFloat(value);
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.TargetTemperature,
          this.stateTargetTemperature
        );
        return;
      case "odp0010":
        this.stateCurrentTemperature = parseFloat(value);
        this.doUpdateDatapoint(
          "Room Temperature Controller",
          this.service,
          this.platform.Characteristic.CurrentTemperature,
          this.stateCurrentTemperature
        );
        return;
      default:
        return;
    }
  }
}
