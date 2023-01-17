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
  /** An automatic door opener */
  FID_DES_AUTOMATIC_DOOR_OPENER_ACTUATOR = "20",
  /** A smoke detector */
  FID_SMOKE_DETECTOR = "7D",
  /** A motion detector */
  FID_MOVEMENT_DETECTOR = "11",
  /** A door opener */
  FID_DES_DOOR_OPENER_ACTUATOR = "1A",
  /** A shutter actuator */
  FID_SHUTTER_ACTUATOR = "9",
  /** A roller blind actuator */
  FID_BLIND_ACTUATOR = "61",
  /** An attic window actuator  */
  FID_ATTIC_WINDOW_ACTUATOR = "62",
  /** An awning actuator */
  FID_AWNING_ACTUATOR = "63",
  /** A scene */
  FID_SCENE = "4800",
}

/** Contains the list of function IDs that are only experimentally supported by the plugin */
export const experimentallySupportedFunctionIDs: Array<FunctionID> = [
  FunctionID.FID_SHUTTER_ACTUATOR,
  FunctionID.FID_BLIND_ACTUATOR,
  FunctionID.FID_ATTIC_WINDOW_ACTUATOR,
  FunctionID.FID_AWNING_ACTUATOR,
];
