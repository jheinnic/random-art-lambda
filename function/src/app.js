/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

// 1. Receive event from API Gateway REST API.
// 2. Log event to CloudWatch Logs.
// 3. Return a response with basic event information to the caller.
canvas = require('canvas');

exports.handler = async(event) => {
    try {
        // Log event object to CloudWatch Logs
        console.log("Event: ", JSON.stringify(event, null, 2));

        // Parse event body
        var jbody = { 'empty': true, firstName: 'first', lastName: 'last' };
        if (!!event.body) {
            jbody = JSON.parse(event.body);
        }

        // Create event object to return to caller
        const queryParams = (!!event.queryStringParameters) ? event.queryStringParameters : { myQueryString: '<no query string>' };
        const headers = (!!event.headers) ? event.headers : { myheader: '<no header string>' };
        const respObj = {
            queryString: queryParams.myQueryString,
            header: headers.myheader,
            message: `Hello ${jbody.firstName} ${jbody.lastName}, from AWS Lambda!`,
            hasCanvas: !!canvas
        };

        // Send response to caller
        const response = {
            statusCode: 200,
            body: JSON.stringify(respObj, null, 2),
        };
        return response;
    } catch (error) {
        console.error(error);
        throw new Error(error);
    }
};