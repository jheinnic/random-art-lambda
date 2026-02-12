import {Canvas, CanvasRenderingContext2D} from 'canvas';
import {GenModel, new_new_picture, new_picture, compute_pixel} from './genjs6.js';
import {PointPlotDocument, PointPlotData, ImageSize} from './plotting/protobuf/plot_mapping_pb.js.js';
import * as fs from 'fs';

interface ModelSeed {
    prefixBits: Buffer | number[];
    suffixBits: Buffer | number[];
    novel: boolean;
}


export class ModelPlotter {
    private plotDocument?: PointPlotDocument;
    private width?: number;
    private height?: number;
    private rows?: number[];
    private cols?: number[];

    public constructor(private readonly plotSource: string) {
    }

    public async open() {
        const self = this;
        return new Promise( (resolve, reject) => {
            const callback = (error: any, data: Buffer) => {
                if (error) {
                    reject(error);
                } else {
                    self.receiveProtoBuf(data);
                    resolve(this.plotDocument);
                }
            };
            fs.readFile(this.plotSource, callback);
        });
    }

    private receiveProtoBuf(data: Buffer): void {
        this.plotDocument = PointPlotDocument.deserializeBinary(data);

        const plotData: PointPlotData = this.plotDocument.getData()!;
        this.rows = plotData.getRowsList();
        this.cols = plotData.getColumnsList();

        const resolution: ImageSize = plotData.getResolution()!;
        this.width = resolution.getPixelwidth();
        this.height = resolution.getPixelheight();
    }

    private getGenModel(modelSeed: ModelSeed): GenModel {
        const prefix = [...modelSeed.prefixBits];
        const suffix = [...modelSeed.suffixBits];

        if (modelSeed.novel) {
            // @ts-ignore
            return new_new_picture(prefix, suffix);
        }

        // @ts-ignore
        return new_picture(prefix, suffix);
    }

    public paint(modelSeed: ModelSeed): CanvasWriter { 
        if (this.plotDocument == null) {
	    throw new Error("Must call open() first");
	}
        const genModel: GenModel = this.getGenModel(modelSeed);

        let canvas: Canvas = new Canvas(this.width!, this.height!);
        let context: CanvasRenderingContext2D = canvas.getContext('2d')!;
        if (context === null) {
            throw new Error('Canvas failed to return a 2D context object?');
        } 

        let pixelIndex: number = -1;
        let yIndex: number = 0;
        let xIndex: number = 0;
        try {
            for (xIndex = 0; xIndex < this.width!; xIndex++) {
                for (yIndex = 0; yIndex< this.height!; yIndex++) {
                    pixelIndex += 1;
            
                    context.fillStyle = compute_pixel(genModel, this.rows![pixelIndex], this.cols![pixelIndex]);
                    context.fillRect(xIndex, yIndex, 1, 1);
                }
           }
       } catch (err) {
           console.log(err);
           throw err;
       }

       return new CanvasWriter(canvas);
    }
}

export class CanvasWriter {
    public constructor(private readonly canvas: Canvas) { }

    public writeCallbacks(outputPath: string): unknown {
        console.log(`Entered stream writer for ${outputPath}`);

        const out = fs.createWriteStream(outputPath);
        const stream = this.canvas.createPNGStream();

        out.on('end', () => {
            console.log(`Saved png of ${out.bytesWritten} bytes to ${outputPath}`);
        });

        stream.on('error', (err: any) => {
            console.error('Brap!', err);
            
            out.close();
        });

        return stream.pipe(out);
    }

    public async writeAsyncOne(outputPath: string) {
        await this.writeCallbacks(outputPath);
    }

    public writeSync(outputPath: string) {
        const fd = fs.openSync(outputPath, 'w');
        // @ts-ignore
        this.canvas.streamPNGSync((err: any, buf: readonly Buffer) => {
            if (err) {
                console.error("PNG Stream callback received an error!");
                console.error(err);
                throw err;
            }
            fs.writeSync(fd, buf);
        });
    }
}

// let ii: any;
// const data: number[] = new Array(10);
// data.fill(64028);
// for (ii in data) {
//     data[ii] = data[ii] + ii;
// }
// const data2: number[] = [...data];
// data2.reverse();
// 
// const plotter = new ModelPlotter('./fdoc.proto');
// plotter.open().then( (document) => {
//     console.log(document);
//     const writer = plotter.paint( {prefixBits: data2, suffixBits: data, novel: false} );
//     writer.writeSync("test.png");
// }).catch( (err) => { console.log(err); });
// 
