export interface TypeMapping {
  channel: string;
  type: keyof typeof AccessoryType;
}

/** The enumeration defining the supported accessory types  */
export enum AccessoryType {
  /** The undefined type. This is the default value. */
  Undefined = 0,
  /** An outlet */
  Outlet,
}
