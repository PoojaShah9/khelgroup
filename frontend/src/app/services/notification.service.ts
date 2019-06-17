import {Injectable} from '@angular/core';

declare var $: any;

@Injectable({
    providedIn: 'root'
})

export class NotificationService {

    showNotification(message, type) {

        $.notify({
            message: message
        }, {
            type: type,
            timer: 3000,
            placement: {
                from: 'top',
                align: 'right'
            }
        });
    }
}
