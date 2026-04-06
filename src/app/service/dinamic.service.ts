import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PoDynamicFormContainerService {
  getFilial(filail: string) {
    switch (filail) {
      case '01010101': {
        return [
        { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
        { cliente: 'Arotubi Sistemas', code: '030101/000133/0001' },
           { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
        ];
      }
      case '01020101': {
        return [
        { cliente: 'Arotubi Metais', code: '010101/000007/0001' },
        { cliente: 'Arotubi Sistemas', code: '030101/000133/0001' },
           { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
        ];
      }
     case '01030101': {
        return [
        { cliente: 'Arotubi Metais', code: '010101/000007/0001' },
        { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
           { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
      
        ];
      }
    }
     return [
        { cliente: 'Arotubi Metais', code: '010101/000007/0001' },
        { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
        { cliente: 'Arotubi Componentes', code: '020101/000008/0001' },
      
        ];
  }
}