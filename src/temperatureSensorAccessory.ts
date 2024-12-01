import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory.js";
import { FreeAtHomeContext } from "./freeAtHomeContext.js";
import { FreeAtHomeHomebridgePlatform } from "./platform.js";
import { getDataPointByPairingID } from "./util.js";

const pidCurrentTemperature = 1024;

/** A temperature sensor integrated in the free&#64;home weather station. */
export class WeatherStationTemperatureSensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private currentTemperature: number;
  private readonly pdCurrentTemperature: string;

  /**
   * Constructs a new temperature sensor accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // Resolve data points
    if (!this.accessory.context.channel.outputs)
      throw new Error("Channel lacks expected input or output data points.");

    this.pdCurrentTemperature = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidCurrentTemperature
    );

    // set initial state
    this.currentTemperature = parseFloat(
      this.accessory.context.channel.outputs[this.pdCurrentTemperature].value ??
        "0.0"
    );

    // get the TemperatureSensor service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.TemperatureSensor) ||
      this.accessory.addService(this.platform.Service.TemperatureSensor);

    // register handlers for the Current Temperature characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentTemperature)
      .onGet(() => this.currentTemperature);
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== this.pdCurrentTemperature) return;

    // do the update
    this.currentTemperature = parseFloat(value);

    this.doUpdateDatapoint(
      "Temperature Sensor",
      this.service,
      this.platform.Characteristic.CurrentTemperature,
      this.currentTemperature
    );
  }
}
