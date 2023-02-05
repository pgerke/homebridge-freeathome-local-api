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
  /** A binary door or window sensor */
  FID_WINDOW_DOOR_SENSOR = "F",
  /** A door or window sensor that also reports the door or window position */
  FID_WINDOW_DOOR_POSITION_SENSOR = "64",
  /** A (binary) switch sensor */
  FID_SWITCH_SENSOR = "0",
  /** A dimming sensor */
  FID_DIMMING_SENSOR = "1",
  /** A scene */
  FID_SCENE = "4800",
  /** A scene sensor */
  FID_SCENE_SENSOR = "6",
  /** A staircase light sensor */
  FID_STAIRCASE_LIGHT_SENSOR = "4",
  /** A generic trigger */
  FID_TRIGGER = "45",
  /** A brightness sensor */
  FID_BRIGHTNESS_SENSOR = "41",
  /** A temperature sensor */
  FID_TEMPERATURE_SENSOR = "43",
}

/** Contains the list of function IDs that are only experimentally supported by the plugin */
export const experimentallySupportedFunctionIDs: Array<FunctionID> = [
  FunctionID.FID_SHUTTER_ACTUATOR,
  FunctionID.FID_BLIND_ACTUATOR,
  FunctionID.FID_ATTIC_WINDOW_ACTUATOR,
  FunctionID.FID_AWNING_ACTUATOR,
  FunctionID.FID_SCENE_SENSOR,
  FunctionID.FID_STAIRCASE_LIGHT_SENSOR,
  FunctionID.FID_TRIGGER,
  FunctionID.FID_BRIGHTNESS_SENSOR,
  FunctionID.FID_TEMPERATURE_SENSOR,
];
