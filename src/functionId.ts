/**
 * The enumeration containing the supported function IDs as defined at
 * https://developer.eu.mybuildings.abb.com/fah_local/reference/functionids/
 */
export enum FunctionID {
  /** A (binary) switch actuator  */
  FID_SWITCH_ACTUATOR = "7",
  /** A master room temperature controller that does not include a fan */
  FID_ROOM_TEMPERATURE_CONTROLLER_MASTER_WITHOUT_FAN = "23",
  /** A dim actuator  */
  FID_DIMMING_ACTUATOR = "12",
  /** A dim actuator that can also control the light hue */
  FID_RGB_W_ACTUATOR = "2E",
  /** A dim actuator that can also control the light hue */
  FID_RGB_ACTUATOR = "2F",
}
