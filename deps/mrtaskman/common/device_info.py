#!/usr/bin/python
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Provides info about an attached device depending on environment variables.

Expects that DEVICE_SN will be set in process environment.
"""

__author__ = 'jeff.carollo@gmail.com (Jeff Carollo)'

import json
import logging
import os
import sys


DEVICE_INFO = {
    '''
    # Jeff's Phone.
    '35326BF6F6C300EC': {
        'device_type': 'phone',
        'device_name': 'Google Nexus S',
        'os_name': 'android',
        'os_version': '4.0.2',
        'cell_number': '9795741534',
        'provider': 'T-Mobile',
        'hub': 'leonardo',
        'hub_port': '*'
    },
    '''
    'SH0CJLV00997': {
        'device_type': 'phone',
        'device_name': 'T-Mobile MyTouch 3G',
        'os_name': 'android',
        'os_version': '1.6',
        'provider': 'T-Mobile',
        'hub': '02',
        'hub_port': 'D'
    },
    '3233A90D16A800EC': {
        'device_type': 'phone',
        'device_name': 'Google Nexus S',
        'os_name': 'android',
        'os_version': '2.3.6',
        'provider': 'T-Mobile',
        'hub': '02',
        'hub_port': 'C'
    },
    '328C000600000001': {
        'device_type': 'tablet',
        'device_name': 'Amazon Kindle Fire',
        'os_name': 'android',
        'os_version': '2.3',
        'hub': '01',
        'hub_port': 'G'
    },
    '902a6d03': {
        'device_type': 'tablet',
        'device_name': 'Samsung Galaxy Tab 8.9',
        'os_name': 'android',
        'os_version': '3.2',
        'provider': 'AT&T',
        'hub': '02',
        'hub_port': 'B'
    },
    'LGOTMSae4105e': {
        'device_type': 'phone',
        'device_name': 'LG Nitro HD',
        'os_name': 'android',
        'os_version': '2.3.5',
        'cell_number': '7744208329',
        'provider': 'AT&T',
        'hub': '02',
        'hub_port': 'A'
    },
    '0146A14C1001800C': {
        'device_type': 'phone',
        'device_name': 'Galaxy Nexus',
        'os_name': 'android',
        'os_version': '4.0.2',
        'cell_number': '4255771762',
        'provider': 'Verizon Wireless',
        'hub': '01',
        'hub_port': 'D'
    },
    'HT16RS015741': {
        'device_type': 'phone',
        'device_name': 'HTC Thunderbolt',
        'os_name': 'android',
        'os_version': '2.3.4',
        'cell_number': '4258908379',
        'provider': 'Verizon Wireless',
        'hub': '01',
        'hub_port': 'B'
    },
    'TA08200CI0': {
        'device_type': 'phone',
        'device_name': 'Motorola Droid X2',
        'os_name': 'android',
        'os_version': '2.3.4',
        'cell_number': '4258909336',
        'provider': 'Verizon Wireless',
        'hub': '01',
        'hub_port': 'A'
    },
    '4342354131485A483144': {
        'device_type': 'phone',
        'device_name': 'Sony Ericson Xperia PLAY 4G',
        'os_name': 'android',
        'os_version': '2.3.3',
        'cell_number': '7744208420',
        'provider': 'AT&T',
        'hub': '01',
        'hub_port': 'E'
    },
    '388920443A07097': {
        'device_type': 'tablet',
        'device_name': 'Samsung Galaxy Tab',
        'os_name': 'android',
        'os_version': '3.2',
        'provider': 'Verizon Wireless',
        'hub': '01',
        'hub_port': 'C'
    },
    '304D191A2004639E': {
        'device_type': 'phone',
        'device_name': 'Samsung Galaxy S II',
        'os_name': 'android',
        'os_version': '2.3.4',
        'cell_number': 'unknown',
        'provider': 'AT&T',
        'hub': '01',
        'hub_port': 'F'
    }
}

# Shouldn't change for the life of this process.
DEVICE_SN = os.environ.get('DEVICE_SN', None)


def GetDeviceSerialNumber():
  """Returns the serial number of the device assigned to the current worker.

  Pulls from environment variables.

  Returns:
    Serial number as str, or None.
  """
  return DEVICE_SN


def GetDeviceInfo(device_sn=DEVICE_SN):
  """Retrieves device info from given device serial number."""
  return DEVICE_INFO.get(device_sn, None)


def AppendIf(l, value):
  """Appends to a list if value evaluates to a boolean."""
  if value:
    l.append(value)


def GetCapabilities():
  """Returns a list of capabilities of device from environment or None."""
  capabilities = []
  if DEVICE_SN:
    capabilities.append(DEVICE_SN)
    device_info = GetDeviceInfo()
    if device_info:
      AppendIf(capabilities, device_info.get('device_name', None))
      AppendIf(capabilities, device_info.get('device_type', None))
      AppendIf(capabilities, device_info.get('os_name', None))
      AppendIf(capabilities, device_info.get('os_version', None))
      AppendIf(capabilities, device_info.get('provider', None))
  return capabilities


try:
  import subprocess


  def AdbDevices():
    """Returns the devices recognized by adb as a list of str."""

    devices = []
    command = ('adb devices 2>&1 | grep "device$" | '
               'sed "s/\([a-zA-Z0-9]\)*\s*device/\1/g"')
    try:
      output = subprocess.check_output(command, shell=True)
    except subprocess.CalledProcessError, e:
      logging.error('Unable to invoke adb.')
      logging.exception(e)
      return devices
    except OSError, e:
      logging.error('Unable to invoke adb.')
      logging.exception(e)
      return devices

    lines = output.split('\n')
    for line in lines:
      line = line.strip()
      index = line.find('\t\x01')
      if index >= 0 and index < len(line):
        line = line[0:index]
      if line:
        devices.append(line)
    return devices

  def DeviceIsConnected(device_sn=DEVICE_SN):
    devices = AdbDevices()
    return device_sn in devices
except ImportError:
  # Allow AppEngine clients to ignore this.
  def AdbDevices():
    """Not defined for AppEngine."""
    return []


def main(argv):
  device_ids = sys.stdin.read().split('\n')
  for device_id in device_ids:
    if device_id:
      print '"%s": %s' % (device_id,
                          json.dumps(GetDeviceInfo(device_id), indent=2))


if __name__ == '__main__':
  main(sys.argv)
