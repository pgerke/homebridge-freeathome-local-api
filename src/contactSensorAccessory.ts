import { PlatformAccessory, Service } from "homebridge";
import { FreeAtHomeAccessory } from "./freeAtHomeAccessory";
import { FreeAtHomeContext } from "./freeAtHomeContext";
import { FreeAtHomeHomebridgePlatform } from "./platform";

/** A contact sensor accessory. */
export class ContactSensorAccessory extends FreeAtHomeAccessory {
  private readonly service: Service;
  private contactOpen: boolean;

  /**
   * Constructs a new contact sensor accessory instance.
   * @param platform The free&#64;home Homebridge platform controlling the accessory
   * @param accessory The platform accessory.
   */
  constructor(
    readonly platform: FreeAtHomeHomebridgePlatform,
    readonly accessory: PlatformAccessory<FreeAtHomeContext>
  ) {
    super(platform, accessory);

    // set initial state
    this.contactOpen = !!parseInt(
      this.accessory.context.channel.outputs?.odp0000.value ?? "0"
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
    if (datapoint !== "odp0000") return;

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
