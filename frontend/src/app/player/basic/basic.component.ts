import {Component, OnInit, ViewChild} from '@angular/core';
import {PlayerService} from '../../services/player.service';
import {DatatableComponent} from '@swimlane/ngx-datatable';
import {ToastrService} from 'ngx-toastr';
import {selector} from 'rxjs-compat/operator/publish';

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
        {id: 'chips', name: 'Chips'},
        {id: 'diamond', name: 'Diamond'},
        {id: 'deviceId', name: 'Device Id'},
        {id: 'status', name: 'Status'}
    ];
    searchValue;
    selectedField;
    rows = [];
    totalSize;
    pageSize;
    currentPage = 0;
    filterData: any = {};
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
    btnDisable = true;

    constructor(private playerService: PlayerService,
                private toastr: ToastrService) {
    }

    ngOnInit() {
        this.pageSize = 5;
        this.currentPage = 0;
        this.getdata(this.currentPage, this.pageSize);
    }

    SearchFilter() {
        this.currentPage = 0;
        this.filterData = {
            field: this.selectedField,
            value: this.searchValue
        };
        this.getfilterData();
    }

    onChangeField(event) {
        console.log(event.target.value);
        if (event.target.value === 'reset') {
            this.searchValue = '';
            this.filterData = {};
            this.selectedField = '';
            this.getdata(0, this.pageSize);
        } else {
            this.selectedField = event.target.value;
        }
    }

    onPageSizeChanged(event) {
        this.currentPage = 0;
        this.pageSize = event;
        if (this.filterData && this.filterData.field) {
            this.getfilterData();
        } else {
            this.getdata(this.currentPage, this.pageSize);
        }
    }

    pageCallback(e) {
        console.log('e', e, this.selectedField);
        if (this.selectedField === undefined || this.selectedField === '') {
            this.getdata(e.offset, e.pageSize);
        } else {
            this.currentPage = e.offset;
            this.getfilterData();
        }
    }

    getdata(pageNumber, pageSize) {
        this.playerService.getPlayer(pageNumber, pageSize)
            .subscribe((data) => {
                    if (data && data.status === 200) {
                        this.rows = data.data.results;
                        this.totalSize = data.data.totalRecords;
                    } else {
                        this.toastr.error(data.message);
                        this.rows = [];
                        this.totalSize = 0;
                    }
                },
                error => {
                    console.log('error1', error);
                    this.toastr.error(error);
                });
    }

    getfilterData() {
        this.playerService.setFilter(this.currentPage, this.pageSize, this.filterData)
            .subscribe((res) => {
                if (res && res.status === 200) {
                    this.rows = res.data.results;
                    this.totalSize = res.data.totalRecords;
                } else {
                    this.toastr.error(res.message);
                    this.rows = [];
                    this.totalSize = 0;
                }
            }, error => {
                this.toastr.error(error);
            })
    }

    disableButton() {
        if (this.searchValue === null || this.searchValue === undefined || this.searchValue === '') {
            this.btnDisable = true;
        } else {
            this.btnDisable = false;
        }
    }
}
