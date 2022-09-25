export interface Message<Body = any, Headers = any> { 
    id?: string;
    headers?: Headers;
    channel: string;
    data: Body;
}