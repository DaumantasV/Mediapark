import {
  Component,
  OnInit,
  ViewChild,
  TemplateRef,
  HostListener,
} from '@angular/core';
import {
  MatSort,
  MatTableDataSource,
  MatDialogRef,
  MatDialog,
} from '@angular/material';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AuthService } from '../auth/auth.service';
import { Band } from '../band.model';
import { BANDS } from '../bands';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
})
export class ListComponent implements OnInit {
  initialBands = BANDS;
  dataSource = new MatTableDataSource(this.initialBands);
  bandForm: FormGroup;
  dialogRef: MatDialogRef<any>;
  displayedColumns: string[] = [
    'id',
    'name',
    'genre',
    'activeSince',
    'state',
    'actions',
  ];
  userActivity;
  userInactive: Subject<any> = new Subject();

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('dialog') dialogTemplate: TemplateRef<any>;

  constructor(
    public dialog: MatDialog,
    private formBuilder: FormBuilder,
    private authService: AuthService,
  ) {
    this.setTimeout();
    this.userInactive.subscribe(() => {
      this.logout();
    });
  }

  get id() {
    return this.bandForm.get('id');
  }

  get name() {
    return this.bandForm.get('name');
  }

  get genre() {
    return this.bandForm.get('genre');
  }

  get activeSince() {
    return this.bandForm.get('activeSince');
  }

  get state() {
    return this.bandForm.get('state');
  }

  ngOnInit() {
    if (!('bandList' in sessionStorage)) {
      sessionStorage.setItem('bandList', JSON.stringify(this.initialBands));
    }

    this.bandForm = this.formBuilder.group({
      id: [this.getID()],
      name: ['', [Validators.required, Validators.minLength(3)]],
      genre: ['', [Validators.required, Validators.minLength(3)]],
      activeSince: ['', [Validators.required, Validators.max(2019)]],
      state: ['', [Validators.required, Validators.minLength(3)]],
    });

    this.setDataSource();
  }

  setTimeout() {
    this.userActivity = setTimeout(
      () => this.userInactive.next(undefined),
      300000,
    );
  }

  @HostListener('window:mousemove') refreshUserState() {
    clearTimeout(this.userActivity);
    this.setTimeout();
  }

  getBandList(): Band[] {
    return JSON.parse(sessionStorage.getItem('bandList'));
  }

  getID(): number {
    return Math.max(...this.getBandList().map(band => band.id)) + 1;
  }

  resetForm(): void {
    this.bandForm.reset();
    this.id.setValue(this.getID());
    Object.keys(this.bandForm.controls).forEach(key => {
      this.bandForm.get(key).markAsUntouched();
    });
  }

  setDataSource(): void {
    this.dataSource = new MatTableDataSource(this.getBandList());
    this.dataSource.sort = this.sort;
  }

  addBand(): void {
    sessionStorage.setItem(
      'bandList',
      JSON.stringify(this.getBandList().concat(this.bandForm.value)),
    );
    this.resetForm();
    this.setDataSource();
  }

  removeBand(id: number): void {
    sessionStorage.setItem(
      'bandList',
      JSON.stringify(this.getBandList().filter(band => band.id !== id)),
    );
    this.setDataSource();
  }

  editBand(id: number): void {
    const editBand = this.getBandList().filter(band => band.id === id);
    this.bandForm.setValue(editBand[0]);
    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '75%',
    });

    this.dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result) {
        sessionStorage.setItem(
          'bandList',
          JSON.stringify(
            this.getBandList().map(band =>
              band.id === id ? this.bandForm.value : band,
            ),
          ),
        );
        this.setDataSource();
      }
      this.resetForm();
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
