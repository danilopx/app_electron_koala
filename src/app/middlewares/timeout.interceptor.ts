import { Injectable, Inject, InjectionToken } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
  HttpRequest,
  HttpHandler
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';

// InjectionToken for the default timeout value
export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');

/**
 * TimeoutInterceptor is an Angular middleware that logs HTTP requests and generates a timeout error if a request takes too long.
 * It implements the HttpInterceptor interfaces.
 *
 * @Injectable() decorator is used to mark it as a service that can be injected into other Angular components.
 */
@Injectable()
export class TimeoutInterceptor implements HttpInterceptor {

  /**
   * Constructor for the TimeoutInterceptor class.
   *
   * @param {number} defaultTimeout - The default timeout value for HTTP requests.
   */
  constructor(@Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number) {
  }

  /**
   * The intercept method is a required method for any class implementing the HttpInterceptor interfaces.
   * It intercepts outgoing HTTP requests, adds logging, and implements a simple timer functionality.
   *
   * @param {HttpRequest<any>} request - The outgoing HTTP request.
   * @param {HttpHandler} next - The HTTP request handler.
   * @returns {Observable<HttpEvent<any>>} - An Observable of the HTTP event.
   */
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    /**
     * This block of code creates a simulated error response that matches the format expected by the PO-UI HttpInterceptor.
     * The error is an instance of HttpErrorResponse, which is a class in Angular's HttpClient module.
     * This class models HTTP responses as error events.
     *
     * This simulated error is used when the interceptor detects a timeout error.
     * It is thrown as an error event, which can be caught and handled by the application.
     *
     * @see {@link https://po-ui.io/documentation/po-http-interceptor} for more information about the expected error format.
     */
    const simulatedError = new HttpErrorResponse({
      status: 503,
      statusText: 'Unreachable API',
      error: {
        code: "503",
        message: "API Indisponível Por favor, abra um chamado no Service Desk",
        detailTitle: "Servidor da API Indisponivel.",
        detailedMessage: "O Servidor responsável por entrar no sistema não está conectado. Favor abrir chamado na TI.",
        type: "error",
        helpUrl: "https://suporte.simplifysolucoes.com.br/",
        details: [{
          code: "503",
          message: "Inalcançavel",
          detailedMessage: "Esse erro ocorre quando existe uma falha de conexão com o servidor.",
          type: "error"
        }]
      }
    });

    /**
     * This function returns the current timestamp in ISO 8601 format, replacing 'T' with a space and removing 'Z'.
     * This format is commonly used for logging.
     *
     * @returns {string} - The current timestamp in ISO 8601 format.
     */
    return next.handle(request).pipe(
      timeout(this.defaultTimeout),
      catchError((err) => {
        if (err?.name === 'TimeoutError') {
          return throwError(() => simulatedError);
        }
        return throwError(() => err);
      })
    );

  }

}
