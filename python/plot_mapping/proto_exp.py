import pulsar
from plot_mapping_pb2 import *

client = pulsar.Client('pulsar://pulsar-broker:6650')

consumer = client.subscribe(
                  topic='random-art/research-lab/canvas-size-events',
                  subscription_name='test-reading02')
                  

while True:
    msg = consumer.receive()
    ex = msg.value()
    try:
        print("Received raw binary message {}".format(ex))
        parsed = CanvasSize.FromString(ex)
        consumer.acknowledge(msg)
        print("Deserialized protobuf messsage: {}".format(parsed))
        # Acknowledge successful processing of the message
    except Exception as err:
        print("Error: {}".format(err))
        # Message failed to be processed
        consumer.negative_acknowledge(msg)
