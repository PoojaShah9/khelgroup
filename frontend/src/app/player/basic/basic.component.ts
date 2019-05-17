import {Component, OnInit, ViewChild} from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {DatatableComponent} from '@swimlane/ngx-datatable';

declare interface TableData {
    headerRow: string[];
    dataRows: string[][];
}

@Component({
    selector: 'app-basic',
    templateUrl: './basic.component.html',
    styleUrls: ['./basic.component.scss']
})
export class BasicComponent implements OnInit {
    @ViewChild(DatatableComponent) myTable: DatatableComponent;
    filterField = [
        {id: 'playerId', name: 'Player Id'},
        {id: 'mobileNumber', name: 'Mobile Number'},
        {id: 'profileName', name: 'Profile Name'},
        {id: 'deviceId', name: 'Device Id'},
        {id: 'status', name: 'Status'}
    ];
    searchValue;
    selectedField;
    rows = [];
    totalSize;
    pageSize;
    currentPage = 0;
    limitOptions = [
        {
            key: '5',
            value: 5
        },
        {
            key: '10',
            value: 10
        },
        {
            key: '20',
            value: 20
        }
    ];

    constructor(private playerService: PlayerService) {
    }

    ngOnInit() {
        this.pageSize = 5;
        this.getdata(1, this.pageSize);
    }

    SearchFilter() {
        const data = {
            field: this.selectedField,
            value: this.searchValue
        }
        this.playerService.setFilter(this.currentPage, this.pageSize, data)
            .subscribe((res) => {
                console.log(res);
                this.rows = res.data.results;
                this.totalSize = res.data.totalRecords;
                // this.pageSize = res.currentRecords;
            })
    }

    getdata(pageNumber, pageSize) {
        this.playerService.getPlayer(pageNumber, pageSize)
            .subscribe((data) => {
                    this.rows = data.data.results;
                    this.totalSize = data.data.totalRecords;
                    console.log('this.rows', this.rows);
                    console.log('this.totalSize', this.totalSize);
                },
                error => {
                    console.log('error1', error);
                });
    }

    onChangeField(event) {
        console.log(event.target.value);
        if (event.target.value === 'reset') {
            this.searchValue = '';
            this.getdata(0, this.pageSize);
        } else {
            this.selectedField = event.target.value;
        }
    }

    onPageSizeChanged(event) {
        this.pageSize = event;
        this.getdata(this.currentPage, this.pageSize);
        console.log(event);
    }

    pageCallback(e) {
        console.log('e', e, this.selectedField);
        if (this.selectedField === undefined) {
            this.getdata(e.offset + 1, e.pageSize);
        } else {
            this.currentPage = e.offset + 1;
            this.SearchFilter();
        }

    }
}
