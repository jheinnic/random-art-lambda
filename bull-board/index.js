const express = require('express');
const { Queue } = require('bullmq');
const { createBullBoard } = require('@bull-board/api');
const { ExpressAdapter } = require('@bull-board/express');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');

const app = express();

// 1. Instantiate your BullMQ queues (must use the same name and connection as your workers)
const paintQueue = new Queue('paintParts', { connection: { host: 'localhost', port: 6379 } });
const resultsQueue = new Queue('gatherTasks', { connection: { host: 'localhost', port: 6379 } });
const stagedQueue = new Queue('gatherParts', { connection: { host: 'localhost', port: 6379 } });

// 2. Create the server adapter and set its base path
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues'); // This is the URL where your dashboard will live

// 3. Create the Bull Board instance, passing your queues and the adapter
createBullBoard({
    queues: [
        new BullMQAdapter(paintQueue),
        new BullMQAdapter(resultsQueue),
        new BullMQAdapter(stagedQueue),
    ],
    serverAdapter: serverAdapter,
});

// 4. Mount the Bull Board router to your Express app
app.use('/admin/queues', serverAdapter.getRouter());

// 5. Start your server
app.listen(4000, () => {
    console.log('Bull Board accessible at: http://localhost:4000/admin/queues');
});
