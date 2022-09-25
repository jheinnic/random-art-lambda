import { Injectable } from "@nestjs/common";
import { Observable, Subject } from "rxjs";
import { filter, map } from "rxjs";
import { Message } from "../interface/Message";

export interface IMessageService {
    publish<T extends Object>(message: T): void;

    of<T extends any>(messageType: { new(...args: any[]): T }): Observable<T>;
}