# homebridge-freeathome-local-api

A Homebridge plugin that allows the user to control BUSCH-JAEGER free@home devices using the System Access Point local API.

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
![CI](https://img.shields.io/github/workflow/status/pgerke/homebridge-freeathome-local-api/Continuous%20Integration?style=flat-square)
[![codecov](https://codecov.io/gh/pgerke/homebridge-freeathome-local-api/branch/main/graph/badge.svg?token=V5ICB2MGH0)](https://codecov.io/gh/pgerke/homebridge-freeathome-local-api)
![Dependencies](https://img.shields.io/librariesio/release/npm/homebridge-freeathome-local-api?style=flat-square)
![npm](https://img.shields.io/npm/v/homebridge-freeathome-local-api?style=flat-square)
![License](https://img.shields.io/github/license/pgerke/homebridge-freeathome-local-api?style=flat-square)

## Features

- Control your BUSCH-JAEGER free@home lights, outlets, heating regulators and more with your Apple devices
- Ask Siri to control your devices and set automations with Apple Home
- Based on the local API provided by the System Access Point running firmware version >2.6.0
- 100% covered by automated unit tests

## Supported accessories

I'll add further accessories over time, but feel free to request your favorite accessory type in a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues).

### Official Support

The accessories listed below are well tested with automated unit tests as well as functional and stability tests on real hardware. To the best of my knowledge the accessories are behaving as they should be.

- Switch actuators: Binary switches, outlets, simple (on/off) lights
- Dimmable Lights
- Thermostats
- Door Openers
- The automatic door opener (which will be displayed as a switch)
- (Video) Door Bells

### Experimental Support

Some more accessories are supported experimentally. The experimental accessories are implemented according to the BUSCH-JAEGER specification and fully unit tested, but I don't own the hardware, so I cannot perform in-situ tests for functionality, user experience and stability. If you own one or more of the devices listed below and want to help me support those accessories, please create a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues) or reach out to me via [email](mailto:info@philipgerke.com).

- Smoke Detector
- Motion Sensors
- Blinds Actuators
- Shutter Actuators
- Awning Actuators
- Attic Window Actuators

## Ignoring devices and channels

If you don't want to create an accessory for a specific channel, you can add the channel to the ignore list in the settings UI or the `config.json`. This is useful, if you have supported devices you don't want to expose to Apple Home or you have devices that are not usable even though they are configured. A real-world example are unused door openers provided by the Welcome Panel. A request to trigger an unused door opener will always fail with an error, so you can ignore the unused openers, to keep your Apple Home neat and avoid confusion.

The format for an ignored channel is `{DeviceSerial}/{Channel}`. For example: To ignore channel `ch0010` of the device with the serial `ABB700123456`, add `ABB700123456/ch0010` to the ignored channel list. To ignore all channels of a device use an asterisk for the channel part. For example, add `ABB700123456/*` to the ignored channel list to exclude all channels provided by the device with the serial `ABB700123456`.

A sample configuration section for the plugin with ignored channels might look like this:

```json
{
  "name": "My free@home Setup",
  "host": "sysap.home.net",
  "user": "12345678-9ACB-DEF0-1234-56789ABCDEF0",
  "password": "s3cre3tP4ssw0rt",
  "tlsEnabled": false,
  "verboseErrors": false,
  "experimental": false,
  "ignoredChannels": ["ABB700123456/ch0010", "ABB700123457/*"],
  "platform": "FreeAtHomeLocalApi"
}
```

## Requirements

- free@home Access Point running firmware version >2.6.0
- Access to an user account that has access to the local API

## Changelog

The changelog can be viewed [here](CHANGELOG.md).

## I found a bug, what do I do?

I'm happy to hear any feedback regarding the plugin or it's implementation, be it critizism, praise or rants. Please create a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues) or drop me an [email](mailto:info@philipgerke.com) if you would like to contact me.

I would especially appreciate, if you could report any issues you encounter while using the library. Issues I know about, I can probably fix.

If you want to submit a bug report, please check if the issue you have has already been reported. If you want to contribute additional information to the issue, please add it to the existing issue instead of creating another one. Duplicate issues will take time from bugfixing and thus delay a fix.

While creating a bug report, please make it easy for me to fix it by giving us all the details you have about the issue. Always include the version of the library and a short concise description of the issue. Besides that, there are a few other pieces of information that help tracking down bugs:

- The system environment in which the issue occurred (e.g. node version)
- Some steps to reproduce the issue, e.g. a code snippet
- The expected behaviour and how the failed failed to meet that expectation
- Anything else you think I might need

## I have a feature request, what do I do?

Please create a [GitHub issue](https://github.com/pgerke/homebridge-freeathome-local-api/issues) or drop me an [email](mailto:info@philipgerke.com)!

## Non-Affiliation Disclaimer

This plugin is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Busch-Jaeger Elektro GmbH or ABB Asea Brown Boveri Ltd or . All product and company names are the registered trademarks of their original owners. The use of any trade name or trademark is for identification and reference purposes only and does not imply any association with the trademark holder of their product brand.

## License

The project is subject to the MIT license unless otherwise noted. A copy can be found in the root directory of the project [LICENSE](./LICENSE).

<hr>

Made with ❤️ by [Philip Gerke](https://github.com/pgerke)
