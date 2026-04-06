import { Component, HostListener, OnDestroy } from '@angular/core';
import { ChatService } from './service/chat.service';
import { Subscription, fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PoTabsModule,  PoModalComponent, PoTableColumn } from '@po-ui/ng-components';
import { Router } from '@angular/router';

import { iMessage } from './interface/interface-msg';


@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})


export class ChatComponent {
  messageList: iMessage[] = [];
  private messageSubscription: Subscription;
  private unsubscribe$ = new Subject<void>(); // Usaremos para liberar recursos

 

  constructor(private chatService: ChatService, private router: Router) {

    if (!this.chatService.isConnected()) {
      this.chatService.connect()
    }

    this.messageSubscription = this.chatService.getNewMessage().subscribe((message) => {
      console.log(message)
      this.messageList.push(message);
    });

  }

  ngOnInit() {
  }


  ngOnDestroy() {
    this.chatService.disconnectSocket(); // Chame o método que desconecta o socket no serviço
    this.messageList = [];
    // Cancelar a assinatura no ngOnDestroy para liberar recursos quando o componente é destruído
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  sendMessage() {

  }
}