import { CharacteristicValue, PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeHomebridgePlatform } from "./platform";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { EmptyGuid, convertToString, getDataPointByPairingID } from "./util";

const pidControllerOnOff = 56;
const pidControllerOnOffRequest = 66;
const pidHeatingOn = 331;
const pidCurrentTemperature = 304;
const pidTargetTemperature = 51;
const pidTargetTemperatureRequest = 320;

/** A radiator actuator accessory. */
export class RadiatorActuatorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private controllerOnOff: boolean;
  private heatingOn: boolean;
  private stateCurrentTemperature: number;
  private stateTargetTemperature: number;
  private readonly pdControllerOnOff: string;
  private readonly pdControllerOnOffRequest: string;
  private readonly pdHeatingOn: string;
  private readonly pdCurrentTemperature: string;
  private readonly pdTargetTemperature: string;
  private readonly pdTargetTemperatureRequest: string;

  private get stateCurrentHeatingCoolingState(): number {
    return this.controllerOnOff && this.heatingOn
      ? this.platform.Characteristic.CurrentHeatingCoolingState.HEAT
      : this.platform.Characteristic.CurrentHeatingCoolingState.OFF;
  }
  private get stateTargetHeatingCoolingState(): number {
    return this.controllerOnOff
      ? this.platform.Characteristic.TargetHeatingCoolingState.AUTO
      : this.platform.Characteristic.TargetHeatingCoolingState.OFF;
  }

  /**
   * Constructs a new Radiator Actuator accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // Resolve data points
    if (
      !this.accessory.context.channel.outputs ||
      !this.accessory.context.channel.inputs
    )
      throw new Error("Channel lacks expected input or output data points.");

    this.pdControllerOnOff = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidControllerOnOff
    );
    this.pdControllerOnOffRequest = getDataPointByPairingID(
      this.accessory.context.channel.inputs,
      pidControllerOnOffRequest
    );
    this.pdHeatingOn = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidHeatingOn
    );
    this.pdCurrentTemperature = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidCurrentTemperature
    );
    this.pdTargetTemperature = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidTargetTemperature
    );
    this.pdTargetTemperatureRequest = getDataPointByPairingID(
      this.accessory.context.channel.inputs,
      pidTargetTemperatureRequest
    );

    // set initial state
    this.controllerOnOff = !!parseInt(
      this.accessory.context.channel.outputs[this.pdControllerOnOff].value ??
        "0"
    );
    this.heatingOn = !!parseInt(
      this.accessory.context.channel.outputs[this.pdHeatingOn].value ?? "0"
    );
    this.stateCurrentTemperature = parseFloat(
      this.accessory.context.channel.outputs[this.pdCurrentTemperature].value ??
        "0.0"
    );
    this.stateTargetTemperature = parseFloat(
      this.accessory.context.channel.outputs[this.pdTargetTemperature].value ??
        "0.0"
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

  private async setTargetTemperature(
    value: CharacteristicValue
  ): Promise<void> {
    // avoid unncessary updates or update cache
    if (value === this.stateTargetTemperature) return;
    else this.stateTargetTemperature = value as number;

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Radiator Actuator ${
        this.serialNumber
      }) set characteristic TargetTemperature -> ${convertToString(value)}`
    );

    // Heating Cooling State must not be OFF to set the target temperature
    await this.setTargetHeatingCoolingState(
      this.platform.Characteristic.TargetHeatingCoolingState.AUTO
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      this.pdTargetTemperatureRequest,
      this.stateTargetTemperature.toFixed(1)
    );
  }

  private async setTargetHeatingCoolingState(
    value: CharacteristicValue
  ): Promise<void> {
    // avoid unncessary updates or update cache
    if (value === this.stateTargetHeatingCoolingState) return;
    else this.controllerOnOff = !!(value as number);

    // log event
    this.platform.log.info(
      `${this.accessory.displayName} (Radiator Actuator ${
        this.serialNumber
      }) set characteristic TargetHeatingCoolingState -> ${convertToString(
        value
      )}`
    );

    // set data point at SysAP
    await this.platform.sysap.setDatapoint(
      EmptyGuid,
      this.accessory.context.deviceSerial,
      this.accessory.context.channelId,
      this.pdControllerOnOffRequest,
      value === this.platform.Characteristic.TargetHeatingCoolingState.OFF
        ? "0"
        : "1"
    );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    switch (datapoint) {
      case this.pdHeatingOn:
        this.heatingOn = !!parseInt(value);
        this.doUpdateDatapoint(
          "Radiator Actuator",
          this.service,
          this.platform.Characteristic.CurrentHeatingCoolingState,
          this.stateCurrentHeatingCoolingState
        );
        return;
      case this.pdControllerOnOff:
        this.controllerOnOff = !!parseInt(value);
        this.doUpdateDatapoint(
          "Radiator Actuator",
          this.service,
          this.platform.Characteristic.CurrentHeatingCoolingState,
          this.stateCurrentHeatingCoolingState
        );
        this.doUpdateDatapoint(
          "Radiator Actuator",
          this.service,
          this.platform.Characteristic.TargetHeatingCoolingState,
          this.stateTargetHeatingCoolingState
        );
        return;
      case this.pdTargetTemperature:
        this.stateTargetTemperature = parseFloat(value);
        this.doUpdateDatapoint(
          "Radiator Actuator",
          this.service,
          this.platform.Characteristic.TargetTemperature,
          this.stateTargetTemperature
        );
        return;
      case this.pdCurrentTemperature:
        this.stateCurrentTemperature = parseFloat(value);
        this.doUpdateDatapoint(
          "Radiator Actuator",
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
