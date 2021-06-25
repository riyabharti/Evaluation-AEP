import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import WebViewer from '@pdftron/webviewer';
import { Marksheet, marks, subDetails } from "./marksheet.model";
import { MarksService } from './services/marks.service';
import * as XLSX from 'xlsx';
import { BsModalRef, BsModalService, ModalOptions} from 'ngx-bootstrap/modal';


interface HTMLInputEvent extends Event {
  target: HTMLInputElement & EventTarget;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('viewer') viewer: ElementRef;
  
  wvInstance: any;
 // modalRef: BsModalRef;
  marksheet: Marksheet = new Marksheet();
  downloadMarksheet: Marksheet =  new Marksheet();
  subMarks: marks[];

  //public nameForm:FormGroup;
  public nameForm = new FormGroup({
    subCode:new FormControl(''),
    sec:new FormControl(''),
    examName:new FormControl(''),
    name: new FormControl(''),
    roll: new FormControl(''),
    sum: new FormControl(''),
    
  });
  

  constructor(
    private formBuilder: FormBuilder,
    private marksService: MarksService
    ) {


  }
  ngAfterViewInit(): void {
    let self = this;
    WebViewer({
      path: '../lib',
      initialDoc: '../files/helper.pdf'
    }, this.viewer.nativeElement).then(instance => {
      document.getElementById('file-picker').onchange = function(e?: HTMLInputEvent) {
        const file = e.target.files[0];
        if (file) {
          instance.loadDocument(file);
          self.nameForm.controls['name'].setValue(null);
          self.nameForm.get('roll').setValue(null);
        }
      };
      instance.disableElements(['toolbarGroup-Shapes','toolbarGroup-Edit',
      'stickyToolGroupButton','fileAttachmentToolGroupButton','calloutToolGroupButton']);
      
      this.wvInstance = instance;
      // now you can access APIs through this.webviewer.getInstance()
      // instance.openElements(['notesPanel']);
      // see https://www.pdftron.com/documentation/web/guides/ui/apis for the full list of APIs

      // or listen to events from the viewer element
      // this.viewer.nativeElement.addEventListener('pageChanged', (e) => {
      //   const [ pageNumber ] = e.detail;
      //   console.log(`Current page is ${pageNumber}`);
      // });

      // or from the docViewer instance
      instance.docViewer.on('annotationsLoaded', () => {
        console.log('annotations loaded');
      });

      instance.docViewer.on('documentLoaded', function() {
        instance.setZoomLevel('100%'); 
      });
    })
  }

  ngOnInit() {
    this.wvDocumentLoadedHandler = this.wvDocumentLoadedHandler.bind(this);
    
    this.nameForm = this.formBuilder.group({
      subCode:this.formBuilder.control(null,[Validators.required,Validators.pattern('[ A-Za-z0-9-]*')]),
      sec:this.formBuilder.control(null,[Validators.required,Validators.pattern('[ A-Za-z0-9]*')]),
      examName:this.formBuilder.control(null,[Validators.required,Validators.pattern('[ A-Za-z0-9]*')]),
      name: this.formBuilder.control(null,Validators.required),
      roll: this.formBuilder.control(null,Validators.required),
      sum: this.formBuilder.control(null),
    });

    console.log(this.nameForm.status);
    console.log(this.nameForm);
  }


  finalSum() {

    this.marksheet.subDetails.subCode = this.nameForm.controls['subCode'].value;
    this.marksheet.subDetails.sec = this.nameForm.controls['sec'].value;
    this.marksheet.subDetails.examName = this.nameForm.controls['examName'].value;
    this.marksheet.marks.name = this.nameForm.controls['name'].value;
    this.marksheet.marks.roll = this.nameForm.controls['roll'].value;

    if (confirm('Please confirm that all the values are correct\n' + 'name : ' + this.marksheet.marks.name + '\nroll.no : ' + this.marksheet.marks.roll + '\nsection : ' + this.marksheet.subDetails.sec + '\nsubject code : ' + this.marksheet.subDetails.subCode + '\nexam name : ' + this.marksheet.subDetails.examName)) {
      let fin_sum: any;
      const { Annotations, annotManager, docViewer } = this.wvInstance;
      let values = annotManager.getAnnotationsList();
      let sum = 0;
      for (let i = 0; i < values.length; i++) {
        if (values[i].Subject === "Free Text") {
          if (values[i].intent === "Final Sum") {
            fin_sum = values[i];
          }
          else {
            let val = values[i].getContents();
            if (Number(val)) {
              let marks = Number(val);
              sum += marks;
            }
          }

        }

      }
      this.marksheet.marks.score = sum;
      this.marksService.updateMarks(this.marksheet).subscribe(
        result=>{
          if(result.status)
          {
              this.wvInstance.annotManager.deleteAnnotation(fin_sum);
              const rectangle = new Annotations.FreeTextAnnotation();
              rectangle.PageNumber = 1;
              rectangle.X = 400;
              rectangle.Y = 10;
              rectangle.Width = 100;
              rectangle.Height = 100;
              rectangle.FontSize = '48pt';
              rectangle.setIntent("Final Sum");
              rectangle.setPadding(new Annotations.Rect(0, 0, 0, 0));
              rectangle.setContents(`${sum}`);
              annotManager.addAnnotation(rectangle);
              annotManager.redrawAnnotation(rectangle);
          }
          else {
            alert(result.message);
          }
          console.log(result);
         
        },
        error=> {
          console.log(error);
          alert(error);
        }
      )
      

      //this.wvInstance.annotManager.deleteAnnotation(this.sum_annot);
      

      

      console.log(this.marksheet);

    }
  }

  wvDocumentLoadedHandler(instance: any): void {
    instance.setZoomLevel('100%');
  }

  downloadMarks(){
  
    this.downloadMarksheet.subDetails.subCode = this.nameForm.controls['subCode'].value;
    this.downloadMarksheet.subDetails.sec = this.nameForm.controls['sec'].value;
    this.downloadMarksheet.subDetails.examName = this.nameForm.controls['examName'].value;
    this.marksService.fetchMarks(this.downloadMarksheet).subscribe(
      result => {
        if(result.status)
        {
          if(result.data){
            this.MarksheetToExcel(result.data.marks,this.downloadMarksheet.subDetails);
            console.log(result);
          }else{
            alert("No data exists this for this combination!!")
          }
        }
        else{
          console.log(result);
           alert(result.message);
        }  
      },
      error => {
        console.log(error);
        alert(error);
      }
    )
  }

  MarksheetToExcel(marksData: marks[],subDetails: subDetails)
  {
      this.subMarks=marksData.sort(function(a,b){
        if(a.roll<b.roll)
          return -1;
        return 1;
      });
      this.exportToExcel(this.subMarks,subDetails);
  }

  exportToExcel(marksData,subDetails: subDetails)
  {
    console.log(marksData);
    const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(marksData,{header: ['roll','name','score']});
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All_Data');
    XLSX.writeFile(wb, subDetails.subCode+'_'+subDetails.sec+'_'+subDetails.examName+'_marksheet.xlsx');

  }
  
  // public popUpErrorInfo(message: string, isLarge?: boolean): void {
  //   const modalConfig: ModalOptions = {
  //     class: (isLarge) ? 'modal-lg modal-dialog-centered' : 'modal-md modal-dialog-centered',
  //             backdrop: true,
  //             ignoreBackdropClick: false,
  //     initialState: {
  //       message: message
  //     },
  //   }
  //   this.modalRef = this.modalService.show(ErrorModalComponent, modalConfig);
  // }

}
