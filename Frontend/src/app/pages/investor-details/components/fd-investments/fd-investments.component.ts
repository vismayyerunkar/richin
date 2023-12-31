import { DatePipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { StatusFilter } from 'src/constants/global-constants';
import {
  IFDInvestmentListResponse,
  SmartInvestment,
} from 'src/models/investor';
import { InvestorService } from 'src/services/investor.service';

@Component({
  selector: 'app-fd-investments',
  templateUrl: './fd-investments.component.html',
  styleUrls: ['./fd-investments.component.scss'],
})
export class FDInvestmentsComponent implements OnInit {
  fdInvestmentList: Array<SmartInvestment> = [];
  statusOption: Array<string> = StatusFilter.options;
  selectedStatus: string | null = null;
  offset: number = 0;
  limit: number = 10;
  totalCount: number = 0;
  selectedDate: any = null;
  loading: boolean = true;
  @Input() userId: any = '';
  selectedSort: any = null;
  sortOption: any[] = [
    { name: 'ASC Created_on', value: 'created_on' },
    { name: 'DESC Created_on', value: '-created_on' },
  ];

  constructor(
    private investorService: InvestorService,
    public messageService: MessageService,
    public datepipe: DatePipe
  ) {}

  ngOnInit() {
    this.selectedSort = this.sortOption[0];
    this.getFDInvestments();
  }

  getFDInvestments() {
    this.loading = true;
    let status: string = this.selectedStatus ? this.selectedStatus : '';

    let startDate;
    let endDate;
    if (
      this.selectedDate &&
      this.selectedDate[0] != null &&
      this.selectedDate[1] != null
    ) {
      startDate = this.datepipe.transform(this.selectedDate[0], 'yyyy-MM-dd');
      endDate = this.datepipe.transform(this.selectedDate[1], 'yyyy-MM-dd');
    } else {
      startDate = '';
      endDate = '';
    }

    this.investorService
      .fetchFDInvestmentList(
        this.offset,
        this.limit,
        status,
        startDate,
        endDate,
        this.selectedSort.value,
        this.userId
      )
      .subscribe({
        next: (res: IFDInvestmentListResponse) => {
          this.totalCount = res.data.count;
          this.fdInvestmentList = res.data.investments;
          console.log('FD Investment List Response:', res);
        },
        error: (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Something went wrong',
            detail: err.error.message,
          });
          console.error('FD Investment List Error:', err);
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  changeFilterDate() {
    if (this.selectedDate[0] != null && this.selectedDate[1] != null) {
      this.offset = 0;
      this.getFDInvestments();
    }
  }

  filterChange() {
    this.offset = 0;
    this.getFDInvestments();
  }

  clearFilter() {
    this.selectedStatus = null;
    this.selectedSort = this.sortOption[0];
    this.offset = 0;
    this.limit = 10;
    this.selectedDate = null;
    this.getFDInvestments();
  }

  paginate(event: any) {
    this.offset = event.first;
    this.limit = event.rows;
    this.getFDInvestments();
  }
}
