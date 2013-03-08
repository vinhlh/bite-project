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

"""Stream object which can be used to copy messages to multiple streams.

  split_stream = SplitStream(sys.stdout, file1, file2)
  logging.basicConfig(format=FORMAT, level=logging.DEBUG, stream=split_stream)
  logging.info('foo')

  'foo' ====> sys.stdout
        \===> file1
        \===> file2

  split_stream.SetStreams(sys.stdout, file1, file3)

  'bar' ====> sys.stdout
        \===> file1
        \===> file3

  logging.shutdown()
  file1.close()
  file2.close()
  file3.close()

  sys.stdout: 'foo\nbar'
  file1: 'foo\nbar'
  file2: 'foo'
  file3: 'bar'
"""

__author__ = 'Jeff Carollo (jeff.carollo@gmail.com)'

import logging
import sys


class SplitStream(object):
  """Dynamically copies data to multiple streams.

  Caller is responsible for serializing all calls to a SplitStream instance.
  """
  def __init__(self, *streams):
    self.streams_ = [stream for stream in streams]

  def write(self, s):
    [stream.write(s) for stream in self.streams_]

  def flush(self):
    [stream.flush() for stream in self.streams_]

  def SetStreams(self, *streams):
    self.flush()
    self.streams_ = [stream for stream in streams]

  def AddStream(self, stream):
    self.flush()
    self.streams_.append(stream)

  def RemoveStream(self, stream):
    self.flush()
    try:
      self.streams_.remove(stream)
    except Exception, e:
      sys.stderr.write('exception: %s' % str(e))


def main(unused_argv):
  """For testing purposes only."""
  FORMAT = '%(asctime)-15s %(message)s'
  stream1 = sys.stdout
  stream2 = file('stream2.log', 'w+')

  split_stream = SplitStream(stream1, stream2)
  logging.basicConfig(format=FORMAT, level=logging.DEBUG, stream=split_stream)

  logging.info('1')
  logging.info('2')
  logging.info('3')

  stream3 = file('stream3.log', 'a+')
  split_stream.SetStreams(stream1, stream3)
  stream2.close()

  logging.info('4')
  logging.info('5')
  logging.info('6')

  stream4 = file('stream4.log', 'w')
  split_stream.AddStream(stream4)
  logging.info('7')
  split_stream.RemoveStream(stream3)
  stream3.close()

  logging.info('8')
  logging.info('9')

  logging.shutdown()
  split_stream.flush()
  stream4.close()


if __name__ == '__main__':
  main(sys.argv)
