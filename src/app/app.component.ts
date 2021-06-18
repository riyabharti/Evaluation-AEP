import { Component, ViewChild, OnInit, ElementRef, AfterViewInit } from '@angular/core';
import WebViewer from '@pdftron/webviewer';

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
  // @ViewChild('picker') picker: ElementRef;
  wvInstance: any;

  ngAfterViewInit(): void {

    WebViewer({
      path: '../lib',
      initialDoc: '../files/helper.pdf'
    }, this.viewer.nativeElement).then(instance => {
      document.getElementById('file-picker').onchange = function(e?: HTMLInputEvent) {
        const file = e.target.files[0];
        if (file) {
          instance.loadDocument(file);
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
  }

  finalSum() {
    let fin_sum:any;
    const { Annotations, annotManager, docViewer } = this.wvInstance;
    let values = annotManager.getAnnotationsList();
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      if (values[i].Subject === "Free Text") {
        if(values[i].intent === "Final Sum"){
            fin_sum= values[i];
        }
        else{
          let val = values[i].getContents();
          if (Number(val)) {
            let marks = Number(val);
            sum += marks;
          }
        }
        
      }
      
    }
    console.log("Sum= ", sum);
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
}
