import {PBufPlotModelProvider} from "./plotting/protobuf/PBufPlotModelProvider";
import {RandomArtPainter} from "./painting/components/RandomArtPainter";
import { FileTransport } from "./common/components/FileTransport";
import * as genjs6 from './painting/components/genjs6';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { writeSync, createWriteStream } from 'fs';

async function run() {
    const plotterOne = await new PBufPlotModelProvider(
        new FileTransport()
    ).provide('./fdoc.proto');
    const plotterTwo = await new PBufPlotModelProvider(
        new FileTransport()
    ).provide('./gdoc.proto');
    
    for(let ii=0; ii<10; ii++) {
        let prefixSize = 3 + crypto.randomInt(29);
        let suffixSize = 3 + crypto.randomInt(29);
        let prefixBytes = crypto.randomBytes(prefixSize);
        let suffixBytes = crypto.randomBytes(suffixSize);
        let prefixStr = prefixBytes.toString('base64');
        let suffixStr = suffixBytes.toString('base64');
        let prefix = [...prefixBytes];
        let suffix = [...suffixBytes];
        let filename = `${prefixStr}-${suffixStr}`;
        let nextFilename = filename.replace('/', '_');
        while (filename !== nextFilename) {
            filename = nextFilename;
            nextFilename = filename.replace('/', '_');
        }
        filename = `testrun/${filename}`;
        let sidecar = { "ints": [ prefix, suffix ], "bytes": [ prefixBytes.toString('hex'), suffixBytes.toString('hex')], "base64": [prefixStr, suffixStr], "sizes": [prefixSize, suffixSize], "min": [Math.min(...prefix), Math.min(...suffix)], "max": [Math.max(...prefix), Math.max(...suffix)] };
        fs.writeFileSync(`testrun03/${filename}.json`, JSON.stringify(sidecar) );

        const painterOne =new RandomArtPainter(
            genjs6.new_picture(prefix, suffix),
            plotterOne,
            createWriteStream(`testrun03/writerOne/${filename}.png`) 
        );
        painterOne.paint().writeCallbacks(`testrun03/writerOne/${filename}.png`);
        
        const painterTwo =new RandomArtPainter(
            genjs6.new_picture(prefix, suffix),
            plotterTwo,
            createWriteStream(`testrun03/writerTwo/${filename}.png`) 
        );
        painterTwo.paint().writeCallbacks(`testrun03/writerTwo/${filename}.png`);
    }
}

run().catch((err) => { console.log(err); });