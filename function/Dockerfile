FROM node:20.19.3-slim

RUN apt update && apt -q -y install sysstat procps
RUN apt install -y -q build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev 

WORKDIR /opt

COPY build /opt/build
COPY plot_maps /opt/plot_maps
COPY source5B.list /opt/source5B.list
COPY package.json /opt/package.json
COPY yarn.lock /opt/yarn.lock
COPY tsconfig.json /opt/tsconfig.json
COPY .eslintrc.yml /opt/.eslintrc.yml

RUN ln -s plot_maps/fdoc-025_075-n075_n025-512_512.proto fdoc2.proto && \
ln -s plot_maps/fdoc.proto fdoc_big.proto && \
ln -s plot_maps/fdoc.proto fdoc.proto && \
ln -s plot_maps/gdoc-025_075-n075_n025-512_512.proto gdoc2.proto && \
ln -s plot_maps/hdoc-025_075-n075_n025-512_512.proto hdoc2.proto && \
ln -s plot_maps/qdoc-10_10_1024-10_10_1024.proto qdoc2.proto && \
ln -s plot_maps/qdoc-040_060_640-n060_n040_640.proto qdoc4.proto && \
ln -s plot_maps/qdoc-04985_05015_640-n05015_n04985_640.proto qdoc5.proto && \
ln -s plot_maps/qdoc-025_175_640-n175_n025_640.proto qdoc6.proto && \
ln -s plot_maps/rdoc-n10_n05_1024-05_10_1024.proto rdoc03.proto && \
ln -s plot_maps/rdoc-n085_n055_1024-n085_n055_1024.proto rdoc2.proto && \
ln -s plot_maps/rdoc-10_10_1024-10_10_1024.proto rdoc.proto && \
echo "Linked Plots" && mkdir rdoc03 rdoc rdoc2 qdoc6 qdoc5 qdoc4 qdoc2 hdoc2 gdoc2 fdoc fdoc_big fdoc2

RUN yarn install 
COPY src /opt/src
RUN yarn run build

# COPY node_modules /opt/node_modules/

CMD [ "pidstat", "-rus", "1", "-e", "node", "./build/src/app/components/Main.js" ]
