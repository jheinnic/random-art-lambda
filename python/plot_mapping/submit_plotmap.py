from pulsar.schema import *

class VersionId(Record):
    majorVersion = Integer();
    minorVersion = Integer();
    patchVersion = Integer();

class GitBuildId(Record):
    gitTag = String();
    gitRepo = String();
    buildTag = String();

class PixelReference(Enum):
    PIXEL_CENTER = "center";
    PIXEL_EDGE = "edge";
    REGION_SWEEP = "sweep";

class PlotStrategy(Record):
    name = String();
    displayName = String();
    pixelRef = String(); // TODO: PixelReference

class PlotStrategyVersion(Record);
    name = String();
    strategyName = String();
    version = VersionId();
    location = GitBuildId();
    codeIdentifier = String();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();

class RandomArtPainterVersion(Record);
    name = String();
    version = Version();
    location = GitBuildId();
    codeIdentifier = String();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();

class ReleaseVersion(Record);
    name = String();
    gitTag = String();
    gitRepo = String();
    buildTag = String();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();

class RegionOfInterest(Record):
    name = String();
    displayName = String();
    topBorder = Double();
    leftBorder = Double();
    frameWidth = Double();
    serviceRelease = String();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();

class CanvasSize(Record):
    name = String();
    displayName = String();
    pixelHeight = Integer();
    pixelWidth = Integer();
    pixelUnit = Integer();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();
    serviceRelease = String();

class PointMapPlot(Record):
    name = String();
    displayName = String();
}

class AspectMatching(Enum):
    SHAPE_PIXEL = "shape";
    CROP_REGION = "crop";
    EXPAND_REGION = "expand";

class PixelPlotMapSpec(Record):
    regionOfInterest = String();
    canvasSize = String();
    plotStrategy = String();
    aspectMatching = AspectMatching();
    createdAt = Datetime();
    availableAt = Datetime();
    removedAt = Datetime();

class PixelPlotMapData(Record):
    # pixelHeight = Integer();
    # pixelWidth = Integer();
    # pixelScale = Integer();
    lengthPoints = List();
    widthPoints = List();

class ExecutableSelectionStrategy(Record):
    name = String();
    diplayName = String();
    idempotent = Boolean();
    serviceVersion = String();
    parameterizedCall = String();
    runtimeInput = Boolean();

class ExperimentRunProtocol(Record):
    name = String();
    displayName = String();
    sampleSelectStrategy = String();
    pointMapPlotVersion = String();
    c = Boolean();

producer = client.create_producer(
                    topic='info.jchein.services.PointMapPlot-v1',
                    schema=AvroSchema(Example); )

producer.send(Example(a='Hello', b=1);)

Copy


