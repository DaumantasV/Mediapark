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
import {
  NgForm,
  FormBuilder,
  FormGroup,
  Validators,
  FormControl,
} from '@angular/forms';

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
  newColumn = false;
  newColumnName: string;

  @ViewChild(MatSort) sort: MatSort;
  @ViewChild('editDialog') editTemplate: TemplateRef<any>;
  @ViewChild('warningDialog') warningTemplate: TemplateRef<any>;

  constructor(
    public editDialog: MatDialog,
    public warningDialog: MatDialog,
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

  get newCol() {
    return this.bandForm.get('newCol');
  }

  ngOnInit() {
    if (!('bandList' in sessionStorage)) {
      sessionStorage.setItem('bandList', JSON.stringify(this.initialBands));
    }

    if(('newColumn' in sessionStorage)) {
      this.newColumn = true;
      this.newColumnName = sessionStorage.getItem('newColumn');
    }

    if(('displayedColumns' in sessionStorage)) {
      this.displayedColumns = JSON.parse(sessionStorage.getItem('displayedColumns')).displayedColumns;
    }

    this.bandForm = this.formBuilder.group({
      id: [this.getID()],
      name: ['', [Validators.required, Validators.minLength(3)]],
      genre: ['', [Validators.required, Validators.minLength(3)]],
      activeSince: ['', [Validators.required, Validators.max(2019)]],
      newCol: [''],
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
    this.dialogRef = this.editDialog.open(this.editTemplate, {
      width: '80%',
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

  addColumn(columnNameForm: NgForm): void {
    this.newColumn = true;
    this.newColumnName = columnNameForm.value.name;
    sessionStorage.setItem('newColumn', this.newColumnName);
    this.displayedColumns.splice(5, 0, 'newCol');
    sessionStorage.setItem('displayedColumns', JSON.stringify({displayedColumns: this.displayedColumns}));
  }

  isWarningDialog(): boolean {
    var isTrue: boolean
    this.getBandList().forEach(band => {
      if (band.newCol !== '') {
        isTrue = true;
      }
    })
    if (isTrue){
      return true;
    }
    return false;
  }

  onRemoveColumnClick(): void {
    if(this.isWarningDialog()) {
      this.dialogRef = this.warningDialog.open(this.warningTemplate, {
        width: '80%',
      });
  
      this.dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.removeColumn();
        }
      });
    } else {
      this.removeColumn();
    } 
  }

  removeColumn(): void {
    sessionStorage.removeItem('newColumn');
    sessionStorage.removeItem('displayedColumns');
    this.displayedColumns = this.displayedColumns.filter(column => column !== 'newCol');
    const noColList = this.getBandList().map(band => {
      const clearedBand = band;
      clearedBand.newCol = '';
      return clearedBand;
    });
    sessionStorage.setItem('bandList', JSON.stringify(noColList));
    this.newColumn = false;
  }

  logout(): void {
    this.authService.logout();
  }
}
