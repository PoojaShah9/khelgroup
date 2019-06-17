import {Component, OnInit} from '@angular/core';
import {UserService} from '../services/user.service';
import {NotificationService} from '../services/notification.service';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

    user: any = {};

    constructor(private userService: UserService,
                private notificationService: NotificationService) {
    }

    ngOnInit() {
    }

    userLogin() {
        this.userService.login(this.user)
            .subscribe((response) => {
                if (!response.error) {
                    localStorage.setItem('token', response.data.authToken);
                    this.notificationService.showNotification(response.message, 'success');
                } else {
                    this.notificationService.showNotification(response.message, 'danger');
                }
            });
    }
}
