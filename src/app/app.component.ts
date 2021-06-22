import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import WebViewer from '@pdftron/webviewer';
import { Marksheet } from "./marksheet.model";

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
  
  marksheet: Marksheet = new Marksheet();
  downloadMarksheet: Marksheet =  new Marksheet();

  //public nameForm:FormGroup;
  public nameForm = new FormGroup({
    subCode:new FormControl(''),
    sec:new FormControl(''),
    examName:new FormControl(''),
    name: new FormControl(''),
    roll: new FormControl(''),
    sum: new FormControl(''),
    
  });
  

  constructor(private formBuilder: FormBuilder) {


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
      subCode:this.formBuilder.control(null,[Validators.required,Validators.pattern('[ A-Za-z0-9]*')]),
      sec:this.formBuilder.control(null,Validators.required),
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
      this.wvInstance.annotManager.deleteAnnotation(fin_sum);

      //this.wvInstance.annotManager.deleteAnnotation(this.sum_annot);
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

      // this.marksheet.subDetails.subCode = this.nameForm.controls['subCode'].value;
      // this.marksheet.subDetails.sec = this.nameForm.controls['sec'].value;
      // this.marksheet.subDetails.examName = this.nameForm.controls['examName'].value;
      // this.marksheet.marks.name = this.nameForm.controls['name'].value;
      // this.marksheet.marks.roll = this.nameForm.controls['roll'].value;
      this.marksheet.marks.score = sum;

      console.log(this.marksheet);

      // this.nameForm = this.formBuilder.group({
      //   subCode: this.formBuilder.control(this.marksheet.subDetails.subCode, [Validators.required,Validators.pattern('[A-Za-z0-9]*')]),
      //   sec: this.formBuilder.control(this.marksheet.subDetails.sec, Validators.required),
      //   examName: this.formBuilder.control(this.marksheet.subDetails.examName, [Validators.required,Validators.pattern('[A-Za-z0-9]*')]),
      //   name: this.formBuilder.control(this.marksheet.marks.name, Validators.required),
      //   roll: this.formBuilder.control(this.marksheet.marks.roll, Validators.required),
      //   sum: this.formBuilder.control(this.marksheet.marks.score),
      // });

      // console.log(this.nameForm);

    }
  }

  wvDocumentLoadedHandler(instance: any): void {
    instance.setZoomLevel('100%');
    // you can access docViewer object for low-level APIs
    // and access classes defined in the WebViewer iframe
    // const { Annotations, annotManager, docViewer } = this.wvInstance;
    // const rectangle = new Annotations.RectangleAnnotation();
    // rectangle.PageNumber = 1;
    // rectangle.X = 100;
    // rectangle.Y = 100;
    // rectangle.Width = 250;
    // rectangle.Height = 250;
    // rectangle.StrokeThickness = 5;
    // rectangle.Author = annotManager.getCurrentUser();
    // annotManager.addAnnotation(rectangle);
    // annotManager.drawAnnotations(rectangle.PageNumber);
    // see https://www.pdftron.com/api/web/WebViewer.html for the full list of low-level APIs
  }

  downloadMarks(){
  
    this.downloadMarksheet.subDetails.subCode = this.nameForm.controls['subCode'].value;
    this.downloadMarksheet.subDetails.sec = this.nameForm.controls['sec'].value;
    this.downloadMarksheet.subDetails.examName = this.nameForm.controls['examName'].value;
    console.log(this.downloadMarksheet);
   
  }
  
}
