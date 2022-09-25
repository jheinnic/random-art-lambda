import logging
from kazoo.client import KazooClient
from kazoo.recipe.party import *

logging.basicConfig()

tt = '01EQWGKT1S68Y9YM5TV34RQVQA'
zk = KazooClient(hosts='127.0.0.1:2181')
zk.start()

sp01 = Party(zk, "/jchptf/labapp/party002", "ab210e7c2a")
sp02 = Party(zk, "/jchptf/labapp/party002", "ba12e0c7a2")
sp03 = Party(zk, "/jchptf/labapp/party002", "2a7c0e21ab")
sp04 = Party(zk, "/jchptf/labapp/party002", "ab210e7c2a")

sp01.join()
sp02.join()
sp03.join()
sp04.join()
