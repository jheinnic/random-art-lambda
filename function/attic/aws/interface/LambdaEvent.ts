export type LambdaSQSEvent = {
    Records: Array<LambdaSQSEventRecord>;
};

export type LambdaSQSEventRecord = {
    messageId: string;
    receiptHandle: string;
    body: string;
    attributes: SQSFifoRecordAttributes|SQSStandardRecordAttributes;
    messageAttributes: {
        [K in string]: string
    };
    md5OfBody: string;
    eventSource: "aws:sqs";
    eventSourceARN: string;
    awsRegion: string;
};

export type SQSMessageAttributes<K extends string> = {
    [Key in K]?: string;
}

export type SQSFifoRecordAttributes = {
    ApproximateReceiveCount?: string,
    SentTimestamp?: string;
    SenderId?: string;
    ApproximateFirstReceiveTimestamp?: string;
};

export type SQSStandardRecordAttributes = {
    ApproximateReceiveCount?: string,
    SentTimestamp?: string;
    SenderId?: string;
    ApproximateFirstReceiveTimestamp?: string;
};