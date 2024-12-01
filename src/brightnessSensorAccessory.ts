import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory.js";
import { FreeAtHomeContext } from "./freeAtHomeContext.js";
import { FreeAtHomeHomebridgePlatform } from "./platform.js";
import { getDataPointByPairingID } from "./util.js";

const pidCurrentLightLevel = 1027;

/** A brightness sensor integrated in the free&#64;home weather station. */
export class WeatherStationBrightnessSensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private currentLightLevel: number;
  private readonly pdCurrentLightLevel: string;

  /**
   * Constructs a new brightness sensor accessory instance.
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

    this.pdCurrentLightLevel = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidCurrentLightLevel
    );

    // set initial state
    this.currentLightLevel = parseFloat(
      this.accessory.context.channel.outputs[this.pdCurrentLightLevel].value ??
        "0.0"
    );

    // get the LightSensor service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.LightSensor) ||
      this.accessory.addService(this.platform.Service.LightSensor);

    // register handlers for the Current Ambient Light Level characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.CurrentAmbientLightLevel)
      .onGet(() => this.currentLightLevel);
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== this.pdCurrentLightLevel) return;

    // do the update
    this.currentLightLevel = parseFloat(value);

    this.doUpdateDatapoint(
      "Brightness Sensor",
      this.service,
      this.platform.Characteristic.CurrentAmbientLightLevel,
      this.currentLightLevel
    );
  }
}
