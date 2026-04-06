import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io ,Socket } from "socket.io-client";
import { iMessage } from '../interface/interface-msg';


@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private socket!: Socket;
  private readonly serverUrl = 'http://localhost:5000'; // Coloque a URL do servidor WebSocket

  constructor() {
    //this.connect();
  }

  public connect(): void {
    this.socket = io(this.serverUrl);
  }
  public disconnectSocket(): void {
    // Emita a ação para desconectar o socket no servidor
    this.socket.emit('disconnect_request');
    // Desconecte o socket local
    this.socket.disconnect();
  }

  public sendMessage(message: any) {
    console.log('sendMessage: ', message)
    this.socket.emit('message', message);
  }

  public isConnected(): boolean {
    return this.socket && this.socket.connected;
  }

  public getNewMessage(): Observable<iMessage> {

    return new Observable<iMessage>(observer => {
      this.socket.on('my_response', (message: iMessage) => {
        observer.next(message);
      });
    });
  }

}
