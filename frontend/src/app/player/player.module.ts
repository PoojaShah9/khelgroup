import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {BasicComponent} from './basic/basic.component';
import {PlayerRoutes} from './player.routing';
import {RouterModule} from '@angular/router';
import {NgxDatatableModule} from '@swimlane/ngx-datatable';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
// import {BrowserAnimationsModule} from '@angular/platform-browser/animations';


@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(PlayerRoutes),
        FormsModule,
        NgxDatatableModule,
        NgbModule.forRoot(),
        // BrowserAnimationsModule, // required animations module
        // ToastrModule added
    ],
    declarations: [BasicComponent]
})
export class PlayerModule {
}
