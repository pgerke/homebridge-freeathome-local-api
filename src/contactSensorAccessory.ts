import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory.js";
import { FreeAtHomeContext } from "./freeAtHomeContext.js";
import { FreeAtHomeHomebridgePlatform } from "./platform.js";
import { getDataPointByPairingID } from "./util.js";

/** A contact sensor accessory. */
export class ContactSensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private contactOpen: boolean;
  private readonly dpOpenClosed: string;

  /**
   * Constructs a new contact sensor accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>,
    readonly pidOpenClosed: number = 53
  ) {
    super(platform, accessory);

    // Resolve data points
    if (!this.accessory.context.channel.outputs)
      throw new Error("Channel lacks expected input or output data points.");

    this.dpOpenClosed = getDataPointByPairingID(
      this.accessory.context.channel.outputs,
      pidOpenClosed
    );

    // set initial state
    this.contactOpen = !!parseInt(
      this.accessory.context.channel.outputs[this.dpOpenClosed].value ?? "0"
    );

    // get the ContactSensor service if it exists, otherwise create a new service instance
    this.service =
      this.accessory.getService(this.platform.Service.ContactSensor) ||
      this.accessory.addService(this.platform.Service.ContactSensor);

    // register handlers for the contact sensor state characteristic
    this.service
      .getCharacteristic(this.platform.Characteristic.ContactSensorState)
      .onGet(() =>
        this.contactOpen
          ? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
          : this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
      );
  }

  public override updateDatapoint(datapoint: string, value: string): void {
    // ignore unknown data points
    if (datapoint !== this.dpOpenClosed) return;

    // do the update
    this.contactOpen = !!parseInt(value);

    this.doUpdateDatapoint(
      "Contact Sensor",
      this.service,
      this.platform.Characteristic.ContactSensorState,
      this.contactOpen
        ? this.platform.Characteristic.ContactSensorState.CONTACT_NOT_DETECTED
        : this.platform.Characteristic.ContactSensorState.CONTACT_DETECTED
    );
  }
}
