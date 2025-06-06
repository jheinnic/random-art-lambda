// import { TupleOfLength } from "@jchptf/tupletypes"
export class AbstractRegionMap {
    oldDirector(plotter) {
        const xMax = this.pixelWidth;
        const yMax = this.pixelHeight;
        const xCols = this.columnOrderedXCoordinates;
        const yCols = this.columnOrderedYCoordinates;
        if (this.isUniform) {
            let nextX = -1;
            while (++nextX < xMax) {
                let nextY = -1;
                while (++nextY < yMax) {
                    plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY]);
                }
            }
        }
        else {
            let ii = 0;
            let nextX = -1;
            while (++nextX < xMax) {
                let nextY = -1;
                while (++nextY < yMax) {
                    // console.log(nextX, nextY, xCols[ii], yCols[ii])
                    plotter.plot(nextX, nextY, xCols[ii], yCols[ii++]);
                }
            }
        }
        // plotter.finish()
    }
    director(plotter) {
        if (this.isUniform) {
            this.directUniform(plotter);
        }
        else {
            this.directVariable(plotter);
        }
    }
    directUniform(plotter) {
        const xMax = this.pixelWidth;
        const yMax = this.pixelHeight;
        const xCols = this.columnOrderedXCoordinates;
        const yCols = this.columnOrderedYCoordinates;
        function loopForX(nextX) {
            let nextY = -1;
            while (++nextY < yMax) {
                plotter.plot(nextX, nextY, xCols[nextX], yCols[nextY]);
            }
            if (++nextX < xMax) {
                setTimeout(loopForX, 0, nextX);
            }
            else {
                console.log("Done looping");
                // plotter.finish()
            }
        }
        loopForX(0);
    }
    directVariable(plotter) {
        const xMax = this.pixelWidth;
        const yMax = this.pixelHeight;
        const xCols = this.columnOrderedXCoordinates;
        const yCols = this.columnOrderedYCoordinates;
        function loopForXI(nextX, ii) {
            let nextY = -1;
            while (++nextY < yMax) {
                plotter.plot(nextX, nextY, xCols[ii], yCols[ii++]);
            }
            if (++nextX < xMax) {
                setTimeout(loopForXI, 0, nextX, ii);
            }
            else {
                console.log("Done looping");
                // plotter.finish()
            }
        }
        loopForXI(0, 0);
    }
}
//# sourceMappingURL=AbstractRegionMap.js.map